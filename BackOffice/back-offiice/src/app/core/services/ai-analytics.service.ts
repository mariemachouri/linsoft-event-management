import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Service d'IA pour l'analyse et la prédiction des données du dashboard
 * Utilise des algorithmes de machine learning pour générer des insights
 */
@Injectable({
  providedIn: 'root'
})
export class AIAnalyticsService {

  constructor() { }

  /**
   * Prédire les tendances futures basées sur les données historiques
   * Utilise une régression linéaire simple
   */
  predictTrends(historicalData: number[]): Observable<number[]> {
    if (!historicalData || historicalData.length === 0) {
      return of([]);
    }

    // Calculer la tendance linéaire
    const n = historicalData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += historicalData[i];
      sumXY += i * historicalData[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Prédire les 3 prochains mois
    const predictions: number[] = [];
    for (let i = n; i < n + 3; i++) {
      const prediction = Math.round(slope * i + intercept);
      predictions.push(Math.max(0, prediction)); // Éviter les valeurs négatives
    }

    return of(predictions);
  }

  /**
   * Détecter les anomalies dans les données
   * Utilise la méthode des écarts-types
   */
  detectAnomalies(data: number[]): Observable<{index: number, value: number, isAnomaly: boolean}[]> {
    if (!data || data.length === 0) {
      return of([]);
    }

    // Calculer la moyenne et l'écart-type
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);

    // Identifier les anomalies (valeurs à plus de 2 écarts-types)
    const threshold = 2;
    const results = data.map((value, index) => ({
      index,
      value,
      isAnomaly: Math.abs(value - mean) > threshold * stdDev
    }));

    return of(results);
  }

  /**
   * Calculer le taux de croissance
   */
  calculateGrowthRate(currentValue: number, previousValue: number): number {
    if (previousValue === 0) return 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  }

  /**
   * Analyser les patterns saisonniers
   */
  detectSeasonality(monthlyData: number[]): Observable<{
    hasSeasonal: boolean;
    peakMonth: number;
    lowMonth: number;
    seasonalIndex: number[];
  }> {
    if (!monthlyData || monthlyData.length !== 12) {
      return of({
        hasSeasonal: false,
        peakMonth: 0,
        lowMonth: 0,
        seasonalIndex: []
      });
    }

    const average = monthlyData.reduce((sum, val) => sum + val, 0) / 12;
    const seasonalIndex = monthlyData.map(val => (val / average) * 100);

    const peakMonth = monthlyData.indexOf(Math.max(...monthlyData));
    const lowMonth = monthlyData.indexOf(Math.min(...monthlyData));

    // Calculer la variance pour déterminer si c'est saisonnier
    const variance = seasonalIndex.reduce((sum, val) => 
      sum + Math.pow(val - 100, 2), 0) / 12;
    
    const hasSeasonal = variance > 400; // Seuil arbitraire

    return of({
      hasSeasonal,
      peakMonth,
      lowMonth,
      seasonalIndex
    });
  }

  /**
   * Générer un score de santé global du système
   */
  calculateHealthScore(metrics: {
    events: number;
    users: number;
    registrations: number;
    completedTasks: number;
  }): Observable<{
    score: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations: string[];
  }> {
    // Score basé sur plusieurs facteurs
    let score = 0;
    const recommendations: string[] = [];

    // Facteur 1: Ratio inscriptions/événements (40%)
    const registrationRatio = metrics.events > 0 
      ? (metrics.registrations / metrics.events) 
      : 0;
    
    if (registrationRatio > 10) {
      score += 40;
    } else if (registrationRatio > 5) {
      score += 30;
      recommendations.push('Augmentez la capacité de vos événements pour accueillir plus de participants');
    } else if (registrationRatio > 2) {
      score += 20;
      recommendations.push('Améliorez vos campagnes marketing pour attirer plus de participants');
    } else {
      score += 10;
      recommendations.push('Urgent: Très peu d\'inscriptions par événement');
    }

    // Facteur 2: Taux de complétion (30%)
    const completionRate = metrics.events > 0 
      ? (metrics.completedTasks / metrics.events) 
      : 0;
    
    if (completionRate > 0.8) {
      score += 30;
    } else if (completionRate > 0.5) {
      score += 20;
      recommendations.push('Assurez le suivi des événements pour améliorer le taux de complétion');
    } else {
      score += 10;
      recommendations.push('Attention: Taux de complétion des événements faible');
    }

    // Facteur 3: Croissance utilisateurs (30%)
    const userGrowth = metrics.users;
    if (userGrowth > 100) {
      score += 30;
    } else if (userGrowth > 50) {
      score += 20;
      recommendations.push('Continuez vos efforts pour augmenter votre base d\'utilisateurs');
    } else {
      score += 10;
      recommendations.push('Développez votre stratégie d\'acquisition utilisateurs');
    }

    // Déterminer le statut
    let status: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 80) {
      status = 'excellent';
    } else if (score >= 60) {
      status = 'good';
    } else if (score >= 40) {
      status = 'fair';
    } else {
      status = 'poor';
    }

