package com.eventmgmt.charges.service;

import com.eventmgmt.charges.model.ChargePrediction.EventMetrics;
import com.eventmgmt.charges.model.EventCategory;
import com.eventmgmt.charges.service.ml.LinearAlgebra;
import io.quarkus.runtime.Startup;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.util.Random;

/**
 * Modèle de régression linéaire réellement entraîné (moindres carrés / ridge) qui remplace
 * le moteur de règles pour la prédiction du coût total d'un événement. L'entraînement a lieu
 * au démarrage du service, sur un jeu de données synthétique généré à partir des structures
 * de coût historiques (AIChargePredictionService), avec un bruit gaussien simulant la
 * variabilité réelle des coûts constatés — même méthodologie que l'étude comparative
 * ia-studies/modele1_regression_lineaire.py, mais entraînée en Java et servie en production.
 */
@ApplicationScoped
@Startup
public class MLChargePredictionService {
    private static final Logger LOG = Logger.getLogger(MLChargePredictionService.class);

    private static final int TRAINING_SAMPLES = 600;
    private static final double RIDGE_LAMBDA = 2.0;
    private static final long SEED = 42L;

    // attendees, duration, catering, equipment, cityMultiplier, attendees*duration (staffing)
    private static final int NUM_FEATURES = 6;
    private static final int CAT_FEATURES = 5; // 3 dummies eventType + 2 dummies location
    private static final int TOTAL_FEATURES = NUM_FEATURES + CAT_FEATURES;

    @Inject
    AIChargePredictionService rulesEngine;

    private double[] featureMeans;
    private double[] featureStds;
    private double[] coefficients;
    private double intercept;
    private double r2Score;
    private double maeScore;
    private int trainingSampleCount;

    @PostConstruct
    void train() {
        Random random = new Random(SEED);
        int n = TRAINING_SAMPLES;

        EventMetrics[] samples = new EventMetrics[n];
        double[] labels = new double[n];
        EventCategory[] categories = EventCategory.values();
        String[] cities = {"Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Strasbourg", "Bordeaux"};
        String[] locations = {"venue", "online", "outdoor"};

        for (int i = 0; i < n; i++) {
            EventMetrics m = new EventMetrics();
            m.expectedAttendees = 5 + random.nextInt(196);
            m.eventType = categories[random.nextInt(categories.length)];
            m.durationHours = 1 + random.nextInt(10);
            m.city = cities[random.nextInt(cities.length)];
            m.cateringRequired = random.nextDouble() < 0.75;
            m.equipmentRequired = random.nextDouble() < 0.80;
            m.location = locations[random.nextInt(locations.length)];
            samples[i] = m;

            double trueCost = rulesEngine.computeGroundTruthCost(m);
            labels[i] = Math.max(0.0, trueCost + random.nextGaussian() * 150.0);
        }

        int testSize = n / 5;
        int trainSize = n - testSize;

        double[][] rawNumeric = new double[n][NUM_FEATURES];
        for (int i = 0; i < n; i++) {
            rawNumeric[i] = extractNumericFeatures(samples[i]);
        }

        featureMeans = new double[NUM_FEATURES];
        featureStds = new double[NUM_FEATURES];
        for (int f = 0; f < NUM_FEATURES; f++) {
            double sum = 0;
            for (int i = 0; i < trainSize; i++) sum += rawNumeric[i][f];
            featureMeans[f] = sum / trainSize;

            double sq = 0;
            for (int i = 0; i < trainSize; i++) sq += Math.pow(rawNumeric[i][f] - featureMeans[f], 2);
            featureStds[f] = Math.sqrt(sq / trainSize);
            if (featureStds[f] < 1e-9) featureStds[f] = 1.0;
        }

        double[][] designMatrix = new double[n][TOTAL_FEATURES + 1];
        for (int i = 0; i < n; i++) {
            designMatrix[i] = buildDesignRow(samples[i], rawNumeric[i]);
        }

        double[][] xTrain = new double[trainSize][];
        double[] yTrain = new double[trainSize];
        for (int i = 0; i < trainSize; i++) {
            xTrain[i] = designMatrix[i];
            yTrain[i] = labels[i];
        }

        double[] beta = fitRidge(xTrain, yTrain, RIDGE_LAMBDA);
        intercept = beta[0];
        coefficients = new double[TOTAL_FEATURES];
        System.arraycopy(beta, 1, coefficients, 0, TOTAL_FEATURES);

        double sumAbsError = 0;
        double sumSqError = 0;
        double meanY = 0;
        for (int i = trainSize; i < n; i++) meanY += labels[i];
        meanY /= testSize;

        double ssTot = 0;
        for (int i = trainSize; i < n; i++) {
            double predicted = intercept;
            for (int f = 0; f < TOTAL_FEATURES; f++) predicted += coefficients[f] * designMatrix[i][f + 1];
            double error = labels[i] - predicted;
            sumAbsError += Math.abs(error);
            sumSqError += error * error;
            ssTot += Math.pow(labels[i] - meanY, 2);
        }
        maeScore = sumAbsError / testSize;
        r2Score = ssTot > 0 ? 1 - (sumSqError / ssTot) : 0;
        trainingSampleCount = n;

        LOG.infof("Modèle de régression linéaire entraîné : R²=%.4f, MAE=%.2f TND (n=%d, test=%d)",
            r2Score, maeScore, n, testSize);
    }

