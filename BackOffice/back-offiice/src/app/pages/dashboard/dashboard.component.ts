import { Component, OnInit, OnDestroy } from '@angular/core';
import Chart from 'chart.js';
import { DashboardService } from '../../core/services/dashboard.service';
import { EventService } from '../../core/services/event.service';
import { UserService, UserResponse } from '../../core/services/user.service';
import { RegistrationService, Registration } from '../../core/services/registration.service';
import {
  AIAnalyticsService,
  ForecastResult,
  AnomalyResult,
  ClusterResult,
  CorrelationMatrix,
  HealthScore
} from '../../core/services/ai-analytics.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  // ── Charts ──────────────────────────────────────────────────
  private performanceChart: any;
  private shipmentsChart:   any;
  private salesChart:       any;
  private tasksChart:       any;
  private forecastChart:    any;
  private anomalyChart:     any;
  private clusterChart:     any;

  // ── Raw data ─────────────────────────────────────────────────
  public dashboardStats: any   = {};
  public events:         any[] = [];
  public users:          UserResponse[]  = [];
  public registrations:  Registration[] = [];

  // ── UI state ─────────────────────────────────────────────────
  public loading  = true;
  public error: string | null = null;
  public activeTab = 'accounts';

  // ── KPIs ─────────────────────────────────────────────────────
  public totalShipments  = 0;
  public dailySales      = 0;
  public completedTasks  = 0;

  // ── Monthly series ────────────────────────────────────────────
  public monthlyData:      number[] = [];
  public monthlyPurchases: number[] = [];
  public monthlySessions:  number[] = [];

  // ── AI outputs ────────────────────────────────────────────────
  public aiRecommendations: string[]          = [];
  public healthScore:        HealthScore | null = null;
  public predictions:        number[]          = [];

  // ── New AI outputs ────────────────────────────────────────────
  public forecastResult:     ForecastResult | null    = null;
  public anomalies:          AnomalyResult[]          = [];
  public anomalyCount:       number                   = 0;
  public clusterResult:      ClusterResult | null     = null;
  public correlationMatrix:  CorrelationMatrix | null = null;

  // Mois labels for display
  public readonly MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

  constructor(
    private dashboardSvc:    DashboardService,
    private eventSvc:        EventService,
    private userSvc:         UserService,
    private registrationSvc: RegistrationService,
    public  aiSvc:           AIAnalyticsService
  ) {}

  ngOnInit()    { this.loadDashboardData(); }
  ngOnDestroy() { this._destroyAllCharts(); }

  // ============================================================
  // DATA LOADING
  // ============================================================

  loadDashboardData() {
    this.loading = true;
    this.error   = null;

    this.dashboardSvc.getDashboardStats().subscribe(
      stats => {
        this.dashboardStats = stats;
        this.loading        = false;
        setTimeout(() => this.processDataAndInitCharts(), 300);
      },
      () => {
        this.error   = 'Erreur de chargement — données de démonstration affichées';
        this.loading = false;
        setTimeout(() => this.processDataAndInitCharts(), 300);
      }
    );

    this.eventSvc.getAllEvents().subscribe(
      ev  => { this.events = ev; },
      ()  => { this.events = []; }
    );

    this.userSvc.getAllUsers().subscribe(
      us  => { this.users = us; },
      ()  => { this.users = []; }
    );

    this.registrationSvc.getAllRegistrations().subscribe(
      reg => { this.registrations = reg; },
      ()  => { this.registrations = []; }
    );
  }

  processDataAndInitCharts() {
    this.calculateMetrics();
    this.generateMonthlyData();

    // Charts de base
    this.initPerformanceChart();
    this.initShipmentsChart();
    this.initSalesChart();
    this.initTasksChart();

    // Analyses IA
    this.generateAIInsights();
    this.runAdvancedAI();
  }

  // ============================================================
  // METRICS
  // ============================================================

  calculateMetrics() {
    this.totalShipments = this.dashboardStats?.totalRegistrations || this.registrations?.length || 0;

    const today = new Date();
    const todayEvts = this.events.filter(e => {
      const d = new Date(e.startDate);
      return d.toDateString() === today.toDateString();
    });
    this.dailySales = todayEvts.length * 350;

    const now = new Date();
    this.completedTasks = this.events.filter(e => new Date(e.startDate) < now).length;
  }

  generateMonthlyData() {
    const mReg   = new Array(12).fill(0);
    const mEvts  = new Array(12).fill(0);

    this.registrations.forEach(r => {
      const dateStr = r.registeredAt || r.registrationDate || r.createdAt;
      if (dateStr) mReg[new Date(dateStr).getMonth()]++;
    });
    this.events.forEach(e => {
      const dateStr = e.startAt || e.startDate;
      if (dateStr) mEvts[new Date(dateStr).getMonth()]++;
    });

    const hasReal = this.registrations.length > 0 || this.events.length > 0;

    if (hasReal) {
      const maxR = Math.max(...mReg, 1);
      const maxE = Math.max(...mEvts, 1);
      this.monthlyData      = mReg.map(v => Math.round((v / maxR) * 100 + 20));
      this.monthlyPurchases = mEvts.map(v => Math.round((v / maxE) * 100 + 20));
      this.monthlySessions  = mReg.map((v, i) =>
        Math.round(((v + mEvts[i]) / 2) + Math.random() * 20)
      );
    } else {
      this.monthlyData      = [100, 70, 90, 70, 85, 60, 75, 60, 90, 80, 110, 100];
      this.monthlyPurchases = [80, 120, 105, 110, 95, 105, 90, 100, 80, 95, 70, 120];
      this.monthlySessions  = [60, 80, 65, 130, 80, 105, 90, 130, 70, 115, 60, 130];
    }
  }

  // ============================================================
  // AI — BASIC INSIGHTS (health score + smart recs)
  // ============================================================

  generateAIInsights() {
    this.aiSvc.generateSmartRecommendations({
      monthlyAccounts:   this.monthlyData,
      monthlyPurchases:  this.monthlyPurchases,
      monthlySessions:   this.monthlySessions
    }).subscribe(recs => this.aiRecommendations = recs);

    this.aiSvc.calculateHealthScore({
      events:                this.events.length,
      users:                 this.users.length,
      registrations:         this.registrations.length,
      completedTasks:        this.completedTasks,
      monthlyRegistrations:  this.monthlyData
    }).subscribe(score => this.healthScore = score);

    this.aiSvc.predictTrends(this.monthlyData)
      .subscribe(p => this.predictions = p);
  }

  // ============================================================
  // AI — ADVANCED MODELS
  // ============================================================

  runAdvancedAI() {
    // 1. Prévision automatique (Holt-Winters vs Polynomiale)
    this.aiSvc.forecastAuto(this.monthlyData, 3).subscribe(result => {
      this.forecastResult = result;
      setTimeout(() => this.initForecastChart(), 100);
    });

    // 2. Détection d'anomalies (IQR + Z-Score)
    this.aiSvc.detectAnomalies(this.monthlyData).subscribe(results => {
      this.anomalies     = results;
      this.anomalyCount  = results.filter(r => r.isAnomaly).length;
      setTimeout(() => this.initAnomalyChart(), 100);
    });

    // 3. K-Means clustering sur les inscriptions mensuelles
    this.aiSvc.clusterData(this.monthlyData, 3).subscribe(result => {
      this.clusterResult = result;
      setTimeout(() => this.initClusterChart(), 100);
    });

    // 4. Matrice de corrélation de Pearson
    this.correlationMatrix = this.aiSvc.computeCorrelationMatrix([
      { label: 'Inscriptions', data: this.monthlyData      },
      { label: 'Événements',   data: this.monthlyPurchases },
      { label: 'Sessions',     data: this.monthlySessions  }
    ]);
  }

  // ============================================================
  // CHART INITIALISATION
  // ============================================================

  initPerformanceChart() {
    const canvas = document.getElementById('performanceChart') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (this.performanceChart) this.performanceChart.destroy();

    const grad = ctx.createLinearGradient(0, 230, 0, 50);
    grad.addColorStop(1, 'rgba(233,32,16,0.2)');
    grad.addColorStop(0.4, 'rgba(233,32,16,0.0)');
    grad.addColorStop(0, 'rgba(233,32,16,0)');

    this.performanceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.MONTHS,
        datasets: [{
          label: this.getActiveDatasetLabel(),
          fill: true,
          backgroundColor: grad,
          borderColor: '#ec250d',
          borderWidth: 2,
          pointBackgroundColor: '#ec250d',
          pointBorderColor: 'rgba(255,255,255,0)',
          pointHoverBackgroundColor: '#ec250d',
          pointBorderWidth: 20,
          pointHoverRadius: 4,
          pointHoverBorderWidth: 15,
          pointRadius: 4,
          data: this.getActiveDataset()
        }]
      },
      options: {
        maintainAspectRatio: false,
        legend: { display: false },
        tooltips: { backgroundColor: '#f5f5f5', titleFontColor: '#333', bodyFontColor: '#666', mode: 'nearest', intersect: false },
        responsive: true,
        scales: {
          yAxes: [{ gridLines: { drawBorder: false, color: 'transparent', zeroLineColor: 'transparent' }, ticks: { suggestedMin: 50, suggestedMax: 150, padding: 20, fontColor: '#9a9a9a' } }],
          xAxes: [{ gridLines: { drawBorder: false, color: 'rgba(0,242,195,0.1)', zeroLineColor: 'transparent' }, ticks: { padding: 20, fontColor: '#9a9a9a' } }]
        }
      }
    });
  }

  initShipmentsChart() {
    const canvas = document.getElementById('shipmentsChart') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (this.shipmentsChart) this.shipmentsChart.destroy();

    const grad = ctx.createLinearGradient(0, 230, 0, 50);
    grad.addColorStop(1, 'rgba(233,32,16,0.2)');
    grad.addColorStop(0.4, 'rgba(233,32,16,0.0)');
    grad.addColorStop(0, 'rgba(233,32,16,0)');

    this.shipmentsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['1','2','3','4','5','6','7','8','9','10'],
        datasets: [{ label: 'Inscriptions', fill: true, backgroundColor: grad, borderColor: '#ec250d', borderWidth: 2, pointRadius: 0, data: this.monthlyData.slice(0, 10) }]
      },
      options: { maintainAspectRatio: false, legend: { display: false }, tooltips: { enabled: false }, scales: { yAxes: [{ display: false }], xAxes: [{ display: false }] } }
    });
  }

  initSalesChart() {
    const canvas = document.getElementById('salesChart') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (this.salesChart) this.salesChart.destroy();

    this.salesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['1','2','3','4','5','6'],
        datasets: [{ label: 'Ventes', backgroundColor: '#1d8cf8', borderColor: '#1d8cf8', borderWidth: 2, data: [50, 80, 60, 100, 70, 50] }]
      },
      options: { maintainAspectRatio: false, legend: { display: false }, tooltips: { enabled: false }, scales: { yAxes: [{ display: false }], xAxes: [{ display: false }] } }
    });
  }

  initTasksChart() {
    const canvas = document.getElementById('tasksChart') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (this.tasksChart) this.tasksChart.destroy();

    const grad = ctx.createLinearGradient(0, 230, 0, 50);
    grad.addColorStop(1, 'rgba(0,242,195,0.2)');
    grad.addColorStop(0.4, 'rgba(0,242,195,0.0)');
    grad.addColorStop(0, 'rgba(0,242,195,0)');

    this.tasksChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['1','2','3','4','5','6','7'],
        datasets: [{ label: 'Tâches', fill: true, backgroundColor: grad, borderColor: '#00f2c3', borderWidth: 2, pointRadius: 0, data: [90, 60, 80, 60, 90, 70, 80] }]
      },
      options: { maintainAspectRatio: false, legend: { display: false }, tooltips: { enabled: false }, scales: { yAxes: [{ display: false }], xAxes: [{ display: false }] } }
    });
  }

  // ── FORECAST CHART (historique + prévision + intervalles) ───

  initForecastChart() {
    const canvas = document.getElementById('forecastChart') as HTMLCanvasElement;
    if (!canvas || !this.forecastResult) return;
    const ctx = canvas.getContext('2d');
    if (this.forecastChart) this.forecastChart.destroy();

    const fr      = this.forecastResult;
    const histLen = fr.historical.length;
    const labels  = [
      ...this.MONTHS,
      'M+1', 'M+2', 'M+3'
    ];

    // Données historiques (avec null pour les mois futurs)
    const histData: (number | null)[]    = [...fr.historical, null, null, null];
    // Prévisions (avec null pour les mois passés)
    const forecastData: (number | null)[] = [...new Array(histLen).fill(null), ...fr.forecast];
    const upperData: (number | null)[]    = [...new Array(histLen).fill(null), ...fr.upperBound];
    const lowerData: (number | null)[]    = [...new Array(histLen).fill(null), ...fr.lowerBound];

    this.forecastChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Historique',
            data: histData,
            borderColor: '#1d8cf8',
            backgroundColor: 'rgba(29,140,248,0.08)',
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: '#1d8cf8',
            fill: false
          } as any,
          {
            label: 'Prévision IA',
            data: forecastData,
            borderColor: '#e14eca',
            backgroundColor: 'rgba(225,78,202,0.08)',
            borderWidth: 2,
            borderDash: [6, 3],
            pointRadius: 5,
            pointBackgroundColor: '#e14eca',
            fill: false
          } as any,
          {
            label: 'Borne haute (95%)',
            data: upperData,
            borderColor: 'rgba(225,78,202,0.3)',
            backgroundColor: 'rgba(225,78,202,0.12)',
            borderWidth: 1,
            borderDash: [3, 3],
            pointRadius: 0,
            fill: '+1'
          } as any,
          {
            label: 'Borne basse (95%)',
            data: lowerData,
            borderColor: 'rgba(225,78,202,0.3)',
            backgroundColor: 'rgba(225,78,202,0.12)',
            borderWidth: 1,
            borderDash: [3, 3],
            pointRadius: 0,
            fill: false
          } as any
        ]
      },
      options: {
        maintainAspectRatio: false,
        legend: { display: true, labels: { fontColor: '#9a9a9a', fontSize: 11 } },
        tooltips: { mode: 'index', intersect: false, backgroundColor: '#1e1e2f', titleFontColor: '#fff', bodyFontColor: '#ccc' },
        scales: {
          yAxes: [{ gridLines: { color: 'rgba(255,255,255,0.05)', zeroLineColor: 'transparent' }, ticks: { fontColor: '#9a9a9a', padding: 10 } }],
          xAxes: [{ gridLines: { color: 'rgba(255,255,255,0.05)', zeroLineColor: 'transparent' }, ticks: { fontColor: '#9a9a9a' } }]
        }
      }
    });
  }

  // ── ANOMALY CHART (barres colorées selon anomalie) ───────────

  initAnomalyChart() {
    const canvas = document.getElementById('anomalyChart') as HTMLCanvasElement;
    if (!canvas || !this.anomalies.length) return;
    const ctx = canvas.getContext('2d');
    if (this.anomalyChart) this.anomalyChart.destroy();

    const colors = this.anomalies.map(a => {
      if (!a.isAnomaly)            return 'rgba(29,140,248,0.7)';
      if (a.severity === 'high')   return 'rgba(253,93,147,0.9)';
      if (a.severity === 'medium') return 'rgba(255,141,114,0.85)';
      return 'rgba(255,200,100,0.8)';
    });

    this.anomalyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.MONTHS,
        datasets: [{
          label: 'Inscriptions mensuelles',
          data: this.monthlyData,
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 1
        }]
      },
      options: {
        maintainAspectRatio: false,
        legend: { display: false },
        tooltips: {
          callbacks: {
            afterLabel: (item: any) => {
              const a = this.anomalies[item.index];
              return a.isAnomaly ? `⚠ Anomalie (z=${a.zScore}) — ${a.direction === 'spike' ? 'pic' : 'creux'}` : '';
            }
          },
          backgroundColor: '#1e1e2f', titleFontColor: '#fff', bodyFontColor: '#ccc'
        },
        scales: {
          yAxes: [{ gridLines: { color: 'rgba(255,255,255,0.05)', zeroLineColor: 'transparent' }, ticks: { fontColor: '#9a9a9a' } }],
          xAxes: [{ gridLines: { display: false }, ticks: { fontColor: '#9a9a9a' } }]
        }
      }
    });
  }

  // ── CLUSTER DONUT CHART ───────────────────────────────────────

  initClusterChart() {
    const canvas = document.getElementById('clusterChart') as HTMLCanvasElement;
    if (!canvas || !this.clusterResult?.clusters?.length) return;
    const ctx = canvas.getContext('2d');
    if (this.clusterChart) this.clusterChart.destroy();

    const labels = this.clusterResult.clusters.map(c =>
      c.label === 'high-performance'   ? '🟢 Haute perf.'   :
      c.label === 'medium-performance' ? '🟡 Moy. perf.'    : '🔴 Basse perf.'
    );

    this.clusterChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: this.clusterResult.clusters.map(c => c.size),
          backgroundColor: this.clusterResult.clusters.map(c => c.color),
          borderWidth: 2,
          borderColor: '#27293d'
        }]
      },
      options: {
        maintainAspectRatio: false,
        legend: { display: true, position: 'bottom', labels: { fontColor: '#9a9a9a', fontSize: 11 } },
        cutoutPercentage: 70,
        tooltips: {
          callbacks: {
            label: (item: any, data: any) => {
              const c = this.clusterResult.clusters[item.index];
              return ` ${labels[item.index]}: ${c.size} mois (${c.percentage}%)`;
            }
          },
          backgroundColor: '#1e1e2f', titleFontColor: '#fff', bodyFontColor: '#ccc'
        }
      }
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================

  switchTab(tab: string) {
    this.activeTab = tab;
    if (this.performanceChart) {
      this.performanceChart.data.datasets[0].data  = this.getActiveDataset();
      this.performanceChart.data.datasets[0].label = this.getActiveDatasetLabel();
      this.performanceChart.update();
    }
  }

  getActiveDataset(): number[] {
    return this.activeTab === 'purchases' ? this.monthlyPurchases
         : this.activeTab === 'sessions'  ? this.monthlySessions
         : this.monthlyData;
  }

  getActiveDatasetLabel(): string {
    return this.activeTab === 'purchases' ? 'Événements / Achats'
         : this.activeTab === 'sessions'  ? 'Sessions actives'
         : 'Inscriptions';
  }

  formatNumber(n: number): string {
    return n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M'
         : n >= 1_000     ? (n / 1_000).toFixed(0)     + 'K'
         : String(n);
  }

  getHealthScoreClass(): string {
    if (!this.healthScore) return 'text-muted';
    return { excellent: 'text-success', good: 'text-info', fair: 'text-warning', poor: 'text-danger' }[this.healthScore.status] || 'text-muted';
  }

  getHealthScoreIcon(): string {
    if (!this.healthScore) return 'icon-bulb-63';
    return { excellent: 'icon-check-2', good: 'icon-trophy', fair: 'icon-alert-circle-exc', poor: 'icon-simple-remove' }[this.healthScore.status] || 'icon-bulb-63';
  }

  getTrendIcon(): string {
    if (!this.healthScore) return '→';
    return { improving: '↑', stable: '→', declining: '↓' }[this.healthScore.trend] || '→';
  }

  getTrendClass(): string {
    if (!this.healthScore) return '';
    return { improving: 'trend-up', stable: 'trend-stable', declining: 'trend-down' }[this.healthScore.trend] || '';
  }

  getCorrelationColor(value: number): string {
    const abs = Math.abs(value);
    if (abs >= 0.8) return value > 0 ? '#00f2c3' : '#fd5d93';
    if (abs >= 0.5) return value > 0 ? '#1d8cf8' : '#ff8d72';
    return 'rgba(255,255,255,0.1)';
  }

  getDimensionWidth(value: number, max: number): number {
    return Math.round((value / max) * 100);
  }

  private _destroyAllCharts() {
    [this.performanceChart, this.shipmentsChart, this.salesChart,
     this.tasksChart, this.forecastChart, this.anomalyChart, this.clusterChart]
      .forEach(c => { if (c) c.destroy(); });
  }
}
