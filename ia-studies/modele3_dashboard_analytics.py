"""
=============================================================================
MODÈLE 3 — ANALYTICS IA DU TABLEAU DE BORD
Régression de tendance + Détection d'anomalies + Score de santé
=============================================================================
Projet  : Event Management Platform — LinSoft
Service : BackOffice Angular (AIAnalyticsService.ts) + Dashboard
Auteur  : Rapport IA — Étude détaillée
=============================================================================
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import matplotlib.patches as mpatches
import seaborn as sns
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.metrics import r2_score, mean_squared_error
from scipy import stats
from scipy.signal import find_peaks
import warnings
warnings.filterwarnings('ignore')

# ─────────────────────────────────────────────────────────────────────────────
# 1. GÉNÉRATION DES DONNÉES SIMULÉES (flux temps réel de la plateforme)
# ─────────────────────────────────────────────────────────────────────────────

np.random.seed(42)

# Simulation 90 jours de données de la plateforme
DAYS = 90
dates = pd.date_range('2026-01-01', periods=DAYS, freq='D')

# Tendance croissante + saisonnalité hebdomadaire + bruit
trend = np.linspace(10, 55, DAYS)
weekly_pattern = 8 * np.sin(2 * np.pi * np.arange(DAYS) / 7)
noise = np.random.normal(0, 4, DAYS)

# Anomalies intentionnelles (pics et chutes)
anomaly_indices = [15, 30, 55, 72]
anomaly_values  = [+40, -25, +50, -30]

daily_registrations = trend + weekly_pattern + noise
for idx, val in zip(anomaly_indices, anomaly_values):
    daily_registrations[idx] += val

daily_registrations = np.maximum(0, daily_registrations).astype(int)

# Données événements
total_events     = np.random.randint(8, 22, DAYS)
completed_events = (total_events * np.random.uniform(0.3, 0.9, DAYS)).astype(int)
cancelled_events = (total_events * np.random.uniform(0.02, 0.12, DAYS)).astype(int)
capacity_rate    = np.random.uniform(0.45, 0.95, DAYS)

df = pd.DataFrame({
    'date':              dates,
    'day_idx':           np.arange(DAYS),
    'registrations':     daily_registrations,
    'total_events':      total_events,
    'completed_events':  completed_events,
    'cancelled_events':  cancelled_events,
    'capacity_rate':     capacity_rate,
})

print("=" * 60)
print("MODÈLE 3 — ANALYTICS IA TABLEAU DE BORD")
print("=" * 60)
print(f"\n📊 Données simulées : {DAYS} jours")
print(f"   Inscriptions/j (moy) : {df['registrations'].mean():.1f}")
print(f"   Inscriptions total   : {df['registrations'].sum()}")
print(f"   Taux remplissage moy : {df['capacity_rate'].mean()*100:.1f}%")

# ─────────────────────────────────────────────────────────────────────────────
# 2A. SOUS-MODÈLE A — RÉGRESSION LINÉAIRE DE TENDANCE
# ─────────────────────────────────────────────────────────────────────────────

X_trend = df['day_idx'].values.reshape(-1, 1)
y_trend = df['registrations'].values

reg_linear = LinearRegression()
reg_linear.fit(X_trend, y_trend)
y_trend_pred = reg_linear.predict(X_trend)

# Régression polynomiale deg 3 (tendance non-linéaire)
poly = PolynomialFeatures(degree=3)
X_poly = poly.fit_transform(X_trend)
reg_poly = LinearRegression()
reg_poly.fit(X_poly, y_trend)
y_poly_pred = reg_poly.predict(X_poly)

r2_lin  = r2_score(y_trend, y_trend_pred)
r2_poly = r2_score(y_trend, y_poly_pred)
slope   = reg_linear.coef_[0]

print(f"\n📈 RÉGRESSION DE TENDANCE")
print(f"   Pente (slope)      : +{slope:.3f} inscriptions/jour")
print(f"   R² Linéaire        : {r2_lin:.4f}")
print(f"   R² Polynomiale(3)  : {r2_poly:.4f}")
print(f"   Projection J+30    : {int(y_trend_pred[-1] + slope * 30)} inscriptions/j")
print(f"   Projection J+60    : {int(y_trend_pred[-1] + slope * 60)} inscriptions/j")

# ─────────────────────────────────────────────────────────────────────────────
# 2B. SOUS-MODÈLE B — DÉTECTION D'ANOMALIES (règle 2σ)
# ─────────────────────────────────────────────────────────────────────────────

mu    = y_trend.mean()
sigma = y_trend.std()
upper = mu + 2 * sigma
lower = mu - 2 * sigma

# Résidus par rapport à la tendance
residuals = y_trend - y_trend_pred
res_mu    = residuals.mean()
res_sigma = residuals.std()
res_upper = res_mu + 2 * res_sigma
res_lower = res_mu - 2 * res_sigma

anomaly_mask_upper = residuals > res_upper
anomaly_mask_lower = residuals < res_lower
anomaly_mask       = anomaly_mask_upper | anomaly_mask_lower

n_anomalies = anomaly_mask.sum()
anomaly_rate = n_anomalies / DAYS * 100

print(f"\n🔍 DÉTECTION D'ANOMALIES")
print(f"   μ (moyenne)        : {mu:.2f}")
print(f"   σ (écart-type)     : {sigma:.2f}")
print(f"   Seuil supérieur    : {upper:.2f} (μ + 2σ)")
print(f"   Seuil inférieur    : {lower:.2f} (μ - 2σ)")
print(f"   Anomalies détectées: {n_anomalies} ({anomaly_rate:.1f}%)")
print(f"   Anomalies hautes   : {anomaly_mask_upper.sum()}")
print(f"   Anomalies basses   : {anomaly_mask_lower.sum()}")

# ─────────────────────────────────────────────────────────────────────────────
# 2C. SOUS-MODÈLE C — SCORE DE SANTÉ
# ─────────────────────────────────────────────────────────────────────────────

def health_score(registrations, total_events, completed_events, capacity_rate):
    """
    HealthScore = 0.40 × score_inscriptions
                + 0.30 × score_completion
                + 0.30 × score_croissance
    """
    # Score inscriptions : normalisé sur 100
    score_reg = min(100, (registrations / 60.0) * 100)

    # Score complétion : taux d'événements complétés
    score_compl = (completed_events / max(total_events, 1)) * 100

    # Score croissance : base 50 (stabilité)
    score_growth = min(100, max(0, 50 + (capacity_rate - 0.5) * 100))

    return 0.40 * score_reg + 0.30 * score_compl + 0.30 * score_growth


df['health_score'] = df.apply(
    lambda r: health_score(r['registrations'], r['total_events'],
                           r['completed_events'], r['capacity_rate']), axis=1
)


def health_label(score):
    if score >= 80:  return 'Excellent', '#27ae60'
    elif score >= 65: return 'Bon',       '#3a7bd5'
    elif score >= 50: return 'Moyen',     '#e67e22'
    else:            return 'Faible',     '#e74c3c'


current_score = df['health_score'].iloc[-7:].mean()
label, label_color = health_label(current_score)

print(f"\n🏥 SCORE DE SANTÉ")
print(f"   Formule : 0.40×inscriptions + 0.30×complétion + 0.30×croissance")
print(f"   Score moyen  : {df['health_score'].mean():.1f}/100")
print(f"   Score actuel : {current_score:.1f}/100 → {label}")
print(f"   Score max    : {df['health_score'].max():.1f}")
print(f"   Score min    : {df['health_score'].min():.1f}")

# Décomposition hebdomadaire des patterns
df['weekday'] = df['date'].dt.day_name()
weekly_avg = df.groupby('weekday')['registrations'].mean()
ordered_days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
weekly_avg = weekly_avg.reindex(ordered_days)

# ─────────────────────────────────────────────────────────────────────────────
# 3. VISUALISATIONS
# ─────────────────────────────────────────────────────────────────────────────

plt.style.use('seaborn-v0_8-whitegrid')
fig = plt.figure(figsize=(22, 30))
fig.suptitle('MODÈLE 3 — Analytics IA Tableau de Bord\nRégression de Tendance · Détection d\'Anomalies · Score de Santé',
             fontsize=16, fontweight='bold', y=0.98)
gs = gridspec.GridSpec(5, 3, figure=fig, hspace=0.50, wspace=0.35)

# ── 3.1 Série temporelle + tendance ──────────────────────────────────────────
ax1 = fig.add_subplot(gs[0, :])
ax1.fill_between(dates, daily_registrations, alpha=0.25, color='#2A3652')
ax1.plot(dates, daily_registrations, color='#2A3652', linewidth=1.2, label='Inscriptions/jour', alpha=0.8)
ax1.plot(dates, y_trend_pred, color='#e31e24', linewidth=2.5, linestyle='--', label=f'Tendance linéaire (slope=+{slope:.2f}/j)')
ax1.plot(dates, y_poly_pred, color='#27ae60', linewidth=2, linestyle=':', label=f'Tendance polynomiale (R²={r2_poly:.3f})')

# Projections
future_days = pd.date_range(dates[-1] + pd.Timedelta(days=1), periods=30, freq='D')
future_idx  = np.arange(DAYS, DAYS + 30).reshape(-1, 1)
future_pred = reg_linear.predict(future_idx)
ax1.plot(future_days, future_pred, color='#e31e24', linewidth=2, linestyle='-.',
         alpha=0.6, label='Projection J+30')
ax1.fill_between(future_days, future_pred - res_sigma, future_pred + res_sigma,
                 alpha=0.15, color='#e31e24', label='Intervalle confiance')

ax1.set_title('Série Temporelle des Inscriptions + Régression de Tendance',
              fontsize=13, fontweight='bold')
ax1.set_xlabel('Date', fontsize=11)
ax1.set_ylabel('Inscriptions / Jour', fontsize=11)
ax1.legend(fontsize=9, loc='upper left')

# ── 3.2 Détection d'anomalies ─────────────────────────────────────────────────
ax2 = fig.add_subplot(gs[1, :2])
ax2.plot(dates, residuals, color='#3a7bd5', linewidth=1.5, label='Résidus')
ax2.axhline(res_mu,    color='gray',    linestyle='-',  linewidth=1.5, alpha=0.7, label=f'μ = {res_mu:.1f}')
ax2.axhline(res_upper, color='#e31e24', linestyle='--', linewidth=1.5, label=f'μ+2σ = {res_upper:.1f}')
ax2.axhline(res_lower, color='#e31e24', linestyle='--', linewidth=1.5, label=f'μ-2σ = {res_lower:.1f}')
ax2.fill_between(dates, res_lower, res_upper, alpha=0.1, color='#27ae60', label='Zone normale')

# Marquer les anomalies
ax2.scatter(dates[anomaly_mask_upper], residuals[anomaly_mask_upper],
            color='#e31e24', zorder=5, s=80, marker='^', label=f'Anomalie haute ({anomaly_mask_upper.sum()})')
ax2.scatter(dates[anomaly_mask_lower], residuals[anomaly_mask_lower],
            color='#3498db', zorder=5, s=80, marker='v', label=f'Anomalie basse ({anomaly_mask_lower.sum()})')

ax2.set_title(f'Détection d\'Anomalies (Règle 2σ) — {n_anomalies} anomalies / {DAYS} jours ({anomaly_rate:.1f}%)',
              fontsize=12, fontweight='bold')
ax2.set_xlabel('Date', fontsize=11)
ax2.set_ylabel('Résidu (inscriptions)', fontsize=11)
ax2.legend(fontsize=8, ncol=3)

# ── 3.3 Distribution des résidus + test normalité ────────────────────────────
ax3 = fig.add_subplot(gs[1, 2])
ax3.hist(residuals, bins=20, color='#3a7bd5', edgecolor='white', alpha=0.8, density=True)
x_norm = np.linspace(residuals.min(), residuals.max(), 100)
ax3.plot(x_norm, stats.norm.pdf(x_norm, res_mu, res_sigma),
         'r-', linewidth=2.5, label='Distribution normale')
ax3.axvline(res_upper, color='orange', linestyle='--', linewidth=1.5, label='+2σ')
ax3.axvline(res_lower, color='orange', linestyle='--', linewidth=1.5, label='-2σ')
_, p_value = stats.normaltest(residuals)
ax3.set_title(f'Distribution des Résidus\nTest normalité p={p_value:.3f}',
              fontsize=12, fontweight='bold')
ax3.set_xlabel('Résidu', fontsize=11)
ax3.set_ylabel('Densité', fontsize=11)
ax3.legend(fontsize=9)

# ── 3.4 Score de santé dans le temps ─────────────────────────────────────────
ax4 = fig.add_subplot(gs[2, :2])
health_values = df['health_score'].values

# Coloration par zone
for i in range(len(dates) - 1):
    score = health_values[i]
    if score >= 80:   color = '#27ae60'
    elif score >= 65: color = '#3a7bd5'
    elif score >= 50: color = '#e67e22'
    else:             color = '#e74c3c'
    ax4.fill_between([dates[i], dates[i+1]], [score, health_values[i+1]], alpha=0.6, color=color)

ax4.plot(dates, health_values, color='#2c3e50', linewidth=1.5)
ax4.axhline(80, color='#27ae60', linestyle='--', linewidth=1.5, alpha=0.7, label='Excellent (80)')
ax4.axhline(65, color='#3a7bd5', linestyle='--', linewidth=1.5, alpha=0.7, label='Bon (65)')
ax4.axhline(50, color='#e67e22', linestyle='--', linewidth=1.5, alpha=0.7, label='Moyen (50)')
ax4.set_title('Score de Santé de la Plateforme dans le Temps\n(0.40×inscriptions + 0.30×complétion + 0.30×croissance)',
              fontsize=12, fontweight='bold')
ax4.set_xlabel('Date', fontsize=11)
ax4.set_ylabel('Score de Santé (/100)', fontsize=11)
ax4.set_ylim(0, 105)
ax4.legend(fontsize=9, loc='lower right')

# ── 3.5 Jauge score actuel ───────────────────────────────────────────────────
ax5 = fig.add_subplot(gs[2, 2])
theta = np.linspace(0, np.pi, 200)
ax5.plot(np.cos(theta), np.sin(theta), 'k-', linewidth=3)
zones = [(0.0, 0.5, '#e74c3c', 'Faible'),
         (0.5, 0.65, '#e67e22', 'Moyen'),
         (0.65, 0.8, '#3a7bd5', 'Bon'),
         (0.8, 1.0, '#27ae60', 'Excellent')]
for low, high, color, lbl in zones:
    t = np.linspace(np.pi * (1 - high), np.pi * (1 - low), 50)
    ax5.fill_between(np.cos(t), np.zeros(50), np.sin(t), alpha=0.7, color=color, label=lbl)

score_angle = np.pi * (1 - current_score / 100)
ax5.annotate('', xy=(0.65 * np.cos(score_angle), 0.65 * np.sin(score_angle)),
             xytext=(0, 0), arrowprops=dict(arrowstyle='->', color='black', lw=3))
ax5.text(0, -0.25, f'{current_score:.1f}', ha='center', va='center',
         fontsize=22, fontweight='bold', color=label_color)
ax5.text(0, -0.45, label, ha='center', va='center',
         fontsize=14, fontweight='bold', color=label_color)
ax5.set_xlim(-1.2, 1.2)
ax5.set_ylim(-0.6, 1.1)
ax5.axis('off')
ax5.set_title('Score de Santé Actuel\n(7 derniers jours)', fontsize=12, fontweight='bold')
ax5.legend(loc='lower center', ncol=2, fontsize=8)

# ── 3.6 Patterns saisonniers hebdomadaires ────────────────────────────────────
ax6 = fig.add_subplot(gs[3, 0])
day_colors = ['#3a7bd5' if d not in ['Saturday', 'Sunday'] else '#e67e22' for d in ordered_days]
bars6 = ax6.bar(range(7), weekly_avg.values, color=day_colors, edgecolor='white', width=0.7)
ax6.set_xticks(range(7))
ax6.set_xticklabels(['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'], fontsize=10)
for bar, val in zip(bars6, weekly_avg.values):
    ax6.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.3,
             f'{val:.0f}', ha='center', fontsize=9, fontweight='bold')
ax6.set_title('Patterns Saisonniers\nInscriptions par Jour de Semaine', fontsize=12, fontweight='bold')
ax6.set_ylabel('Inscriptions moyennes/j', fontsize=11)

# ── 3.7 Décomposition du score de santé ──────────────────────────────────────
ax7 = fig.add_subplot(gs[3, 1])
score_components = {
    'Inscriptions\n(×0.40)': 0.40 * min(100, (df['registrations'].mean() / 60.0) * 100),
    'Complétion\n(×0.30)':   0.30 * (df['completed_events'].sum() / df['total_events'].sum()) * 100,
    'Croissance\n(×0.30)':   0.30 * min(100, max(0, 50 + (df['capacity_rate'].mean() - 0.5) * 100)),
}
comp_colors7 = ['#2A3652', '#3a7bd5', '#e67e22']
bars7 = ax7.bar(list(score_components.keys()), list(score_components.values()),
                color=comp_colors7, edgecolor='white', width=0.6)
for bar, val in zip(bars7, score_components.values()):
    ax7.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.3,
             f'{val:.1f}', ha='center', fontsize=11, fontweight='bold')
ax7.axhline(sum(score_components.values()), color='#e31e24', linestyle='--',
            linewidth=1.5, label=f'Score total = {sum(score_components.values()):.1f}')
ax7.set_title('Décomposition du Score de Santé\n(Contributions pondérées)', fontsize=12, fontweight='bold')
ax7.set_ylabel('Points', fontsize=11)
ax7.set_ylim(0, 50)
ax7.legend(fontsize=9)

# ── 3.8 QQ-plot résidus ───────────────────────────────────────────────────────
ax8 = fig.add_subplot(gs[3, 2])
(osm, osr), (slope_qq, intercept_qq, r_qq) = stats.probplot(residuals, dist='norm')
ax8.scatter(osm, osr, alpha=0.6, color='#2A3652', s=20)
x_line = np.array([min(osm), max(osm)])
ax8.plot(x_line, slope_qq * x_line + intercept_qq, 'r-', linewidth=2)
ax8.set_title(f'Q-Q Plot des Résidus\n(Test de Normalité, R={r_qq:.3f})', fontsize=12, fontweight='bold')
ax8.set_xlabel('Quantiles théoriques', fontsize=11)
ax8.set_ylabel('Quantiles observés', fontsize=11)

# ── 3.9 Corrélation entre toutes les métriques ───────────────────────────────
ax9 = fig.add_subplot(gs[4, :])
metrics_corr = df[['registrations', 'total_events', 'completed_events',
                    'capacity_rate', 'health_score']].corr()
sns.heatmap(metrics_corr, annot=True, fmt='.3f', cmap='RdYlGn',
            center=0, vmin=-1, vmax=1, ax=ax9,
            linewidths=0.5, annot_kws={'size': 11},
            xticklabels=['Inscriptions', 'Nb Événements', 'Terminés', 'Taux remplissage', 'Score Santé'],
            yticklabels=['Inscriptions', 'Nb Événements', 'Terminés', 'Taux remplissage', 'Score Santé'])
ax9.set_title('Matrice de Corrélation — Modèle 3\n(Métriques du Tableau de Bord)',
              fontsize=13, fontweight='bold', pad=20)

plt.savefig('C:/Users/LYESS/Desktop/Event Management/ia-studies/modele3_dashboard_analytics.png',
            dpi=150, bbox_inches='tight', facecolor='white')
print("\n✅ Graphiques sauvegardés : modele3_dashboard_analytics.png")
plt.show()

# ─────────────────────────────────────────────────────────────────────────────
# 4. ANALYSE PRÉDICTIVE — PROJECTION 30 JOURS
# ─────────────────────────────────────────────────────────────────────────────

fig3, (ax_a, ax_b) = plt.subplots(1, 2, figsize=(16, 6))
fig3.suptitle('Modèle 3 — Projection 30 Jours + Intervalle de Confiance',
              fontsize=14, fontweight='bold')

# Projection inscriptions
ax_a.plot(dates, daily_registrations, color='#2A3652', linewidth=1, alpha=0.7, label='Historique')
ax_a.plot(dates, y_trend_pred, color='#e31e24', linewidth=2, linestyle='--', label='Tendance')
ax_a.plot(future_days, future_pred, color='#27ae60', linewidth=2.5, label='Projection J+30')
ax_a.fill_between(future_days,
                  future_pred - 1.96 * res_sigma,
                  future_pred + 1.96 * res_sigma,
                  alpha=0.2, color='#27ae60', label='IC 95%')
ax_a.axvline(dates[-1], color='gray', linestyle=':', linewidth=2, label='Aujourd\'hui')
ax_a.set_title('Projection des Inscriptions', fontsize=12, fontweight='bold')
ax_a.set_xlabel('Date', fontsize=11)
ax_a.set_ylabel('Inscriptions / Jour', fontsize=11)
ax_a.legend(fontsize=9)

# Projection score de santé
future_scores = []
for i, fp in enumerate(future_pred):
    s = health_score(int(fp), 15, 10, 0.70 + i * 0.003)
    future_scores.append(s)
ax_b.plot(dates, df['health_score'], color='#2A3652', linewidth=1, alpha=0.7, label='Historique')
ax_b.plot(future_days, future_scores, color='#27ae60', linewidth=2.5, label='Projection Score Santé')
ax_b.axhline(80, color='#27ae60', linestyle='--', linewidth=1.5, alpha=0.6, label='Seuil Excellent (80)')
ax_b.axhline(65, color='#3a7bd5', linestyle='--', linewidth=1.5, alpha=0.6, label='Seuil Bon (65)')
ax_b.axvline(dates[-1], color='gray', linestyle=':', linewidth=2)
ax_b.set_title('Projection Score de Santé', fontsize=12, fontweight='bold')
ax_b.set_xlabel('Date', fontsize=11)
ax_b.set_ylabel('Score de Santé (/100)', fontsize=11)
ax_b.set_ylim(0, 105)
ax_b.legend(fontsize=9)

plt.tight_layout()
plt.savefig('C:/Users/LYESS/Desktop/Event Management/ia-studies/modele3_projections.png',
            dpi=150, bbox_inches='tight', facecolor='white')
print("✅ Projections sauvegardées : modele3_projections.png")
plt.show()

print("\n" + "="*60)
print("RÉSUMÉ MODÈLE 3")
print("="*60)
print(f"  Type           : Analytics IA Temps Réel (Dashboard)")
print(f"  Sous-modèle A  : Régression Linéaire de Tendance")
print(f"                   R² = {r2_lin:.4f} | Pente = +{slope:.3f}/jour")
print(f"  Sous-modèle B  : Détection d'Anomalies (règle 2σ)")
print(f"                   {n_anomalies} anomalies / {DAYS} jours ({anomaly_rate:.1f}%)")
print(f"                   Seuil haut = {res_upper:.1f} | Seuil bas = {res_lower:.1f}")
print(f"  Sous-modèle C  : Score de Santé Pondéré")
print(f"                   Score actuel = {current_score:.1f}/100 → {label}")
print(f"                   0.40×inscriptions + 0.30×complétion + 0.30×croissance")
print(f"  Projection J+30: {int(future_pred[-1])} inscriptions/j")
print(f"  Données        : {DAYS} jours de métriques plateforme")