    return of({ score, status, recommendations });
  }

  /**
   * Générer des recommandations intelligentes basées sur les données
   */
  generateSmartRecommendations(data: {
    monthlyAccounts: number[];
    monthlyPurchases: number[];
    monthlySessions: number[];
  }): Observable<string[]> {
    const recommendations: string[] = [];

    // Analyser la tendance des comptes
    const accountsTrend = this.calculateTrend(data.monthlyAccounts);
    if (accountsTrend < -10) {
      recommendations.push('⚠️ Baisse significative des créations de comptes. Considérez une campagne marketing.');
    } else if (accountsTrend > 20) {
      recommendations.push('✅ Excellente croissance des comptes! Assurez un bon onboarding.');
    }

    // Analyser les achats
    const purchasesTrend = this.calculateTrend(data.monthlyPurchases);
    if (purchasesTrend < 0) {
      recommendations.push('📉 Les achats sont en baisse. Proposez des promotions ou nouveaux événements.');
    }

    // Analyser l\'engagement (sessions)
    const sessionsTrend = this.calculateTrend(data.monthlySessions);
    if (sessionsTrend < -15) {
      recommendations.push('👥 L\'engagement utilisateur diminue. Améliorez l\'expérience utilisateur.');
    }

    // Comparer comptes vs sessions
    const lastMonthAccounts = data.monthlyAccounts[data.monthlyAccounts.length - 1];
    const lastMonthSessions = data.monthlySessions[data.monthlySessions.length - 1];
    
    if (lastMonthSessions < lastMonthAccounts * 0.5) {
      recommendations.push('📱 Beaucoup de comptes inactifs. Envoyez des notifications de réengagement.');
    }

    // Si tout va bien
    if (recommendations.length === 0) {
      recommendations.push('🎉 Toutes les métriques sont positives! Continuez sur cette lancée.');
    }

    return of(recommendations);
  }

  /**
   * Calculer la tendance générale (slope de la régression)
   */
  private calculateTrend(data: number[]): number {
    const n = data.length;
    if (n < 2) return 0;

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += data[i];
      sumXY += i * data[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  /**
   * Prédire la charge du système pour le mois prochain
   */
  predictSystemLoad(currentMetrics: {
    events: number;
    users: number;
    registrations: number;
  }): Observable<{
    expectedEvents: number;
    expectedUsers: number;
    expectedRegistrations: number;
    recommendation: string;
  }> {
    // Simulation d'une prédiction basée sur une croissance moyenne
    const growthRate = 1.15; // 15% de croissance moyenne

    const prediction = {
      expectedEvents: Math.round(currentMetrics.events * growthRate),
      expectedUsers: Math.round(currentMetrics.users * growthRate),
      expectedRegistrations: Math.round(currentMetrics.registrations * growthRate),
      recommendation: ''
    };

    // Générer une recommandation
    const totalLoad = prediction.expectedEvents + prediction.expectedRegistrations;
    if (totalLoad > 1000) {
      prediction.recommendation = 'Charge élevée prévue. Considérez l\'optimisation de l\'infrastructure.';
    } else if (totalLoad > 500) {
      prediction.recommendation = 'Charge modérée prévue. Monitorer les performances du système.';
    } else {
      prediction.recommendation = 'Charge normale prévue. Aucune action requise.';
    }

    return of(prediction);
  }
}
