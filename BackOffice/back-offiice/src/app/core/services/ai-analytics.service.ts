import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

// ================================================================
// INTERFACES
// ================================================================

export interface ForecastResult {
  historical: number[];
  forecast: number[];
  upperBound: number[];
  lowerBound: number[];
  mape: number;
  rmse: number;
  model: 'holt-winters' | 'polynomial' | 'linear';
  confidence: number;
}

export interface AnomalyResult {
  index: number;
  value: number;
  isAnomaly: boolean;
  zScore: number;
  severity: 'low' | 'medium' | 'high';
  direction: 'spike' | 'dip' | 'normal';
}

export interface ClusterResult {
  clusters: EventCluster[];
  silhouetteScore: number;
  iterations: number;
}

export interface EventCluster {
  id: number;
  label: 'high-performance' | 'medium-performance' | 'low-performance';
  points: number[];
  centroid: number;
  size: number;
  color: string;
  percentage: number;
}

export interface CorrelationMatrix {
  labels: string[];
  matrix: number[][];
  strongCorrelations: { a: string; b: string; value: number; type: 'positive' | 'negative' }[];
}

export interface HealthScore {
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  dimensions: {
    engagement: number;
    growth: number;
    retention: number;
    activity: number;
    efficiency: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
}

export interface SeasonalityResult {
  hasSeasonal: boolean;
  peakMonth: number;
  lowMonth: number;
  seasonalIndex: number[];
  strengthIndex: number;
}

// ================================================================
// SERVICE
// ================================================================

@Injectable({ providedIn: 'root' })
export class AIAnalyticsService {

  // ==============================================================
  // 1. HOLT-WINTERS TRIPLE EXPONENTIAL SMOOTHING
  //    Handles level (α), trend (β) and seasonality (γ)
  // ==============================================================

  forecastWithHoltWinters(
    data: number[],
    alpha: number = 0.3,
    beta: number  = 0.1,
    gamma: number = 0.2,
    m: number     = 12,
    h: number     = 3
  ): ForecastResult {
    const n = data.length;

    if (n < m * 2) {
      return this.forecastWithPolynomial(data, h, 2);
    }

    // ── Initialisation ─────────────────────────────────────────
    let L = data.slice(0, m).reduce((a, b) => a + b, 0) / m;
    let T = (data.slice(m, 2 * m).reduce((a, b) => a + b, 0) / m - L) / m;
    const avgFirstCycle = L;
    const S: number[] = data.slice(0, m).map(v => avgFirstCycle > 0 ? v / avgFirstCycle : 1);

    // ── Lissage récursif ────────────────────────────────────────
    const fitted: number[] = [];
    for (let t = 0; t < n; t++) {
      const s = t % m;
      const Lprev = L;
      const Ssprev = S[s];

      L = alpha * (data[t] / (S[s] || 1)) + (1 - alpha) * (L + T);
      T = beta  * (L - Lprev)              + (1 - beta)  * T;
      S[s] = gamma * (data[t] / (L || 1)) + (1 - gamma) * Ssprev;

      fitted.push((Lprev + T) * Ssprev);
    }

    // ── Erreurs et intervalles de confiance ─────────────────────
    const errors  = data.map((d, i) => d - fitted[i]);
    const rmse    = Math.sqrt(errors.reduce((s, e) => s + e * e, 0) / n);
    const mape    = this.calculateMAPE(data, fitted);

    // ── Prévisions h périodes ───────────────────────────────────
    const forecast: number[]    = [];
    const upperBound: number[]  = [];
    const lowerBound: number[]  = [];

    for (let hi = 1; hi <= h; hi++) {
      const s   = (n + hi - 1) % m;
      const raw = (L + hi * T) * (S[s] || 1);
      const ci  = 1.96 * rmse * Math.sqrt(hi);

      forecast.push(Math.max(0, Math.round(raw)));
      upperBound.push(Math.round(raw + ci));
      lowerBound.push(Math.max(0, Math.round(raw - ci)));
    }

    return {
      historical: data,
      forecast,
      upperBound,
      lowerBound,
      mape,
      rmse: Math.round(rmse * 10) / 10,
      model: 'holt-winters',
      confidence: Math.max(0, Math.min(1, 1 - mape / 100))
    };
  }