    /**
     * Prédit le coût total d'un événement à partir du modèle de régression linéaire entraîné.
     * Garde-fou : hors du domaine d'entraînement, une régression linéaire peut extrapoler
     * vers des valeurs non plausibles (négatives ou proches de zéro) ; dans ce cas, on
     * retombe sur l'estimation du moteur de règles historique plutôt que d'exposer un coût
     * aberrant à l'organisateur.
     */
    public double predictTotalCost(EventMetrics metrics) {
        double[] raw = extractNumericFeatures(metrics);
        double[] row = buildDesignRow(metrics, raw);
        double predicted = intercept;
        for (int f = 0; f < TOTAL_FEATURES; f++) predicted += coefficients[f] * row[f + 1];

        if (predicted <= 0) {
            return rulesEngine.computeGroundTruthCost(metrics);
        }
        return predicted;
    }

    public ModelMetrics getModelMetrics() {
        var metrics = new ModelMetrics();
        metrics.modelType = "linear_regression";
        metrics.r2Score = r2Score;
        metrics.maeScore = maeScore;
        metrics.trainingSamples = trainingSampleCount;
        return metrics;
    }

    private double[] extractNumericFeatures(EventMetrics m) {
        double cityMultiplier = rulesEngine.getCityMultiplier(m.city);
        return new double[]{
            m.expectedAttendees,
            m.durationHours,
            m.cateringRequired ? 1.0 : 0.0,
            m.equipmentRequired ? 1.0 : 0.0,
            cityMultiplier,
            m.expectedAttendees * (double) m.durationHours
        };
    }

    private double[] buildDesignRow(EventMetrics m, double[] rawNumeric) {
        double[] row = new double[TOTAL_FEATURES + 1];
        row[0] = 1.0; // intercept
        for (int f = 0; f < NUM_FEATURES; f++) {
            row[f + 1] = (rawNumeric[f] - featureMeans[f]) / featureStds[f];
        }
        int base = NUM_FEATURES + 1;
        row[base]     = m.eventType == EventCategory.WORKSHOP ? 1.0 : 0.0;
        row[base + 1] = m.eventType == EventCategory.MEETUP ? 1.0 : 0.0;
        row[base + 2] = m.eventType == EventCategory.SEMINAR ? 1.0 : 0.0;
        row[base + 3] = "online".equals(m.location) ? 1.0 : 0.0;
        row[base + 4] = "outdoor".equals(m.location) ? 1.0 : 0.0;
        return row;
    }

    /** Régression ridge par équations normales : (XᵗX + λI)β = Xᵗy (intercept non régularisé). */
    private double[] fitRidge(double[][] x, double[] y, double lambda) {
        int n = x.length;
        int p = x[0].length;
        double[][] xtx = new double[p][p];
        double[] xty = new double[p];

        for (int i = 0; i < n; i++) {
            for (int a = 0; a < p; a++) {
                xty[a] += x[i][a] * y[i];
                for (int b = 0; b < p; b++) {
                    xtx[a][b] += x[i][a] * x[i][b];
                }
            }
        }
        for (int a = 1; a < p; a++) {
            xtx[a][a] += lambda;
        }
        return LinearAlgebra.solve(xtx, xty);
    }

    public static class ModelMetrics {
        public String modelType;
        public double r2Score;
        public double maeScore;
        public int trainingSamples;
    }
}
