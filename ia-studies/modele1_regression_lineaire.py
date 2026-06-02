"""
=============================================================================
MODÈLE 1 — RÉGRESSION LINÉAIRE MULTIPLE
Prédiction du coût total d'un événement (≤ 100 participants)
=============================================================================
Projet  : Event Management Platform — LinSoft
Service : charges-service (AIChargePredictionService.java)
Auteur  : Rapport IA — Étude détaillée
=============================================================================
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import seaborn as sns
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
import warnings
warnings.filterwarnings('ignore')

# ─────────────────────────────────────────────────────────────────────────────
# 1. CONFIGURATION DES DONNÉES HISTORIQUES (extraites du Java)
# ─────────────────────────────────────────────────────────────────────────────

HISTORICAL_COSTS = {
    'conference': {'baseVenueCost': 150.0, 'cateringPerPerson': 45.0,
                   'equipmentCost': 800.0, 'staffingPerHour': 25.0,
                   'marketingBudget': 500.0, 'insuranceFlat': 200.0},
    'workshop':   {'baseVenueCost': 80.0,  'cateringPerPerson': 25.0,
                   'equipmentCost': 400.0, 'staffingPerHour': 20.0,
                   'marketingBudget': 200.0, 'insuranceFlat': 100.0},
    'meetup':     {'baseVenueCost': 50.0,  'cateringPerPerson': 15.0,
                   'equipmentCost': 200.0, 'staffingPerHour': 15.0,
                   'marketingBudget': 100.0, 'insuranceFlat': 50.0},
    'seminar':    {'baseVenueCost': 100.0, 'cateringPerPerson': 35.0,
                   'equipmentCost': 600.0, 'staffingPerHour': 22.0,
                   'marketingBudget': 300.0, 'insuranceFlat': 150.0},
}

CITY_MULTIPLIERS = {
    'Paris': 1.40, 'Nice': 1.30, 'Lyon': 1.20, 'Strasbourg': 1.15,
    'Marseille': 1.10, 'Nantes': 1.10, 'Bordeaux': 1.10, 'Toulouse': 1.00,
}

SPACE_PER_PERSON = {'conference': 3.0, 'workshop': 4.0, 'meetup': 2.0, 'seminar': 3.5}

# ─────────────────────────────────────────────────────────────────────────────
# 2. FONCTION DE CALCUL DES COÛTS (traduction exacte du Java)
# ─────────────────────────────────────────────────────────────────────────────

def calculate_cost(attendees, event_type, duration_hours, city,
                   catering=True, equipment=True, location='venue'):
    """Calcul exact du coût selon la logique Java AIChargePredictionService."""
    base = HISTORICAL_COSTS.get(event_type, HISTORICAL_COSTS['meetup'])
    cm   = CITY_MULTIPLIERS.get(city, 1.0)

    # Venue
    space       = attendees * SPACE_PER_PERSON.get(event_type, 3.0)
    size_scale  = max(1.0, space / 100.0)
    venue_cost  = base['baseVenueCost'] * cm * duration_hours * size_scale

    # Catering
    catering_factor = 1.5 if duration_hours > 4 else 1.0
    catering_cost   = base['cateringPerPerson'] * cm * attendees * catering_factor if catering else 0.0

    # Equipment
    loc_factor    = 0.3 if location == 'online' else 1.0
    equipment_cost = base['equipmentCost'] * cm * loc_factor if equipment else 0.0

    # Staffing
    staffing_cost = base['staffingPerHour'] * (duration_hours * attendees / 50.0) * cm

    # Marketing (log scale)
    marketing_cost = base['marketingBudget'] * np.log(attendees + 1) / np.log(100)

    # Insurance
    insurance_cost = base['insuranceFlat'] * cm

    # Misc (10%)
    subtotal = venue_cost + catering_cost + equipment_cost + staffing_cost + marketing_cost + insurance_cost
    misc_cost = subtotal * 0.10

    total = subtotal + misc_cost
    breakdown = {
        'venue': venue_cost, 'catering': catering_cost, 'equipment': equipment_cost,
        'staffing': staffing_cost, 'marketing': marketing_cost,
        'insurance': insurance_cost, 'misc': misc_cost
    }
    return total, breakdown


def confidence_score(attendees, duration_hours, city):
    """Score de confiance du modèle (logique Java)."""
    score = 0.70
    if 0 < attendees < 1000:        score += 0.10
    if 0 < duration_hours < 24:     score += 0.10
    if city in CITY_MULTIPLIERS:    score += 0.10
    return min(0.95, score)

# ─────────────────────────────────────────────────────────────────────────────
# 3. GÉNÉRATION DU DATASET SYNTHÉTIQUE
# ─────────────────────────────────────────────────────────────────────────────

np.random.seed(42)
N = 500

attendees_list  = np.random.randint(5, 101, N)
event_types     = np.random.choice(list(HISTORICAL_COSTS.keys()), N)
durations       = np.random.randint(1, 13, N)
cities          = np.random.choice(list(CITY_MULTIPLIERS.keys()), N)
catering_flags  = np.random.choice([True, False], N, p=[0.75, 0.25])
equipment_flags = np.random.choice([True, False], N, p=[0.80, 0.20])
locations       = np.random.choice(['venue', 'online', 'outdoor'], N, p=[0.65, 0.25, 0.10])

noise = np.random.normal(0, 150, N)  # bruit réaliste

rows = []
for i in range(N):
    total, bd = calculate_cost(
        attendees_list[i], event_types[i], durations[i], cities[i],
        catering_flags[i], equipment_flags[i], locations[i]
    )
    rows.append({
        'attendees': attendees_list[i],
        'event_type': event_types[i],
        'duration_hours': durations[i],
        'city': cities[i],
        'catering': int(catering_flags[i]),
        'equipment': int(equipment_flags[i]),
        'location': locations[i],
        'city_multiplier': CITY_MULTIPLIERS[cities[i]],
        'total_cost': max(0, total + noise[i]),
        **{f'cost_{k}': v for k, v in bd.items()},
    })

df = pd.DataFrame(rows)
print("=" * 60)
print("MODÈLE 1 — RÉGRESSION LINÉAIRE MULTIPLE")
print("=" * 60)
print(f"\n📊 Dataset généré : {len(df)} échantillons")
print(f"   Coût moyen   : {df['total_cost'].mean():,.0f} €")
print(f"   Coût médian  : {df['total_cost'].median():,.0f} €")
print(f"   Coût min/max : {df['total_cost'].min():,.0f} € / {df['total_cost'].max():,.0f} €")
print(f"   Écart-type   : {df['total_cost'].std():,.0f} €")

# ─────────────────────────────────────────────────────────────────────────────
# 4. PRÉPARATION ET ENTRAÎNEMENT DU MODÈLE
# ─────────────────────────────────────────────────────────────────────────────

features_num = ['attendees', 'duration_hours', 'catering', 'equipment', 'city_multiplier']
features_cat = ['event_type', 'location']

X = df[features_num + features_cat]
y = df['total_cost']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)

preprocessor = ColumnTransformer([
    ('num', StandardScaler(), features_num),
    ('cat', OneHotEncoder(drop='first', sparse_output=False), features_cat),
])

model = Pipeline([
    ('preprocessor', preprocessor),
    ('regressor', LinearRegression()),
])

model.fit(X_train, y_train)
y_pred      = model.predict(X_test)
y_pred_full = model.predict(X)

# Métriques
r2   = r2_score(y_test, y_pred)
mse  = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
mae  = mean_absolute_error(y_test, y_pred)
cv   = cross_val_score(model, X, y, cv=5, scoring='r2')

print("\n📈 MÉTRIQUES DU MODÈLE")
print("-" * 40)
print(f"   R²            : {r2:.4f}")
print(f"   RMSE          : {rmse:,.2f} €")
print(f"   MAE           : {mae:,.2f} €")
print(f"   MSE           : {mse:,.2f}")
print(f"   CV R² (5-fold): {cv.mean():.4f} ± {cv.std():.4f}")

# ─────────────────────────────────────────────────────────────────────────────
# 5. VISUALISATIONS
# ─────────────────────────────────────────────────────────────────────────────

plt.style.use('seaborn-v0_8-whitegrid')
colors = {'conference': '#2A3652', 'workshop': '#3a7bd5',
          'meetup': '#e67e22', 'seminar': '#FF5276'}

fig = plt.figure(figsize=(22, 26))
fig.suptitle('MODÈLE 1 — Régression Linéaire Multiple\nPrédiction du Coût Total d\'Événement (≤ 100 participants)',
             fontsize=16, fontweight='bold', y=0.98)
gs = gridspec.GridSpec(4, 3, figure=fig, hspace=0.45, wspace=0.35)

# ── 5.1 Coût vs Participants (par type) ──────────────────────────────────────
ax1 = fig.add_subplot(gs[0, :2])
att_range = np.arange(5, 101, 5)
for etype, color in colors.items():
    costs = [calculate_cost(a, etype, 6, 'Paris', True, True)[0] for a in att_range]
    ax1.plot(att_range, costs, color=color, linewidth=2.5, marker='o',
             markersize=4, label=etype.capitalize())
ax1.set_title('Corrélation : Coût Total vs Nombre de Participants\n(Paris, 6h, catering + équipement)',
              fontsize=12, fontweight='bold')
ax1.set_xlabel('Nombre de Participants', fontsize=11)
ax1.set_ylabel('Coût Total (€)', fontsize=11)
ax1.legend(fontsize=10)
ax1.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x:,.0f}€'))
ax1.fill_between(att_range,
    [calculate_cost(a, 'meetup', 6, 'Paris', True, True)[0] for a in att_range],
    [calculate_cost(a, 'conference', 6, 'Paris', True, True)[0] for a in att_range],
    alpha=0.08, color='gray', label='Zone coût possible')

# ── 5.2 Distribution des coûts ───────────────────────────────────────────────
ax2 = fig.add_subplot(gs[0, 2])
ax2.hist(df['total_cost'], bins=30, color='#2A3652', edgecolor='white', alpha=0.85)
ax2.axvline(df['total_cost'].mean(),  color='#e31e24', linewidth=2, linestyle='--', label=f'Moyenne: {df["total_cost"].mean():,.0f}€')
ax2.axvline(df['total_cost'].median(), color='#27ae60', linewidth=2, linestyle='--', label=f'Médiane: {df["total_cost"].median():,.0f}€')
ax2.set_title('Distribution des Coûts\n(Dataset complet)', fontsize=12, fontweight='bold')
ax2.set_xlabel('Coût Total (€)', fontsize=11)
ax2.set_ylabel('Fréquence', fontsize=11)
ax2.legend(fontsize=9)
ax2.xaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x:,.0f}€'))

# ── 5.3 Coût vs Durée (discontinuité à 4h) ───────────────────────────────────
ax3 = fig.add_subplot(gs[1, :2])
dur_range = np.arange(1, 13)
for etype, color in colors.items():
    costs = [calculate_cost(50, etype, d, 'Paris', True, True)[0] for d in dur_range]
    ax3.plot(dur_range, costs, color=color, linewidth=2.5, marker='s',
             markersize=5, label=etype.capitalize())
ax3.axvline(4, color='#e31e24', linestyle='--', linewidth=1.5, alpha=0.7, label='Seuil 4h (facteur catering ×1.5)')
ax3.annotate('Rupture catering\n(×1.0 → ×1.5)', xy=(4, ax3.get_ylim()[1] if ax3.get_ylim()[1] > 1 else 5000),
             xytext=(5.5, ax3.get_ylim()[1] if ax3.get_ylim()[1] > 1 else 5000),
             fontsize=9, color='#e31e24',
             arrowprops=dict(arrowstyle='->', color='#e31e24'))
ax3.set_title('Corrélation : Coût Total vs Durée\n(50 participants, Paris, catering + équipement)',
              fontsize=12, fontweight='bold')
ax3.set_xlabel('Durée (heures)', fontsize=11)
ax3.set_ylabel('Coût Total (€)', fontsize=11)
ax3.set_xticks(dur_range)
ax3.legend(fontsize=9)
ax3.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x:,.0f}€'))

# ── 5.4 Multiplicateurs géographiques ────────────────────────────────────────
ax4 = fig.add_subplot(gs[1, 2])
cities_sorted = sorted(CITY_MULTIPLIERS.items(), key=lambda x: x[1], reverse=True)
city_names, city_mults = zip(*cities_sorted)
bar_colors = ['#e31e24' if m >= 1.3 else '#e67e22' if m >= 1.1 else '#27ae60' for m in city_mults]
bars = ax4.barh(city_names, city_mults, color=bar_colors, edgecolor='white', height=0.6)
ax4.axvline(1.0, color='gray', linestyle='--', linewidth=1.5, alpha=0.7, label='Référence (×1.0)')
for bar, mult in zip(bars, city_mults):
    ax4.text(mult + 0.005, bar.get_y() + bar.get_height()/2,
             f'×{mult:.2f}', va='center', fontsize=10, fontweight='bold')
ax4.set_title('Multiplicateurs\nGéographiques', fontsize=12, fontweight='bold')
ax4.set_xlabel('Multiplicateur', fontsize=11)
ax4.set_xlim(0.9, 1.55)
ax4.legend(fontsize=9)

# ── 5.5 Prédictions vs Réalité ───────────────────────────────────────────────
ax5 = fig.add_subplot(gs[2, 0])
ax5.scatter(y_test, y_pred, alpha=0.5, color='#2A3652', s=20)
lims = [min(y_test.min(), y_pred.min()), max(y_test.max(), y_pred.max())]
ax5.plot(lims, lims, 'r--', linewidth=2, label='Prédiction parfaite')
ax5.set_title(f'Valeurs Réelles vs Prédites\nR² = {r2:.4f}', fontsize=12, fontweight='bold')
ax5.set_xlabel('Coût réel (€)', fontsize=11)
ax5.set_ylabel('Coût prédit (€)', fontsize=11)
ax5.legend(fontsize=9)
ax5.xaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x:,.0f}€'))
ax5.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x:,.0f}€'))

# ── 5.6 Résidus ───────────────────────────────────────────────────────────────
ax6 = fig.add_subplot(gs[2, 1])
residuals = y_test.values - y_pred
ax6.scatter(y_pred, residuals, alpha=0.5, color='#3a7bd5', s=20)
ax6.axhline(0, color='red', linestyle='--', linewidth=1.5)
ax6.axhline(residuals.std() * 2,  color='orange', linestyle=':', linewidth=1.5, label='+2σ')
ax6.axhline(-residuals.std() * 2, color='orange', linestyle=':', linewidth=1.5, label='-2σ')
ax6.set_title('Analyse des Résidus', fontsize=12, fontweight='bold')
ax6.set_xlabel('Valeur prédite (€)', fontsize=11)
ax6.set_ylabel('Résidu (€)', fontsize=11)
ax6.legend(fontsize=9)

# ── 5.7 Importance des features (coefficients) ───────────────────────────────
ax7 = fig.add_subplot(gs[2, 2])
regressor   = model.named_steps['regressor']
preprocessor_fitted = model.named_steps['preprocessor']
num_features = features_num
cat_features = preprocessor_fitted.named_transformers_['cat'].get_feature_names_out(features_cat).tolist()
all_features = num_features + cat_features
coefs = regressor.coef_
top_n = 10
top_idx   = np.argsort(np.abs(coefs))[-top_n:][::-1]
top_coefs = coefs[top_idx]
top_names = [all_features[i] for i in top_idx]
bar_c = ['#e31e24' if c > 0 else '#2A3652' for c in top_coefs]
ax7.barh(range(top_n), top_coefs, color=bar_c, edgecolor='white')
ax7.set_yticks(range(top_n))
ax7.set_yticklabels(top_names, fontsize=9)
ax7.axvline(0, color='gray', linewidth=1)
ax7.set_title('Coefficients du Modèle\n(Top 10)', fontsize=12, fontweight='bold')
ax7.set_xlabel('Coefficient', fontsize=11)

# ── 5.8 Décomposition des coûts par type ─────────────────────────────────────
ax8 = fig.add_subplot(gs[3, :2])
et_names = list(HISTORICAL_COSTS.keys())
components = ['venue', 'catering', 'equipment', 'staffing', 'marketing', 'insurance', 'misc']
comp_colors = ['#2A3652', '#3a7bd5', '#e67e22', '#27ae60', '#8e44ad', '#FF5276', '#95a5a6']
comp_data = {}
for comp in components:
    comp_data[comp] = [calculate_cost(50, et, 6, 'Paris', True, True)[1][comp] for et in et_names]
bottom = np.zeros(len(et_names))
for comp, color in zip(components, comp_colors):
    values = np.array(comp_data[comp])
    ax8.bar(et_names, values, bottom=bottom, label=comp.capitalize(), color=color, edgecolor='white')
    bottom += values
ax8.set_title('Décomposition des Coûts par Type d\'Événement\n(50 pers., Paris, 6h)',
              fontsize=12, fontweight='bold')
ax8.set_xlabel('Type d\'Événement', fontsize=11)
ax8.set_ylabel('Coût (€)', fontsize=11)
ax8.legend(loc='upper left', fontsize=9, ncol=4)
ax8.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x:,.0f}€'))

# ── 5.9 Score de confiance ────────────────────────────────────────────────────
ax9 = fig.add_subplot(gs[3, 2])
conf_scenarios = [
    ('attendees✓\nduration✓\ncity✓', 3, '#27ae60'),
    ('attendees✓\nduration✓\ncity✗', 2, '#e67e22'),
    ('attendees✓\nduration✗\ncity✗', 1, '#e67e22'),
    ('aucun\ncritère',               0, '#e74c3c'),
]
labels, n_criteria, bar_colors2 = zip(*conf_scenarios)
scores = [min(0.95, 0.70 + n * 0.10) for n in n_criteria]
bars9 = ax9.bar(labels, [s * 100 for s in scores], color=bar_colors2, edgecolor='white', width=0.6)
ax9.axhline(70, color='gray', linestyle='--', linewidth=1.5, alpha=0.7, label='Base (70%)')
for bar, score in zip(bars9, scores):
    ax9.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5,
             f'{score*100:.0f}%', ha='center', fontsize=11, fontweight='bold')
ax9.set_title('Score de Confiance\nselon les Critères', fontsize=12, fontweight='bold')
ax9.set_ylabel('Confiance (%)', fontsize=11)
ax9.set_ylim(0, 105)
ax9.legend(fontsize=9)

plt.savefig('C:/Users/LYESS/Desktop/Event Management/ia-studies/modele1_regression_lineaire.png',
            dpi=150, bbox_inches='tight', facecolor='white')
print("\n✅ Graphiques sauvegardés : modele1_regression_lineaire.png")
plt.show()

# ─────────────────────────────────────────────────────────────────────────────
# 6. MATRICE DE CORRÉLATION
# ─────────────────────────────────────────────────────────────────────────────
fig2, ax = plt.subplots(figsize=(10, 8))
num_cols = ['attendees', 'duration_hours', 'catering', 'equipment',
            'city_multiplier', 'total_cost', 'cost_venue', 'cost_catering',
            'cost_staffing', 'cost_marketing']
corr_matrix = df[num_cols].corr()
mask = np.triu(np.ones_like(corr_matrix, dtype=bool))
sns.heatmap(corr_matrix, annot=True, fmt='.2f', cmap='RdYlGn',
            center=0, vmin=-1, vmax=1, ax=ax,
            linewidths=0.5, mask=mask,
            annot_kws={'size': 9})
ax.set_title('Matrice de Corrélation — Modèle 1\n(Variables numériques)',
             fontsize=14, fontweight='bold', pad=20)
plt.xticks(rotation=45, ha='right')
plt.yticks(rotation=0)
plt.tight_layout()
plt.savefig('C:/Users/LYESS/Desktop/Event Management/ia-studies/modele1_matrice_correlation.png',
            dpi=150, bbox_inches='tight', facecolor='white')
print("✅ Matrice de corrélation sauvegardée : modele1_matrice_correlation.png")
plt.show()

print("\n" + "="*60)
print("RÉSUMÉ MODÈLE 1")
print("="*60)
print(f"  Type           : Régression Linéaire Multiple")
print(f"  Features       : {len(features_num + features_cat)} variables ({len(features_num)} num + {len(features_cat)} cat)")
print(f"  Target         : Coût total de l'événement (€)")
print(f"  Échantillons   : {len(df)} (train={len(X_train)}, test={len(X_test)})")
print(f"  R²             : {r2:.4f}  ({r2*100:.1f}% variance expliquée)")
print(f"  RMSE           : {rmse:,.2f} €")
print(f"  MAE            : {mae:,.2f} €")
print(f"  CV R² (5-fold) : {cv.mean():.4f} ± {cv.std():.4f}")
print(f"  Confiance max  : 95%")