  // ==============================================================
  // 2. RÉGRESSION POLYNOMIALE (degré 2)
  //    Résolution par équations normales + pivot de Gauss
  // ==============================================================

  forecastWithPolynomial(data: number[], h: number = 3, degree: number = 2): ForecastResult {
    const n = data.length;
    if (n < degree + 1) {
      return this._linearFallback(data, h);
    }

    // Matrice de Vandermonde X (n × degree+1)
    const X: number[][] = data.map((_, i) =>
      Array.from({ length: degree + 1 }, (__, d) => Math.pow(i, d))
    );

    const Xt      = this._transpose(X);
    const XtX     = this._matMul(Xt, X);
    const XtY     = this._matVec(Xt, data);
    const coeffs  = this._gaussianElim(XtX, XtY);

    const fitted  = data.map((_, i) =>
      coeffs.reduce((sum, c, d) => sum + c * Math.pow(i, d), 0)
    );
    const residuals = data.map((y, i) => y - fitted[i]);
    const se        = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / Math.max(1, n - degree - 1));

    const forecast:   number[] = [];
    const upperBound: number[] = [];
    const lowerBound: number[] = [];

    for (let hi = 1; hi <= h; hi++) {
      const t   = n + hi - 1;
      const raw = coeffs.reduce((sum, c, d) => sum + c * Math.pow(t, d), 0);
      const ci  = 1.96 * se * Math.sqrt(hi);

      forecast.push(Math.max(0, Math.round(raw)));
      upperBound.push(Math.round(raw + ci));
      lowerBound.push(Math.max(0, Math.round(raw - ci)));
    }

    const mape = this.calculateMAPE(data, fitted);
    const rmse = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / n);

