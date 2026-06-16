import { Component, OnInit, OnDestroy } from '@angular/core';
import Chart from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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

export interface ActivityItem {
  type: 'inscription' | 'evenement';
  description: string;
  date: Date;
  status: string;
  statusLabel: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  // ── Charts ───────────────────────────────────────────────────
  private performanceChart: any;
  private categoryChart: any;
  private statusChart: any;
  private forecastChart: any;
  private anomalyChart: any;
  private clusterChart: any;
  private kpiEventsChart: any;
  private kpiRegsChart: any;
  private kpiUsersChart: any;
  private kpiRateChart: any;

  // ── Raw data ─────────────────────────────────────────────────
  public events:         any[]      = [];
  public users:          UserResponse[]  = [];
  public registrations:  Registration[] = [];

  // ── UI state ─────────────────────────────────────────────────
  public loading            = true;
  public error: string|null = null;
  public activeTab          = 'accounts';
  public today              = new Date();

  // ── Filters ──────────────────────────────────────────────────
  public selectedPeriod   : 'day'|'week'|'month'|'year' = 'month';
  public selectedCategory : string = '';
  public eventCategories  : string[] = [];

  // ── KPI trends ───────────────────────────────────────────────
  public eventsGrowth        = 0;
  public registrationsGrowth = 0;
  public confirmedRegistrations  = 0;
  public pendingRegistrations    = 0;
  public cancelledRegistrations  = 0;

  // ── Category stats ───────────────────────────────────────────
  public categoryStats: { name: string; count: number }[] = [];
  public readonly catColors = ['#1d8cf8','#e14eca','#00f2c3','#ff8d72','#ffc864','#fd5d93','#a05aff','#36c5f0'];

  // ── Activity feed ────────────────────────────────────────────
  public recentActivity: ActivityItem[] = [];

  // ── Monthly series ────────────────────────────────────────────
  public monthlyData:      number[] = [];
  public monthlyPurchases: number[] = [];
  public monthlySessions:  number[] = [];

  // ── AI outputs ────────────────────────────────────────────────
  public aiRecommendations : string[]          = [];
  public healthScore        : HealthScore|null  = null;
  public predictions        : number[]          = [];
  public forecastResult     : ForecastResult|null   = null;
  public anomalies          : AnomalyResult[]       = [];
  public anomalyCount       = 0;
  public clusterResult      : ClusterResult|null    = null;
  public correlationMatrix  : CorrelationMatrix|null = null;

  public readonly MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

  constructor(
    private eventSvc        : EventService,
    private userSvc         : UserService,
    private registrationSvc : RegistrationService,
    public  aiSvc           : AIAnalyticsService
  ) {}

  ngOnInit()    { this.loadDashboardData(); }
  ngOnDestroy() { this._destroyAllCharts(); }

  // ============================================================
  // DATA LOADING
  // ============================================================

