import { Component, OnInit, OnDestroy } from "@angular/core";
import Chart from 'chart.js';
import { DashboardService } from "../../core/services/dashboard.service";
import { EventService } from "../../core/services/event.service";
import { UserService, UserResponse } from "../../core/services/user.service";
import { RegistrationService, Registration } from "../../core/services/registration.service";
import { AIAnalyticsService } from "../../core/services/ai-analytics.service";

@Component({
  selector: "app-dashboard",
  templateUrl: "dashboard.component.html",
  styleUrls: ["dashboard.component.scss"]
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Charts
  public performanceChart: any;
  public shipmentsChart: any;
  public salesChart: any;
  public tasksChart: any;

  // Donn�es r�elles depuis la BD
  public dashboardStats: any = {};
  public events: any[] = [];
  public users: UserResponse[] = [];
  public registrations: Registration[] = [];
  public loading = true;
  public error: string | null = null;

  // Onglets actifs
  public activeTab: string = 'accounts';

  // M�triques calcul�es
  public totalShipments: number = 0;
  public dailySales: number = 0;
  public completedTasks: number = 0;

  // Donn�es pour les graphiques (bas�es sur donn�es r�elles)
  public monthlyData: number[] = [];
  public monthlyPurchases: number[] = [];
  public monthlySessions: number[] = [];

  // Insights IA
  public aiRecommendations: string[] = [];
  public healthScore: any = null;
  public predictions: number[] = [];

  constructor(
    private dashboardService: DashboardService,
    private eventService: EventService,
    private userService: UserService,
    private registrationService: RegistrationService,
    private aiService: AIAnalyticsService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  ngOnDestroy() {
    // Nettoyer les graphiques
    if (this.performanceChart) this.performanceChart.destroy();
    if (this.shipmentsChart) this.shipmentsChart.destroy();
    if (this.salesChart) this.salesChart.destroy();
    if (this.tasksChart) this.tasksChart.destroy();
  }

  loadDashboardData() {
    this.loading = true;
    this.error = null;

    // R�cup�rer les statistiques du dashboard
    this.dashboardService.getDashboardStats().subscribe(
      (stats) => {
        this.dashboardStats = stats;
        console.log('Dashboard stats loaded:', stats);
        this.loading = false;
        
        // Initialiser les graphiques apr�s avoir charg� les donn�es
        setTimeout(() => this.processDataAndInitCharts(), 300);
      },
      (error) => {
        console.error('Error loading dashboard stats:', error);
        this.error = 'Erreur lors du chargement des statistiques';
        this.loading = false;
        
        // Initialiser avec des donn�es par d�faut
        setTimeout(() => this.processDataAndInitCharts(), 300);
      }
    );

    // R�cup�rer les �v�nements
    this.eventService.getAllEvents().subscribe(
      (events) => {
        this.events = events;
        console.log('Events loaded:', events);
      },
      (error) => {
        console.error('Error loading events:', error);
        this.events = [];
      }
    );

    // R�cup�rer les utilisateurs
    this.userService.getAllUsers().subscribe(
      (users) => {
        this.users = users;
        console.log('Users loaded:', users);
      },
      (error) => {
        console.error('Error loading users:', error);
        this.users = [];
      }
    );

    // R�cup�rer les inscriptions
    this.registrationService.getAllRegistrations().subscribe(
      (registrations) => {
        this.registrations = registrations;
        console.log('Registrations loaded:', registrations);
      },
      (error) => {
        console.error('Error loading registrations:', error);
        this.registrations = [];
      }
    );
  }

  processDataAndInitCharts() {
    // Calculer les m�triques � partir des donn�es r�elles
    this.calculateMetrics();
    
    // G�n�rer les donn�es mensuelles � partir des �v�nements et inscriptions
    this.generateMonthlyData();
    
    // Initialiser tous les graphiques
    this.initPerformanceChart();
    this.initShipmentsChart();
    this.initSalesChart();
    this.initTasksChart();

    // G�n�rer les insights IA
    this.generateAIInsights();
  }

  calculateMetrics() {
    // Total des inscriptions comme "shipments"
    this.totalShipments = this.dashboardStats?.totalRegistrations || this.registrations?.length || 0;
    
    // Calculer les ventes quotidiennes (bas� sur les �v�nements du jour)
    const today = new Date();
    const todayEvents = this.events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === today.toDateString();
    });
    this.dailySales = todayEvents.length * 350; // Simulation : 350� par �v�nement
    
    // T�ches compl�t�es (�v�nements pass�s)
    const now = new Date();
    this.completedTasks = this.events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate < now;
    }).length;
  }

  generateMonthlyData() {
    // G�n�rer des donn�es mensuelles bas�es sur les inscriptions et �v�nements
    const monthlyRegistrations = new Array(12).fill(0);
    const monthlyEvents = new Array(12).fill(0);
    const monthlyUsers = new Array(12).fill(0);

    // Compter les inscriptions par mois
    this.registrations.forEach(reg => {
      if (reg.registrationDate) {
        const month = new Date(reg.registrationDate).getMonth();
        monthlyRegistrations[month]++;
      }
    });

    // Compter les �v�nements par mois
    this.events.forEach(event => {
      if (event.startDate) {
        const month = new Date(event.startDate).getMonth();
        monthlyEvents[month]++;
      }
    });

    // G�n�rer des donn�es avec une tendance r�aliste
    // Si pas de donn�es r�elles, utiliser des donn�es de d�monstration
    const hasRealData = this.registrations.length > 0 || this.events.length > 0;
    
    if (hasRealData) {
      // Utiliser les donn�es r�elles avec normalisation
      const maxReg = Math.max(...monthlyRegistrations, 1);
      this.monthlyData = monthlyRegistrations.map(val => Math.round((val / maxReg) * 100 + 20));
      
      const maxEvents = Math.max(...monthlyEvents, 1);
      this.monthlyPurchases = monthlyEvents.map(val => Math.round((val / maxEvents) * 100 + 20));
      
      // Sessions bas�es sur une combinaison
      this.monthlySessions = monthlyRegistrations.map((val, i) => 
        Math.round(((val + monthlyEvents[i]) / 2) + Math.random() * 20)
      );
    } else {
      // Donn�es de d�monstration r�alistes
      this.monthlyData = [100, 70, 90, 70, 85, 60, 75, 60, 90, 80, 110, 100];
      this.monthlyPurchases = [80, 120, 105, 110, 95, 105, 90, 100, 80, 95, 70, 120];
      this.monthlySessions = [60, 80, 65, 130, 80, 105, 90, 130, 70, 115, 60, 130];
    }
  }

  generateAIInsights() {
    // G�n�rer des recommandations intelligentes
    this.aiService.generateSmartRecommendations({
      monthlyAccounts: this.monthlyData,
      monthlyPurchases: this.monthlyPurchases,
      monthlySessions: this.monthlySessions
    }).subscribe(recommendations => {
      this.aiRecommendations = recommendations;
    });

    // Calculer le score de sant�
    this.aiService.calculateHealthScore({
      events: this.events.length,
      users: this.users.length,
      registrations: this.registrations.length,
      completedTasks: this.completedTasks
    }).subscribe(score => {
      this.healthScore = score;
    });

    // Pr�dire les tendances futures
    this.aiService.predictTrends(this.monthlyData).subscribe(predictions => {
      this.predictions = predictions;
      console.log('AI Predictions:', predictions);
    });
  }

  initPerformanceChart() {
    const canvas = document.getElementById('performanceChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // D�truire le graphique s'il existe d�j�
    if (this.performanceChart) {
      this.performanceChart.destroy();
    }

    const gradientStroke = ctx.createLinearGradient(0, 230, 0, 50);
    gradientStroke.addColorStop(1, 'rgba(233,32,16,0.2)');
    gradientStroke.addColorStop(0.4, 'rgba(233,32,16,0.0)');
    gradientStroke.addColorStop(0, 'rgba(233,32,16,0)');

    this.performanceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
        datasets: [{
          label: this.getActiveDatasetLabel(),
          fill: true,
          backgroundColor: gradientStroke,
          borderColor: '#ec250d',
          borderWidth: 2,
          borderDash: [],
          borderDashOffset: 0.0,
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
        legend: {
          display: false
        },
        tooltips: {
          backgroundColor: '#f5f5f5',
          titleFontColor: '#333',
          bodyFontColor: '#666',
          bodySpacing: 4,
          xPadding: 12,
          mode: "nearest",
          intersect: 0,
          position: "nearest"
        },
        responsive: true,
        scales: {
          yAxes: [{
            barPercentage: 1.6,
            gridLines: {
              drawBorder: false,
              color: 'rgba(29,140,248,0.0)',
              zeroLineColor: "transparent",
            },
            ticks: {
              suggestedMin: 50,
              suggestedMax: 150,
              padding: 20,
              fontColor: "#9a9a9a"
            }
          }],
          xAxes: [{
            barPercentage: 1.6,
            gridLines: {
              drawBorder: false,
              color: 'rgba(0,242,195,0.1)',
              zeroLineColor: "transparent",
            },
            ticks: {
              padding: 20,
              fontColor: "#9a9a9a"
            }
          }]
        }
      }
    });
  }

  initShipmentsChart() {
    const canvas = document.getElementById('shipmentsChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    if (this.shipmentsChart) {
      this.shipmentsChart.destroy();
    }

    const gradientStroke = ctx.createLinearGradient(0, 230, 0, 50);
    gradientStroke.addColorStop(1, 'rgba(233,32,16,0.2)');
    gradientStroke.addColorStop(0.4, 'rgba(233,32,16,0.0)');
    gradientStroke.addColorStop(0, 'rgba(233,32,16,0)');

    // Donn�es simplifi�es pour le mini graphique
    const miniData = this.monthlyData.map((val, i) => i % 2 === 0 ? val : val * 0.8);

    this.shipmentsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        datasets: [{
          label: "Inscriptions",
          fill: true,
          backgroundColor: gradientStroke,
          borderColor: '#ec250d',
          borderWidth: 2,
          borderDash: [],
          borderDashOffset: 0.0,
          pointBackgroundColor: '#ec250d',
          pointBorderColor: 'rgba(255,255,255,0)',
          pointHoverBackgroundColor: '#ec250d',
          pointBorderWidth: 20,
          pointHoverRadius: 4,
          pointHoverBorderWidth: 15,
          pointRadius: 0,
          data: miniData.slice(0, 10)
        }]
      },
      options: {
        maintainAspectRatio: false,
        legend: {
          display: false
        },
        tooltips: {
          enabled: false
        },
        scales: {
          yAxes: [{
            display: false,
            ticks: {
              display: false
            },
            gridLines: {
              display: false
            }
          }],
          xAxes: [{
            display: false,
            ticks: {
              display: false
            },
            gridLines: {
              display: false
            }
          }]
        }
      }
    });
  }

  initSalesChart() {
    const canvas = document.getElementById('salesChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    if (this.salesChart) {
      this.salesChart.destroy();
    }

    // Donn�es pour le graphique � barres
    const barData = [50, 80, 60, 100, 70, 50];

    this.salesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['1', '2', '3', '4', '5', '6'],
        datasets: [{
          label: "Ventes",
          backgroundColor: '#1d8cf8',
          borderColor: '#1d8cf8',
          borderWidth: 2,
          data: barData
        }]
      },
      options: {
        maintainAspectRatio: false,
        legend: {
          display: false
        },
        tooltips: {
          enabled: false
        },
        scales: {
          yAxes: [{
            display: false,
            ticks: {
              display: false
            },
            gridLines: {
              display: false
            }
          }],
          xAxes: [{
            display: false,
            ticks: {
              display: false
            },
            gridLines: {
              display: false
            }
          }]
        }
      }
    });
  }

  initTasksChart() {
    const canvas = document.getElementById('tasksChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    if (this.tasksChart) {
      this.tasksChart.destroy();
    }

    const gradientStroke = ctx.createLinearGradient(0, 230, 0, 50);
    gradientStroke.addColorStop(1, 'rgba(0,242,195,0.2)');
    gradientStroke.addColorStop(0.4, 'rgba(0,242,195,0.0)');
    gradientStroke.addColorStop(0, 'rgba(0,242,195,0)');

    // Donn�es pour t�ches compl�t�es
    const taskData = [90, 60, 80, 60, 90, 70, 80];

    this.tasksChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['1', '2', '3', '4', '5', '6', '7'],
        datasets: [{
          label: "T�ches",
          fill: true,
          backgroundColor: gradientStroke,
          borderColor: '#00f2c3',
          borderWidth: 2,
          borderDash: [],
          borderDashOffset: 0.0,
          pointBackgroundColor: '#00f2c3',
          pointBorderColor: 'rgba(255,255,255,0)',
          pointHoverBackgroundColor: '#00f2c3',
          pointBorderWidth: 20,
          pointHoverRadius: 4,
          pointHoverBorderWidth: 15,
          pointRadius: 0,
          data: taskData
        }]
      },
      options: {
        maintainAspectRatio: false,
        legend: {
          display: false
        },
        tooltips: {
          enabled: false
        },
        scales: {
          yAxes: [{
            display: false,
            ticks: {
              display: false
            },
            gridLines: {
              display: false
            }
          }],
          xAxes: [{
            display: false,
            ticks: {
              display: false
            },
            gridLines: {
              display: false
            }
          }]
        }
      }
    });
  }

  switchTab(tab: string) {
    this.activeTab = tab;
    this.updatePerformanceChart();
  }

  updatePerformanceChart() {
    if (!this.performanceChart) return;

    this.performanceChart.data.datasets[0].data = this.getActiveDataset();
    this.performanceChart.data.datasets[0].label = this.getActiveDatasetLabel();
    this.performanceChart.update();
  }

  getActiveDataset(): number[] {
    switch (this.activeTab) {
      case 'accounts':
        return this.monthlyData;
      case 'purchases':
        return this.monthlyPurchases;
      case 'sessions':
        return this.monthlySessions;
      default:
        return this.monthlyData;
    }
  }

  getActiveDatasetLabel(): string {
    switch (this.activeTab) {
      case 'accounts':
        return 'Comptes créés';
      case 'purchases':
        return 'Achats / Événements';
      case 'sessions':
        return 'Sessions actives';
      default:
        return 'Comptes';
    }
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  }

  getHealthScoreClass(): string {
    if (!this.healthScore) return 'text-muted';
    
    switch (this.healthScore.status) {
      case 'excellent': return 'text-success';
      case 'good': return 'text-info';
      case 'fair': return 'text-warning';
      case 'poor': return 'text-danger';
      default: return 'text-muted';
    }
  }

  getHealthScoreIcon(): string {
    if (!this.healthScore) return 'icon-bulb-63';
    
    switch (this.healthScore.status) {
      case 'excellent': return 'icon-check-2';
      case 'good': return 'icon-trophy';
      case 'fair': return 'icon-alert-circle-exc';
      case 'poor': return 'icon-simple-remove';
      default: return 'icon-bulb-63';
    }
  }
}