    return {
      historical: data, forecast, upperBound, lowerBound,
      mape, rmse: Math.round(rmse * 10) / 10,
      model: 'polynomial',
      confidence: Math.max(0, Math.min(1, 1 - mape / 100))
    };
  }

  // ==============================================================
  // 3. SÉLECTION AUTOMATIQUE DU MEILLEUR MODÈLE
  //    Compare Holt-Winters vs Polynomiale via MAPE
  // ==============================================================

  forecastAuto(data: number[], h: number = 3): Observable<ForecastResult> {
    const hw   = this.forecastWithHoltWinters(data, 0.3, 0.1, 0.2, 12, h);
    const poly = this.forecastWithPolynomial(data, h, 2);
    return of(hw.mape <= poly.mape ? hw : poly);
  }

  // Rétrocompatibilité
  predictTrends(historicalData: number[]): Observable<number[]> {
    const r = this.forecastWithPolynomial(historicalData, 3, 2);
    return of(r.forecast);
  }

  // ==============================================================
  // 4. K-MEANS CLUSTERING (k=3 clusters)
  //    Initialisation équidistante + silhouette simplifié
  // ==============================================================

  clusterData(values: number[], k: number = 3, maxIter: number = 100): Observable<ClusterResult> {
    if (values.length < k) {
      return of({ clusters: [], silhouetteScore: 0, iterations: 0 });
    }

    const min = Math.min(...values);
    const max = Math.max(...values);

    // Centroids initiaux équidistants
    let centroids: number[] = Array.from({ length: k }, (_, i) =>
      k === 1 ? (min + max) / 2 : min + (max - min) * (i / (k - 1))
    );

    let assignments: number[] = new Array(values.length).fill(0);
    let iter = 0;

    for (; iter < maxIter; iter++) {
      const prev = [...assignments];

      // Affectation
      assignments = values.map(v => {
        let best = 0, bestDist = Infinity;
        centroids.forEach((c, ci) => {
          const d = Math.abs(v - c);
          if (d < bestDist) { bestDist = d; best = ci; }
        });
        return best;
      });

      if (JSON.stringify(assignments) === JSON.stringify(prev)) break;

      // Mise à jour des centroids
      centroids = centroids.map((_, ci) => {
        const pts = values.filter((__, i) => assignments[i] === ci);
        return pts.length > 0 ? pts.reduce((a, b) => a + b, 0) / pts.length : centroids[ci];
      });
    }

    // Trier par centroïde croissant
    const sorted = centroids.map((c, i) => ({ c, i })).sort((a, b) => a.c - b.c);
    const labels: Array<'low-performance' | 'medium-performance' | 'high-performance'> =
      ['low-performance', 'medium-performance', 'high-performance'];
    const colors = ['#ef5350', '#ff9800', '#66bb6a'];

    const total = values.length;
    const clusters: EventCluster[] = sorted.map(({ i: origIdx }, rank) => {
      const pts = values.filter((__, vi) => assignments[vi] === origIdx);
      return {
        id: rank,
        label: labels[rank],
        points: pts,
        centroid: Math.round(centroids[origIdx] * 10) / 10,
        size: pts.length,
        color: colors[rank],
        percentage: Math.round((pts.length / total) * 100)
      };
    });

    const silhouetteScore = this._silhouette(values, assignments, k);

    return of({ clusters, silhouetteScore, iterations: iter });
  }

  // ==============================================================
  // 5. DÉTECTION D'ANOMALIES  — IQR + Z-Score combinés
  // ==============================================================

  detectAnomalies(data: number[]): Observable<AnomalyResult[]> {
    if (!data || data.length < 4) {
      return of(data.map((value, index) => ({
        index, value, isAnomaly: false, zScore: 0,
        severity: 'low' as const, direction: 'normal' as const
      })));
    }

    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const std  = Math.sqrt(data.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / data.length);

    const sorted = [...data].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lo  = q1 - 1.5 * iqr;
    const hi  = q3 + 1.5 * iqr;

    return of(data.map((value, index) => {
      const zScore     = std > 0 ? Math.abs((value - mean) / std) : 0;
      const outsideIQR = value < lo || value > hi;
      const isAnomaly  = outsideIQR || zScore > 2.5;

      let severity: 'low' | 'medium' | 'high' = 'low';
      if (isAnomaly) {
        severity = zScore > 3.5 ? 'high' : zScore > 2.5 ? 'medium' : 'low';
      }
      const direction: 'spike' | 'dip' | 'normal' =
        !isAnomaly ? 'normal' : value > mean ? 'spike' : 'dip';

      return { index, value, isAnomaly, zScore: Math.round(zScore * 100) / 100, severity, direction };
    }));
  }

  // ==============================================================
  // 6. MATRICE DE CORRÉLATION DE PEARSON
  // ==============================================================

  computeCorrelationMatrix(datasets: { label: string; data: number[] }[]): CorrelationMatrix {
    const n = datasets.length;
    const matrix: number[][] = [];
    const strongCorrelations: { a: string; b: string; value: number; type: 'positive' | 'negative' }[] = [];

    for (let i = 0; i < n; i++) {
      matrix[i] = [];
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          const r = this._pearson(datasets[i].data, datasets[j].data);
          matrix[i][j] = Math.round(r * 100) / 100;
          if (i < j && Math.abs(r) >= 0.5) {
            strongCorrelations.push({
              a: datasets[i].label, b: datasets[j].label,
              value: matrix[i][j],
              type: r >= 0 ? 'positive' : 'negative'
            });
          }
        }
      }
    }

    return { labels: datasets.map(d => d.label), matrix, strongCorrelations };
  }

  // ==============================================================
  // 7. HEALTH SCORE MULTIDIMENSIONNEL (5 axes)
  // ==============================================================

  calculateHealthScore(metrics: {
    events: number;
    users: number;
    registrations: number;
    completedTasks: number;
    monthlyRegistrations?: number[];
    monthlyEvents?: number[];
  }): Observable<HealthScore> {

    // Axe 1 — Engagement (inscriptions / événements) — poids 35%
    const regPerEvent = metrics.events > 0 ? metrics.registrations / metrics.events : 0;
    const engagement  = Math.min(35, regPerEvent > 10 ? 35 : regPerEvent > 5 ? 28 : regPerEvent > 2 ? 18 : 8);

    // Axe 2 — Croissance (base utilisateurs) — poids 20%
    const growth = Math.min(20,
      metrics.users > 200 ? 20 : metrics.users > 100 ? 16 : metrics.users > 50 ? 12 : metrics.users > 10 ? 7 : 3
    );

    // Axe 3 — Rétention (events complétés / total) — poids 20%
    const retRate  = metrics.events > 0 ? metrics.completedTasks / metrics.events : 0;
    const retention = Math.min(20, retRate > 0.8 ? 20 : retRate > 0.5 ? 14 : retRate > 0.2 ? 8 : 3);

    // Axe 4 — Activité récente (tendance 3 derniers mois) — poids 15%
    let activity = 10;
    if (metrics.monthlyRegistrations && metrics.monthlyRegistrations.length >= 3) {
      const slope = this._slope(metrics.monthlyRegistrations.slice(-3));
      activity = slope > 3 ? 15 : slope > 0 ? 11 : slope > -3 ? 8 : 4;
    }

    // Axe 5 — Efficacité (taux complétion vs engagement) — poids 10%
    const effRate   = metrics.users > 0 ? metrics.events / metrics.users : 0;
    const efficiency = Math.min(10, effRate > 0.5 ? 10 : effRate > 0.1 ? 7 : effRate > 0.02 ? 4 : 2);

    const score = Math.round(engagement + growth + retention + activity + efficiency);

    const status: 'excellent' | 'good' | 'fair' | 'poor' =
      score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor';

    // Tendance globale
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (metrics.monthlyRegistrations && metrics.monthlyRegistrations.length >= 6) {
      const s = this._slope(metrics.monthlyRegistrations.slice(-6));
      trend = s > 2 ? 'improving' : s < -2 ? 'declining' : 'stable';
    }

    const recommendations = this._buildRecommendations({ regPerEvent, growth, retRate, effRate, metrics });

    return of({
      score,
      status,
      dimensions: { engagement, growth, retention, activity, efficiency },
      trend,
      recommendations
    });
  }

  // ==============================================================
  // 8. RECOMMANDATIONS INTELLIGENTES
  // ==============================================================

  generateSmartRecommendations(data: {
    monthlyAccounts: number[];
    monthlyPurchases: number[];
    monthlySessions: number[];
  }): Observable<string[]> {
    const recs: string[] = [];
    const aSlope = this._slope(data.monthlyAccounts);
    const pSlope = this._slope(data.monthlyPurchases);
    const sSlope = this._slope(data.monthlySessions);

    if (aSlope < -5)       recs.push('⚠️ Baisse des inscriptions. Lancez une campagne marketing ciblée.');
    else if (aSlope > 10)  recs.push('✅ Forte croissance des comptes! Soignez l\'onboarding.');

    if (pSlope < -2)       recs.push('📉 Achats en baisse. Proposez des promotions ou de nouveaux événements.');

    if (sSlope < -8)       recs.push('👥 Engagement en baisse. Améliorez l\'expérience utilisateur.');

    const lastSessions = data.monthlySessions[data.monthlySessions.length - 1] || 0;
    const lastAccounts = data.monthlyAccounts[data.monthlyAccounts.length - 1] || 0;
    if (lastAccounts > 0 && lastSessions < lastAccounts * 0.5) {
      recs.push('📱 Nombreux comptes inactifs. Envoyez des notifications de ré-engagement.');
    }

    // Corrélation achats-sessions
    const corr = this._pearson(data.monthlyPurchases, data.monthlySessions);
    if (corr > 0.7) recs.push('🔗 Forte corrélation achats/sessions. Les sessions convertissent bien!');
    if (corr < -0.5) recs.push('🔀 Corrélation inverse achats/sessions détectée. Analysez le parcours utilisateur.');

    if (recs.length === 0) recs.push('🎉 Toutes les métriques sont positives! Continuez sur cette lancée.');
    return of(recs);
  }

  // ==============================================================
  // 9. DÉTECTION DE SAISONNALITÉ (STL simplifié)
  // ==============================================================

  detectSeasonality(monthlyData: number[]): Observable<SeasonalityResult> {
    if (!monthlyData || monthlyData.length < 12) {
      return of({ hasSeasonal: false, peakMonth: 0, lowMonth: 0, seasonalIndex: [], strengthIndex: 0 });
    }

    const data    = monthlyData.slice(0, 12);
    const avg     = data.reduce((a, b) => a + b, 0) / 12;
    const si      = data.map(v => avg > 0 ? Math.round((v / avg) * 100) : 100);
    const peak    = data.indexOf(Math.max(...data));
    const low     = data.indexOf(Math.min(...data));
    const variance     = si.reduce((s, v) => s + Math.pow(v - 100, 2), 0) / 12;
    const strengthIndex = Math.min(100, Math.round(Math.sqrt(variance)));

    return of({ hasSeasonal: strengthIndex > 15, peakMonth: peak, lowMonth: low, seasonalIndex: si, strengthIndex });
  }

  // ==============================================================
  // 10. TAUX DE CROISSANCE & CHARGE PRÉVUE
  // ==============================================================

  calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }

  predictSystemLoad(currentMetrics: {
    events: number; users: number; registrations: number;
  }): Observable<{ expectedEvents: number; expectedUsers: number; expectedRegistrations: number; recommendation: string }> {
    const gr = 1.15;
    const p  = {
      expectedEvents:        Math.round(currentMetrics.events * gr),
      expectedUsers:         Math.round(currentMetrics.users  * gr),
      expectedRegistrations: Math.round(currentMetrics.registrations * gr),
      recommendation: ''
    };
    const total = p.expectedEvents + p.expectedRegistrations;
    p.recommendation = total > 1000
      ? 'Charge élevée prévue. Considérez l\'optimisation de l\'infrastructure.'
      : total > 500
        ? 'Charge modérée prévue. Monitorer les performances du système.'
        : 'Charge normale prévue. Aucune action requise.';
    return of(p);
  }

  // ==============================================================
  // UTILITAIRES PRIVÉS
  // ==============================================================

  public calculateMAPE(actual: number[], forecast: number[]): number {
    let sum = 0, count = 0;
    const n = Math.min(actual.length, forecast.length);
    for (let i = 0; i < n; i++) {
      if (actual[i] !== 0) { sum += Math.abs((actual[i] - forecast[i]) / actual[i]); count++; }
    }
    return count > 0 ? Math.round((sum / count) * 1000) / 10 : 0;
  }

  private _slope(data: number[]): number {
    const n = data.length;
    if (n < 2) return 0;
    let sx = 0, sy = 0, sxy = 0, sx2 = 0;
    for (let i = 0; i < n; i++) { sx += i; sy += data[i]; sxy += i * data[i]; sx2 += i * i; }
    const d = n * sx2 - sx * sx;
    return d !== 0 ? (n * sxy - sx * sy) / d : 0;
  }

  private _pearson(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;
    const mx = x.reduce((a, b) => a + b, 0) / n;
    const my = y.reduce((a, b) => a + b, 0) / n;
    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < n; i++) {
      num += (x[i] - mx) * (y[i] - my);
      dx  += Math.pow(x[i] - mx, 2);
      dy  += Math.pow(y[i] - my, 2);
    }
    const denom = Math.sqrt(dx * dy);
    return denom === 0 ? 0 : num / denom;
  }

  private _silhouette(vals: number[], assign: number[], k: number): number {
    let total = 0, count = 0;
    for (let i = 0; i < vals.length; i++) {
      const c = assign[i];
      const intra = vals.filter((_, j) => assign[j] === c && j !== i);
      if (intra.length === 0) continue;
      const a = intra.reduce((s, v) => s + Math.abs(v - vals[i]), 0) / intra.length;
      let minB = Infinity;
      for (let ci = 0; ci < k; ci++) {
        if (ci === c) continue;
        const other = vals.filter((_, j) => assign[j] === ci);
        if (!other.length) continue;
        const b = other.reduce((s, v) => s + Math.abs(v - vals[i]), 0) / other.length;
        minB = Math.min(minB, b);
      }
      if (minB !== Infinity) { total += (minB - a) / Math.max(a, minB); count++; }
    }
    return count > 0 ? Math.round((total / count) * 100) / 100 : 0;
  }

  // Algèbre linéaire pour régression polynomiale
  private _transpose(m: number[][]): number[][] {
    return m[0].map((_, i) => m.map(row => row[i]));
  }

  private _matMul(A: number[][], B: number[][]): number[][] {
    return A.map((row, i) =>
      B[0].map((_, j) => row.reduce((s, _v, k) => s + A[i][k] * B[k][j], 0))
    );
  }

  private _matVec(A: number[][], v: number[]): number[] {
    return A.map(row => row.reduce((s, a, j) => s + a * v[j], 0));
  }

  private _gaussianElim(A: number[][], b: number[]): number[] {
    const n = A.length;
    const M: number[][] = A.map((row, i) => [...row, b[i]]);
    for (let col = 0; col < n; col++) {
      let maxRow = col;
      for (let row = col + 1; row < n; row++) {
        if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
      }
      [M[col], M[maxRow]] = [M[maxRow], M[col]];
      for (let row = col + 1; row < n; row++) {
        if (!M[col][col]) continue;
        const f = M[row][col] / M[col][col];
        for (let k = col; k <= n; k++) M[row][k] -= f * M[col][k];
      }
    }
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = M[i][n];
      for (let j = i + 1; j < n; j++) x[i] -= M[i][j] * x[j];
      x[i] /= M[i][i] || 1;
    }
    return x;
  }

  private _linearFallback(data: number[], h: number): ForecastResult {
    const n = data.length;
    const slope = this._slope(data);
    const intercept = (data.reduce((a, b) => a + b, 0) - slope * data.reduce((s, _, i) => s + i, 0)) / n;
    const fitted     = data.map((_, i) => slope * i + intercept);
    const forecast   = Array.from({ length: h }, (_, i) => Math.max(0, Math.round(slope * (n + i) + intercept)));
    const se         = Math.sqrt(data.reduce((s, y, i) => s + Math.pow(y - fitted[i], 2), 0) / n);
    return {
      historical: data, forecast,
      upperBound: forecast.map((f, i) => f + Math.round(1.96 * se * Math.sqrt(i + 1))),
      lowerBound: forecast.map((f, i) => Math.max(0, f - Math.round(1.96 * se * Math.sqrt(i + 1)))),
      mape: this.calculateMAPE(data, fitted),
      rmse: Math.round(se * 10) / 10,
      model: 'linear',
      confidence: 0.6
    };
  }

  private _buildRecommendations(ctx: any): string[] {
    const recs: string[] = [];
    if (ctx.regPerEvent < 2)      recs.push('🚨 Taux d\'inscription critique. Revoyez votre stratégie marketing.');
    else if (ctx.regPerEvent < 5) recs.push('📢 Améliorez la visibilité de vos événements.');
    if (ctx.growth < 8)           recs.push('👤 Base utilisateurs faible. Envisagez un programme de parrainage.');
    if (ctx.retRate < 0.5)        recs.push('🔄 Taux de complétion bas. Analysez les raisons d\'abandon.');
    if (ctx.effRate > 0.5)        recs.push('⚡ Fort ratio événements/utilisateurs. Pensez à élargir l\'audience.');
    if (ctx.metrics.monthlyRegistrations) {
      const s = this._slope(ctx.metrics.monthlyRegistrations.slice(-3));
      if (s < -3)     recs.push('📉 Tendance négative récente. Investigez les facteurs de baisse.');
      else if (s > 5) recs.push('🚀 Croissance rapide! Préparez votre infrastructure.');
    }
    if (!recs.length) recs.push('✅ Excellentes performances! Maintenez cette dynamique.');
    return recs;
  }
}