  loadDashboardData() {
    this.loading = true;
    this.error   = null;

    // Un seul forkJoin (3 requêtes parallèles) au lieu de 7 requêtes séparées
    forkJoin({
      events:        this.eventSvc.getAllEvents().pipe(catchError(() => of([]))),
      users:         this.userSvc.getAllUsers().pipe(catchError(() => of([]))),
      registrations: this.registrationSvc.getAllRegistrations().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ events, users, registrations }) => {
        this.events        = events        as any[];
        this.users         = users         as UserResponse[];
        this.registrations = registrations as Registration[];
        this.loading = false;
        setTimeout(() => this.processDataAndInitCharts(), 300);
      },
      error: () => {
        this.error = 'Données de démonstration affichées';
        this.loading = false;
        setTimeout(() => this.processDataAndInitCharts(), 300);
      }
    });
  }

  private _refreshDerivedData() {
    this.buildEventCategories();
    this.buildCategoryStats();
    this.buildRegistrationStatuses();
    this.buildRecentActivity();
    this.calculateGrowth();
  }

  processDataAndInitCharts() {
    this._refreshDerivedData();
    this.generateMonthlyData();
    this.initPerformanceChart();
    this.initCategoryChart();
    this.initStatusChart();
    this.initKpiMiniCharts();
    this.generateAIInsights();
    this.runAdvancedAI();
  }

  // ============================================================
  // FILTERS
  // ============================================================

  setPeriod(period: 'day'|'week'|'month'|'year') {
    this.selectedPeriod = period;
    this._refreshDerivedData();
    this.generateMonthlyData();
    this.initPerformanceChart();
    this.initCategoryChart();
    this.initStatusChart();
    this.initKpiMiniCharts();
  }

  onCategoryChange() {
    this._refreshDerivedData();
    this.generateMonthlyData();
    this.initPerformanceChart();
    this.initCategoryChart();
    this.initStatusChart();
  }

  getFilteredEvents(): any[] {
    let evts = this.events;
    if (this.selectedCategory) evts = evts.filter(e => e.category === this.selectedCategory);
    const from = this._periodStart();
    return evts.filter(e => {
      const d = new Date(e.startDate || e.startAt);
      return d >= from;
    });
  }

  getFilteredRegistrations(): Registration[] {
    const from = this._periodStart();
    return this.registrations.filter(r => {
      const d = new Date(r.registeredAt || r.registrationDate || r.createdAt || 0);
      return d >= from;
    });
  }

  private _periodStart(): Date {
    const now = new Date();
    switch (this.selectedPeriod) {
      case 'day':   return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':  { const d = new Date(now); d.setDate(now.getDate() - 7); return d; }
      case 'month': return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'year':  return new Date(now.getFullYear(), 0, 1);
    }
  }

  private _prevPeriodStart(): Date {
    const now = new Date();
    switch (this.selectedPeriod) {
      case 'day':   { const d = new Date(now); d.setDate(d.getDate() - 1); return d; }
      case 'week':  { const d = new Date(now); d.setDate(now.getDate() - 14); return d; }
      case 'month': return new Date(now.getFullYear(), now.getMonth() - 1, 1);
      case 'year':  return new Date(now.getFullYear() - 1, 0, 1);
    }
  }

  // ============================================================
  // DERIVED DATA
  // ============================================================

  buildEventCategories() {
    const cats = new Set<string>();
    this.events.forEach(e => { if (e.category) cats.add(e.category); });
    this.eventCategories = Array.from(cats);
  }

  buildCategoryStats() {
    const map: Record<string, number> = {};
    this.getFilteredEvents().forEach(e => {
      const cat = e.category || 'Autre';
      map[cat] = (map[cat] || 0) + 1;
    });
    this.categoryStats = Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }

  buildRegistrationStatuses() {
    const regs = this.getFilteredRegistrations();
    this.confirmedRegistrations  = regs.filter(r => ['CONFIRMED','confirmed','APPROVED'].includes(r.status)).length;
    this.pendingRegistrations    = regs.filter(r => ['PENDING','pending'].includes(r.status)).length;
    this.cancelledRegistrations  = regs.filter(r => ['CANCELLED','cancelled','REJECTED'].includes(r.status)).length;
  }

  buildRecentActivity() {
    const items: ActivityItem[] = [];

    this.registrations.slice(-20).reverse().forEach(r => {
      const eventTitle = this.events.find(e => e.id === r.eventId)?.title || r.eventId || '—';
      items.push({
        type: 'inscription',
        description: eventTitle,
        date: new Date(r.registeredAt || r.registrationDate || r.createdAt || Date.now()),
        status: r.status || 'PENDING',
        statusLabel: this._statusLabel(r.status)
      });
    });

    this.events.slice(-10).reverse().forEach(e => {
      items.push({
        type: 'evenement',
        description: e.title || e.name || '—',
        date: new Date(e.startDate || e.startAt || Date.now()),
        status: new Date(e.startDate || e.startAt) < new Date() ? 'past' : 'upcoming',
        statusLabel: new Date(e.startDate || e.startAt) < new Date() ? 'Passé' : 'À venir'
      });
    });

    this.recentActivity = items
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);
  }

  private _statusLabel(status: string): string {
    const map: Record<string, string> = {
      CONFIRMED: 'Confirmé', confirmed: 'Confirmé',
      APPROVED: 'Approuvé',
      PENDING: 'En attente', pending: 'En attente',
      CANCELLED: 'Annulé', cancelled: 'Annulé',
      REJECTED: 'Rejeté'
    };
    return map[status] || status || 'N/A';
  }

  calculateGrowth() {
    const prevFrom = this._prevPeriodStart();
    const currFrom = this._periodStart();

    const prevEvts = this.events.filter(e => {
      const d = new Date(e.startDate || e.startAt);
      return d >= prevFrom && d < currFrom;
    }).length;
    const currEvts = this.getFilteredEvents().length;
    this.eventsGrowth = prevEvts > 0 ? +((currEvts - prevEvts) / prevEvts * 100).toFixed(1) : 0;

    const prevRegs = this.registrations.filter(r => {
      const d = new Date(r.registeredAt || r.registrationDate || r.createdAt || 0);
      return d >= prevFrom && d < currFrom;
    }).length;
    const currRegs = this.getFilteredRegistrations().length;
    this.registrationsGrowth = prevRegs > 0 ? +((currRegs - prevRegs) / prevRegs * 100).toFixed(1) : 0;
  }

  getConfirmationRate(): number {
    const total = this.getFilteredRegistrations().length;
    if (!total) return 0;
    return Math.round((this.confirmedRegistrations / total) * 100);
  }

  // ============================================================
  // MONTHLY DATA
  // ============================================================

  generateMonthlyData() {
    const mReg  = new Array(12).fill(0);
    const mEvts = new Array(12).fill(0);

    this.registrations.forEach(r => {
      const d = new Date(r.registeredAt || r.registrationDate || r.createdAt || 0);
      mReg[d.getMonth()]++;
    });
    (this.selectedCategory
      ? this.events.filter(e => e.category === this.selectedCategory)
      : this.events
    ).forEach(e => {
      const d = new Date(e.startAt || e.startDate);
      if (!isNaN(d.getTime())) mEvts[d.getMonth()]++;
    });

    const hasReal = this.registrations.length > 0 || this.events.length > 0;
    if (hasReal) {
      const maxR = Math.max(...mReg, 1);
      const maxE = Math.max(...mEvts, 1);
      this.monthlyData      = mReg.map(v => Math.round((v / maxR) * 100 + 20));
      this.monthlyPurchases = mEvts.map(v => Math.round((v / maxE) * 100 + 20));
      this.monthlySessions  = mReg.map((v, i) => Math.round(((v + mEvts[i]) / 2) + Math.random() * 15));
    } else {
      this.monthlyData      = [40, 45, 62, 85, 120, 105, 20, 20, 20, 20, 20, 20];
      this.monthlyPurchases = [80, 120, 105, 110, 95, 105, 90, 100, 80, 95, 70, 120];
      this.monthlySessions  = [60, 80, 65, 130, 80, 105, 90, 130, 70, 115, 60, 130];
    }
  }

  // ============================================================
  // AI
  // ============================================================

  generateAIInsights() {
    this.aiSvc.generateSmartRecommendations({
      monthlyAccounts: this.monthlyData, monthlyPurchases: this.monthlyPurchases, monthlySessions: this.monthlySessions
    }).subscribe(recs => this.aiRecommendations = recs);

    this.aiSvc.calculateHealthScore({
      events: this.events.length, users: this.users.length,
      registrations: this.registrations.length, completedTasks: this.events.filter(e => new Date(e.startDate) < new Date()).length,
      monthlyRegistrations: this.monthlyData
    }).subscribe(score => this.healthScore = score);

    this.aiSvc.predictTrends(this.monthlyData).subscribe(p => this.predictions = p);
  }

  runAdvancedAI() {
    this.aiSvc.forecastAuto(this.monthlyData, 3).subscribe(result => {
      this.forecastResult = result;
      setTimeout(() => this.initForecastChart(), 100);
    });
    this.aiSvc.detectAnomalies(this.monthlyData).subscribe(results => {
      this.anomalies = results;
      this.anomalyCount = results.filter(r => r.isAnomaly).length;
      setTimeout(() => this.initAnomalyChart(), 100);
    });
    this.aiSvc.clusterData(this.monthlyData, 3).subscribe(result => {
      this.clusterResult = result;
      setTimeout(() => this.initClusterChart(), 100);
    });
    this.correlationMatrix = this.aiSvc.computeCorrelationMatrix([
      { label: 'Inscriptions', data: this.monthlyData      },
      { label: 'Événements',   data: this.monthlyPurchases },
      { label: 'Sessions',     data: this.monthlySessions  }
    ]);
  }

  // ============================================================
  // CHART INIT
  // ============================================================

  initPerformanceChart() {
    const canvas = document.getElementById('performanceChart') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (this.performanceChart) this.performanceChart.destroy();

    const grad = ctx.createLinearGradient(0, 280, 0, 0);
    grad.addColorStop(0, 'rgba(233,32,16,0)');
    grad.addColorStop(0.4, 'rgba(233,32,16,0.05)');
    grad.addColorStop(1, 'rgba(233,32,16,0.25)');

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
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 6,
          pointRadius: 4,
          data: this.getActiveDataset()
        }]
      },
      options: {
        maintainAspectRatio: false,
        legend: { display: false },
        tooltips: {
          backgroundColor: '#1e1e2f', titleFontColor: '#fff', bodyFontColor: '#ccc',
          mode: 'index', intersect: false,
          callbacks: {
            label: (item: any) => ` ${this.getActiveDatasetLabel()}: ${item.yLabel}`
          }
        },
        scales: {
          yAxes: [{ gridLines: { color: 'rgba(255,255,255,0.05)', zeroLineColor: 'transparent' }, ticks: { fontColor: '#9a9a9a', padding: 10 } }],
          xAxes: [{ gridLines: { display: false }, ticks: { fontColor: '#9a9a9a', padding: 10 } }]
        }
      }
    });
  }

  initCategoryChart() {
    const canvas = document.getElementById('categoryChart') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (this.categoryChart) this.categoryChart.destroy();

    const labels = this.categoryStats.map(c => c.name);
    const data   = this.categoryStats.map(c => c.count);
    const colors = labels.map((_, i) => this.catColors[i % this.catColors.length]);

    if (!labels.length) { labels.push('Aucune donnée'); data.push(1); colors.push('rgba(255,255,255,0.1)'); }

    this.categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#27293d' }] },
      options: {
        maintainAspectRatio: false,
        cutoutPercentage: 65,
        legend: { display: false },
        tooltips: {
          backgroundColor: '#1e1e2f', titleFontColor: '#fff', bodyFontColor: '#ccc',
          callbacks: { label: (item: any, d: any) => ` ${d.labels[item.index]}: ${d.datasets[0].data[item.index]} événement(s)` }
        }
      }
    });
  }

  initStatusChart() {
    const canvas = document.getElementById('statusChart') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (this.statusChart) this.statusChart.destroy();

    const total = this.confirmedRegistrations + this.pendingRegistrations + this.cancelledRegistrations;
    this.statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Confirmées', 'En attente', 'Annulées'],
        datasets: [{
          data: total ? [this.confirmedRegistrations, this.pendingRegistrations, this.cancelledRegistrations] : [1, 1, 1],
          backgroundColor: ['#00f2c3', '#ffc864', '#fd5d93'],
          borderWidth: 2,
          borderColor: '#27293d'
        }]
      },
      options: {
        maintainAspectRatio: false,
        cutoutPercentage: 70,
        legend: { display: false },
        tooltips: {
          backgroundColor: '#1e1e2f', titleFontColor: '#fff', bodyFontColor: '#ccc',
          callbacks: { label: (item: any, d: any) => ` ${d.labels[item.index]}: ${total ? d.datasets[0].data[item.index] : 0}` }
        }
      }
    });
  }

  initKpiMiniCharts() {
    const miniOpts = (color: string) => ({
      maintainAspectRatio: false,
      legend: { display: false },
      tooltips: { enabled: false },
      scales: { yAxes: [{ display: false }], xAxes: [{ display: false }] },
      elements: { point: { radius: 0 } }
    });

    const makeGrad = (ctx: CanvasRenderingContext2D, color: string) => {
      const g = ctx.createLinearGradient(0, 60, 0, 0);
      g.addColorStop(0, 'transparent');
      g.addColorStop(1, color + '55');
      return g;
    };

    [
      { id: 'kpiEventsChart', data: this.monthlyData.slice(6), color: '#1d8cf8', key: 'kpiEventsChart' },
      { id: 'kpiRegsChart',   data: this.monthlyData.slice(6), color: '#e14eca', key: 'kpiRegsChart'   },
      { id: 'kpiUsersChart',  data: [2,4,3,6,5,7,8,9],         color: '#00f2c3', key: 'kpiUsersChart'  },
      { id: 'kpiRateChart',   data: [50,60,55,70,65,80,75,85], color: '#ff8d72', key: 'kpiRateChart'   }
    ].forEach(cfg => {
      const canvas = document.getElementById(cfg.id) as HTMLCanvasElement;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (this[cfg.key]) this[cfg.key].destroy();
      this[cfg.key] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: cfg.data.map((_, i) => i),
          datasets: [{ data: cfg.data, borderColor: cfg.color, backgroundColor: makeGrad(ctx, cfg.color), borderWidth: 1.5, fill: true, pointRadius: 0 }]
        },
        options: miniOpts(cfg.color) as any
      });
    });
  }

  initForecastChart() {
    const canvas = document.getElementById('forecastChart') as HTMLCanvasElement;
    if (!canvas || !this.forecastResult) return;
    const ctx = canvas.getContext('2d');
    if (this.forecastChart) this.forecastChart.destroy();

    const fr      = this.forecastResult;
    const histLen = fr.historical.length;
    const labels  = [...this.MONTHS, 'M+1', 'M+2', 'M+3'];

    this.forecastChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Historique',   data: [...fr.historical, null, null, null], borderColor: '#1d8cf8', backgroundColor: 'rgba(29,140,248,0.07)', borderWidth: 2, pointRadius: 4, pointBackgroundColor: '#1d8cf8', fill: false } as any,
          { label: 'Projection',   data: [...new Array(histLen).fill(null), ...fr.forecast], borderColor: '#e14eca', backgroundColor: 'rgba(225,78,202,0.07)', borderWidth: 2, borderDash: [6,3], pointRadius: 5, pointBackgroundColor: '#e14eca', fill: false } as any,
          { label: 'Zone haute',   data: [...new Array(histLen).fill(null), ...fr.upperBound], borderColor: 'rgba(225,78,202,0.25)', borderWidth: 1, borderDash: [3,3], pointRadius: 0, fill: '+1' } as any,
          { label: 'Zone basse',   data: [...new Array(histLen).fill(null), ...fr.lowerBound], borderColor: 'rgba(225,78,202,0.25)', backgroundColor: 'rgba(225,78,202,0.08)', borderWidth: 1, borderDash: [3,3], pointRadius: 0, fill: false } as any
        ]
      },
      options: {
        maintainAspectRatio: false,
        legend: { display: true, labels: { fontColor: '#9a9a9a', fontSize: 11 } },
        tooltips: { mode: 'index', intersect: false, backgroundColor: '#1e1e2f', titleFontColor: '#fff', bodyFontColor: '#ccc' },
        scales: {
          yAxes: [{ gridLines: { color: 'rgba(255,255,255,0.05)', zeroLineColor: 'transparent' }, ticks: { fontColor: '#9a9a9a' } }],
          xAxes: [{ gridLines: { color: 'rgba(255,255,255,0.05)', zeroLineColor: 'transparent' }, ticks: { fontColor: '#9a9a9a' } }]
        }
      }
    });
  }

  initAnomalyChart() {
    const canvas = document.getElementById('anomalyChart') as HTMLCanvasElement;
    if (!canvas || !this.anomalies.length) return;
    const ctx = canvas.getContext('2d');
    if (this.anomalyChart) this.anomalyChart.destroy();

    const colors = this.anomalies.map(a => {
      if (!a.isAnomaly)          return 'rgba(29,140,248,0.7)';
      if (a.severity === 'high') return 'rgba(253,93,147,0.9)';
      if (a.severity === 'medium') return 'rgba(255,141,114,0.85)';
      return 'rgba(255,200,100,0.8)';
    });

    this.anomalyChart = new Chart(ctx, {
      type: 'bar',
      data: { labels: this.MONTHS, datasets: [{ label: 'Inscriptions', data: this.monthlyData, backgroundColor: colors, borderColor: colors, borderWidth: 1 }] },
      options: {
        maintainAspectRatio: false, legend: { display: false },
        tooltips: {
          callbacks: { afterLabel: (item: any) => { const a = this.anomalies[item.index]; return a?.isAnomaly ? `⚠ z=${a.zScore}` : ''; } },
          backgroundColor: '#1e1e2f', titleFontColor: '#fff', bodyFontColor: '#ccc'
        },
        scales: { yAxes: [{ gridLines: { color: 'rgba(255,255,255,0.05)', zeroLineColor: 'transparent' }, ticks: { fontColor: '#9a9a9a' } }], xAxes: [{ gridLines: { display: false }, ticks: { fontColor: '#9a9a9a' } }] }
      }
    });
  }

  initClusterChart() {
    const canvas = document.getElementById('clusterChart') as HTMLCanvasElement;
    if (!canvas || !this.clusterResult?.clusters?.length) return;
    const ctx = canvas.getContext('2d');
    if (this.clusterChart) this.clusterChart.destroy();

    const labels = this.clusterResult.clusters.map(c =>
      c.label === 'high-performance' ? '🟢 Mois performants' : c.label === 'medium-performance' ? '🟡 Mois moyens' : '🔴 Mois en retrait'
    );

    this.clusterChart = new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: this.clusterResult.clusters.map(c => c.size), backgroundColor: this.clusterResult.clusters.map(c => c.color), borderWidth: 2, borderColor: '#27293d' }] },
      options: { maintainAspectRatio: false, cutoutPercentage: 70, legend: { display: true, position: 'bottom', labels: { fontColor: '#9a9a9a', fontSize: 11 } }, tooltips: { backgroundColor: '#1e1e2f', titleFontColor: '#fff', bodyFontColor: '#ccc' } }
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
    return this.activeTab === 'purchases' ? 'Événements' : this.activeTab === 'sessions' ? 'Sessions' : 'Inscriptions';
  }

  getHealthScoreClass(): string {
    if (!this.healthScore) return 'text-muted';
    return { excellent: 'text-success', good: 'text-info', fair: 'text-warning', poor: 'text-danger' }[this.healthScore.status] || 'text-muted';
  }

  getHealthScoreIcon(): string {
    if (!this.healthScore) return 'icon-bulb-63';
    return { excellent: 'icon-check-2', good: 'icon-trophy', fair: 'icon-alert-circle-exc', poor: 'icon-simple-remove' }[this.healthScore.status] || 'icon-bulb-63';
  }

  getTrendIcon(): string { return { improving: '↑', stable: '→', declining: '↓' }[this.healthScore?.trend] || '→'; }
  getTrendClass(): string { return { improving: 'trend-up', stable: 'trend-stable', declining: 'trend-down' }[this.healthScore?.trend] || ''; }
  getCorrelationColor(value: number): string {
    const abs = Math.abs(value);
    if (abs >= 0.8) return value > 0 ? '#00f2c3' : '#fd5d93';
    if (abs >= 0.5) return value > 0 ? '#1d8cf8' : '#ff8d72';
    return 'rgba(255,255,255,0.1)';
  }
  getDimensionWidth(value: number, max: number): number { return Math.round((value / max) * 100); }
  formatNumber(n: number): string { return n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1_000 ? (n / 1_000).toFixed(0) + 'K' : String(n); }

  private _destroyAllCharts() {
    [this.performanceChart, this.categoryChart, this.statusChart,
     this.forecastChart, this.anomalyChart, this.clusterChart,
     this.kpiEventsChart, this.kpiRegsChart, this.kpiUsersChart, this.kpiRateChart]
      .forEach(c => { if (c) c.destroy(); });
  }
}
