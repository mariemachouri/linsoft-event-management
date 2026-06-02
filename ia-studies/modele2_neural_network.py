"""
=============================================================================
MODÈLE 2 — RÉSEAU DE NEURONES (MLP) — GRANDS ÉVÉNEMENTS
Prédiction du coût + mode de paiement + risques (> 100 participants)
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
from sklearn.neural_network import MLPRegressor, MLPClassifier
from sklearn.model_selection import train_test_split, learning_curve
from sklearn.metrics import (mean_squared_error, r2_score, mean_absolute_error,
                              classification_report, confusion_matrix)
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.pipeline import Pipeline
import warnings
warnings.filterwarnings('ignore')

# ─────────────────────────────────────────────────────────────────────────────
# 1. CONFIGURATION (identique au Java pour cohérence)
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
# 2. FONCTIONS DE CALCUL (grands événements, > 100 pers.)
# ─────────────────────────────────────────────────────────────────────────────

def calculate_cost_large(attendees, event_type, duration_hours, city,
                          catering=True, equipment=True, location='venue'):
    """Modèle Neural Network — grands événements (scaling non-linéaire)."""
    base = HISTORICAL_COSTS.get(event_type, HISTORICAL_COSTS['meetup'])
    cm   = CITY_MULTIPLIERS.get(city, 1.0)

    # Venue — scaling sub-linéaire (sizeScale)
    space      = attendees * SPACE_PER_PERSON.get(event_type, 3.0)
    size_scale = max(1.0, space / 100.0)  # effet d'échelle non-linéaire
    venue_cost = base['baseVenueCost'] * cm * duration_hours * size_scale

    # Catering — facteur ×1.5 si > 4h
    catering_factor = 1.5 if duration_hours > 4 else 1.0
    catering_cost   = base['cateringPerPerson'] * cm * attendees * catering_factor if catering else 0.0

    # Equipment
    loc_factor     = 0.3 if location == 'online' else 1.0
    equipment_cost = base['equipmentCost'] * cm * loc_factor if equipment else 0.0

    # Staffing — ratio n/50
    staffing_cost = base['staffingPerHour'] * (duration_hours * attendees / 50.0) * cm

    # Marketing — log scale
    marketing_cost = base['marketingBudget'] * np.log(attendees + 1) / np.log(100)

    # Insurance
    insurance_cost = base['insuranceFlat'] * cm

    subtotal  = venue_cost + catering_cost + equipment_cost + staffing_cost + marketing_cost + insurance_cost
    misc_cost = subtotal * 0.10
    total     = subtotal + misc_cost

    return total, {
        'venue': venue_cost, 'catering': catering_cost, 'equipment': equipment_cost,
        'staffing': staffing_cost, 'marketing': marketing_cost,
        'insurance': insurance_cost, 'misc': misc_cost
    }


def get_payment_class(total_cost):
    """Logique Java : recommandation mode de paiement."""
    if total_cost < 1000:   return 0   # ONLINE
    elif total_cost < 5000: return 1   # HYBRID
    else:                   return 2   # ONSITE


def count_risks(attendees, total_cost, location, event_type, duration_hours):
    """Nombre de facteurs de risque détectés (logique Java)."""
    risks = 0
    if attendees > 500:                                    risks += 1
    if total_cost > 10000:                                 risks += 1
    if location == 'outdoor':                              risks += 1
    if event_type == 'conference' and duration_hours > 8:  risks += 1
    return risks


def requires_approval(total_cost):
    return 1 if total_cost > 5000 else 0

# ─────────────────────────────────────────────────────────────────────────────
# 3. GÉNÉRATION DU DATASET (grands événements : 101–1000 pers.)
# ─────────────────────────────────────────────────────────────────────────────

np.random.seed(42)
N = 800

attendees_list  = np.random.randint(101, 1001, N)
event_types     = np.random.choice(list(HISTORICAL_COSTS.keys()), N)
durations       = np.random.randint(1, 13, N)
cities          = np.random.choice(list(CITY_MULTIPLIERS.keys()), N)
catering_flags  = np.random.choice([True, False], N, p=[0.80, 0.20])
equipment_flags = np.random.choice([True, False], N, p=[0.85, 0.15])
locations       = np.random.choice(['venue', 'online', 'outdoor'], N, p=[0.60, 0.25, 0.15])

noise = np.random.normal(0, 500, N)

rows = []
for i in range(N):
    total, bd = calculate_cost_large(
        attendees_list[i], event_types[i], durations[i], cities[i],
        catering_flags[i], equipment_flags[i], locations[i]
    )
    noisy_total = max(0, total + noise[i])
    rows.append({
        'attendees':      attendees_list[i],
        'event_type_enc': list(HISTORICAL_COSTS.keys()).index(event_types[i]),
        'duration_hours': durations[i],
        'city_mult':      CITY_MULTIPLIERS[cities[i]],
        'catering':       int(catering_flags[i]),
        'equipment':      int(equipment_flags[i]),
        'location_enc':   ['venue', 'online', 'outdoor'].index(locations[i]),
        'log_attendees':  np.log(attendees_list[i]),
        'att_x_dur':      attendees_list[i] * durations[i],
        'total_cost':     noisy_total,
        'payment_class':  get_payment_class(noisy_total),
        'n_risks':        count_risks(attendees_list[i], noisy_total, locations[i],
                                      event_types[i], durations[i]),
        'needs_approval': requires_approval(noisy_total),
        'event_type':     event_types[i],
        **{f'cost_{k}': v for k, v in bd.items()},
    })

df = pd.DataFrame(rows)

print("=" * 60)
print("MODÈLE 2 — RÉSEAU DE NEURONES (MLP)")
print("=" * 60)
print(f"\n📊 Dataset : {len(df)} grands événements (101-1000 pers.)")
print(f"   Coût moyen    : {df['total_cost'].mean():,.0f} €")
print(f"   Coût médian   : {df['total_cost'].median():,.0f} €")
print(f"   Coût max      : {df['total_cost'].max():,.0f} €")
print(f"\n   Distribution paiement :")
payment_labels = {0: 'ONLINE (<1k€)', 1: 'HYBRID (1k-5k€)', 2: 'ONSITE (>5k€)'}
for k, v in df['payment_class'].value_counts().sort_index().items():
    print(f"     {payment_labels[k]}: {v} ({v/N*100:.1f}%)")

# ─────────────────────────────────────────────────────────────────────────────
# 4A. MLP RÉGRESSION — PRÉDICTION DU COÛT
# ─────────────────────────────────────────────────────────────────────────────

features = ['attendees', 'event_type_enc', 'duration_hours', 'city_mult',
            'catering', 'equipment', 'location_enc', 'log_attendees', 'att_x_dur']
X = df[features].values
y_cost = df['total_cost'].values

X_train, X_test, y_train, y_test = train_test_split(X, y_cost, test_size=0.20, random_state=42)

scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s  = scaler.transform(X_test)

mlp_reg = MLPRegressor(
    hidden_layer_sizes=(128, 64, 32),
    activation='relu',
    solver='adam',
    max_iter=500,
    random_state=42,
    early_stopping=True,
    validation_fraction=0.15,
    learning_rate_init=0.001
)
mlp_reg.fit(X_train_s, y_train)
y_pred_cost = mlp_reg.predict(X_test_s)

r2   = r2_score(y_test, y_pred_cost)
rmse = np.sqrt(mean_squared_error(y_test, y_pred_cost))
mae  = mean_absolute_error(y_test, y_pred_cost)

print(f"\n📈 MLP RÉGRESSION (Coût Total)")
print(f"   Architecture  : 9 → 128 → 64 → 32 → 1")
print(f"   Activation    : ReLU")
print(f"   R²            : {r2:.4f}")
print(f"   RMSE          : {rmse:,.2f} €")
print(f"   MAE           : {mae:,.2f} €")

# ─────────────────────────────────────────────────────────────────────────────
# 4B. MLP CLASSIFICATION — MODE DE PAIEMENT
# ─────────────────────────────────────────────────────────────────────────────

y_pay = df['payment_class'].values
Xp_train, Xp_test, yp_train, yp_test = train_test_split(X, y_pay, test_size=0.20, random_state=42)
Xp_train_s = scaler.fit_transform(Xp_train)
Xp_test_s  = scaler.transform(Xp_test)

mlp_clf = MLPClassifier(
    hidden_layer_sizes=(64, 32),
    activation='relu',
    solver='adam',
    max_iter=300,
    random_state=42
)
mlp_clf.fit(Xp_train_s, yp_train)
yp_pred = mlp_clf.predict(Xp_test_s)

print(f"\n📈 MLP CLASSIFICATION (Mode de Paiement)")
print(f"   Architecture  : 9 → 64 → 32 → 3 classes")
print(f"   Classes       : ONLINE / HYBRID / ONSITE")
clf_rep = classification_report(yp_test, yp_pred,
                                 target_names=['ONLINE', 'HYBRID', 'ONSITE'])
print(clf_rep)

# ─────────────────────────────────────────────────────────────────────────────
# 5. VISUALISATIONS
# ─────────────────────────────────────────────────────────────────────────────

plt.style.use('seaborn-v0_8-whitegrid')
fig = plt.figure(figsize=(22, 28))
fig.suptitle('MODÈLE 2 — Réseau de Neurones (MLP)\nGrands Événements (> 100 participants)',
             fontsize=16, fontweight='bold', y=0.98)
gs = gridspec.GridSpec(4, 3, figure=fig, hspace=0.45, wspace=0.35)

# ── 5.1 Coût vs Participants (101-1000, par type) ─────────────────────────────
ax1 = fig.add_subplot(gs[0, :2])
att_range = np.arange(101, 1001, 50)
colors = {'conference': '#2A3652', 'workshop': '#3a7bd5',
          'meetup': '#e67e22', 'seminar': '#FF5276'}
for etype, color in colors.items():
    costs = [calculate_cost_large(a, etype, 6, 'Paris', True, True)[0] for a in att_range]
    ax1.plot(att_range, costs, color=color, linewidth=2.5, label=etype.capitalize())
ax1.axvline(500, color='#e74c3c', linestyle='--', linewidth=1.5, label='Seuil risque (500 pers.)')
ax1.axhline(10000, color='orange',  linestyle=':', linewidth=1.5, label='Seuil approbation (10k€)')
ax1.set_title('Corrélation : Coût vs Participants — Grands Événements\n(Paris, 6h, catering + équipement)',
              fontsize=12, fontweight='bold')
ax1.set_xlabel('Nombre de Participants', fontsize=11)
ax1.set_ylabel('Coût Total (€)', fontsize=11)
ax1.legend(fontsize=9)
ax1.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x:,.0f}€'))

# ── 5.2 Courbe d'apprentissage MLP ───────────────────────────────────────────
ax2 = fig.add_subplot(gs[0, 2])
loss_curve = mlp_reg.loss_curve_
ax2.plot(loss_curve, color='#2A3652', linewidth=2)
if hasattr(mlp_reg, 'validation_scores_') and mlp_reg.validation_scores_:
    val_loss = [-s for s in mlp_reg.validation_scores_]
    ax2.plot(val_loss[:len(loss_curve)], color='#e31e24', linewidth=2,
             linestyle='--', label='Validation')
ax2.set_title('Courbe d\'Apprentissage MLP\n(Loss vs Époque)', fontsize=12, fontweight='bold')
ax2.set_xlabel('Époque', fontsize=11)
ax2.set_ylabel('Loss (MSE)', fontsize=11)
ax2.legend(['Entraînement', 'Validation'], fontsize=9)

# ── 5.3 Scaling non-linéaire (venue sizeScale) ───────────────────────────────
ax3 = fig.add_subplot(gs[1, 0])
att_all = np.arange(10, 1001, 10)
for etype, color in colors.items():
    spaces = att_all * SPACE_PER_PERSON[etype]
    size_scales = np.maximum(1.0, spaces / 100.0)
    ax3.plot(att_all, size_scales, color=color, linewidth=2, label=etype.capitalize())
ax3.axvline(100, color='gray', linestyle='--', linewidth=1.5, alpha=0.7, label='Seuil LR/NN')
ax3.set_title('Effet d\'Échelle Venue\n(sizeScale = max(1, surface/100))',
              fontsize=12, fontweight='bold')
ax3.set_xlabel('Participants', fontsize=11)
ax3.set_ylabel('Multiplicateur sizeScale', fontsize=11)
ax3.legend(fontsize=9)

# ── 5.4 Marketing — scaling logarithmique ────────────────────────────────────
ax4 = fig.add_subplot(gs[1, 1])
att_all2 = np.arange(5, 1001, 5)
for etype, color in colors.items():
    base_mkt = HISTORICAL_COSTS[etype]['marketingBudget']
    mkt_costs = [base_mkt * np.log(a + 1) / np.log(100) for a in att_all2]
    ax4.plot(att_all2, mkt_costs, color=color, linewidth=2, label=etype.capitalize())
ax4.axvline(100, color='gray', linestyle='--', linewidth=1.5, alpha=0.7, label='100 pers.')
ax4.set_title('Coût Marketing (Loi Logarithmique)\nmarketing × ln(n+1)/ln(100)',
              fontsize=12, fontweight='bold')
ax4.set_xlabel('Participants', fontsize=11)
ax4.set_ylabel('Coût Marketing (€)', fontsize=11)
ax4.legend(fontsize=9)

# ── 5.5 Décision mode de paiement ────────────────────────────────────────────
ax5 = fig.add_subplot(gs[1, 2])
cost_range = np.arange(0, 20001, 100)
payment_colors_map = {0: '#27ae60', 1: '#e67e22', 2: '#e74c3c'}
payment_labels_map  = {0: 'ONLINE', 1: 'HYBRID', 2: 'ONSITE'}
prev_class = None
start = 0
for i, c in enumerate(cost_range):
    cls = get_payment_class(c)
    if cls != prev_class:
        if prev_class is not None:
            ax5.axvspan(start, c, alpha=0.3, color=payment_colors_map[prev_class],
                        label=payment_labels_map[prev_class])
        start = c
        prev_class = cls
ax5.axvspan(start, cost_range[-1], alpha=0.3, color=payment_colors_map[prev_class],
            label=payment_labels_map[prev_class])
ax5.axvline(1000, color='gray', linestyle='--', linewidth=1.5, label='Seuil 1 000€')
ax5.axvline(5000, color='gray', linestyle=':',  linewidth=1.5, label='Seuil 5 000€')
ax5.set_title('Frontières de Décision\nMode de Paiement', fontsize=12, fontweight='bold')
ax5.set_xlabel('Coût Total (€)', fontsize=11)
ax5.set_xlim(0, 15000)
ax5.set_yticks([])
ax5.legend(fontsize=9, loc='upper left')
ax5.xaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x:,.0f}€'))

# ── 5.6 Prédictions vs Réalité (MLP Régression) ──────────────────────────────
ax6 = fig.add_subplot(gs[2, 0])
ax6.scatter(y_test, y_pred_cost, alpha=0.4, color='#3a7bd5', s=15)
lims = [min(y_test.min(), y_pred_cost.min()), max(y_test.max(), y_pred_cost.max())]
ax6.plot(lims, lims, 'r--', linewidth=2, label='Prédiction parfaite')
ax6.set_title(f'MLP Régression\nRéel vs Prédit (R² = {r2:.4f})', fontsize=12, fontweight='bold')
ax6.set_xlabel('Coût réel (€)', fontsize=11)
ax6.set_ylabel('Coût prédit (€)', fontsize=11)
ax6.legend(fontsize=9)
ax6.xaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x:,.0f}€'))
ax6.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x:,.0f}€'))

# ── 5.7 Matrice de confusion (classification paiement) ───────────────────────
ax7 = fig.add_subplot(gs[2, 1])
cm_mat = confusion_matrix(yp_test, yp_pred)
sns.heatmap(cm_mat, annot=True, fmt='d', cmap='Blues', ax=ax7,
            xticklabels=['ONLINE', 'HYBRID', 'ONSITE'],
            yticklabels=['ONLINE', 'HYBRID', 'ONSITE'],
            linewidths=0.5)
ax7.set_title('Matrice de Confusion\nClassification Mode de Paiement', fontsize=12, fontweight='bold')
ax7.set_xlabel('Prédit', fontsize=11)
ax7.set_ylabel('Réel', fontsize=11)

# ── 5.8 Distribution des risques ─────────────────────────────────────────────
ax8 = fig.add_subplot(gs[2, 2])
risk_counts = df['n_risks'].value_counts().sort_index()
risk_colors = ['#27ae60', '#e67e22', '#e74c3c', '#8e44ad'][:len(risk_counts)]
bars8 = ax8.bar(risk_counts.index, risk_counts.values, color=risk_colors, edgecolor='white')
for bar, count in zip(bars8, risk_counts.values):
    ax8.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 3,
             f'{count}\n({count/N*100:.1f}%)', ha='center', fontsize=9, fontweight='bold')
ax8.set_title('Distribution des Facteurs\nde Risque Détectés', fontsize=12, fontweight='bold')
ax8.set_xlabel('Nombre de Risques', fontsize=11)
ax8.set_ylabel('Nombre d\'Événements', fontsize=11)
ax8.set_xticks([0, 1, 2, 3])
ax8.set_xticklabels(['Aucun', '1 risque', '2 risques', '3 risques'])

# ── 5.9 Architecture du réseau de neurones ───────────────────────────────────
ax9 = fig.add_subplot(gs[3, :])
ax9.set_xlim(0, 10)
ax9.set_ylim(0, 6)
ax9.axis('off')
ax9.set_title('Architecture du Réseau de Neurones MLP', fontsize=13, fontweight='bold', pad=15)

layers = [
    ('Entrée\n9 features', 9, 0.8, '#95a5a6'),
    ('Couche 1\n128 neurones\nReLU', 8, 2.5, '#2A3652'),
    ('Couche 2\n64 neurones\nReLU', 6, 4.5, '#3a7bd5'),
    ('Couche 3\n32 neurones\nReLU', 5, 6.5, '#3a7bd5'),
    ('Sortie\n1 neurone\n(Coût €)', 1, 8.5, '#27ae60'),
]

for i, (label, n_neurons, x_pos, color) in enumerate(layers):
    display_n = min(n_neurons, 6)
    y_positions = np.linspace(0.5, 5.5, display_n)
    for y in y_positions:
        circle = plt.Circle((x_pos, y), 0.18, color=color, zorder=3)
        ax9.add_patch(circle)
    if n_neurons > display_n:
        ax9.text(x_pos, 3.0, '...', ha='center', va='center', fontsize=14, color=color)
    ax9.text(x_pos, -0.2, label, ha='center', va='top', fontsize=8,
             fontweight='bold', color='#2c3e50', wrap=True)

for i in range(len(layers) - 1):
    x1, x2 = layers[i][2], layers[i+1][2]
    for y1 in np.linspace(0.5, 5.5, min(layers[i][1], 6)):
        for y2 in np.linspace(0.5, 5.5, min(layers[i+1][1], 6)):
            ax9.plot([x1 + 0.18, x2 - 0.18], [y1, y2],
                     color='#bdc3c7', linewidth=0.4, alpha=0.5, zorder=1)

plt.savefig('C:/Users/LYESS/Desktop/Event Management/ia-studies/modele2_neural_network.png',
            dpi=150, bbox_inches='tight', facecolor='white')
print("\n✅ Graphiques sauvegardés : modele2_neural_network.png")
plt.show()

# ─────────────────────────────────────────────────────────────────────────────
# 6. CORRÉLATION FEATURES vs COÛT
# ─────────────────────────────────────────────────────────────────────────────
fig2, axes = plt.subplots(2, 3, figsize=(16, 10))
fig2.suptitle('Corrélations Individuelles — Modèle 2 (NN)\nFeatures vs Coût Total',
              fontsize=14, fontweight='bold')

plot_features = [
    ('attendees',      'Participants'),
    ('duration_hours', 'Durée (h)'),
    ('city_mult',      'Multiplicateur Ville'),
    ('catering',       'Catering (0/1)'),
    ('equipment',      'Équipement (0/1)'),
    ('log_attendees',  'log(Participants)'),
]

for ax, (feat, label) in zip(axes.flatten(), plot_features):
    ax.scatter(df[feat], df['total_cost'], alpha=0.3, s=10, color='#2A3652')
    z = np.polyfit(df[feat], df['total_cost'], 1)
    p = np.poly1d(z)
    x_line = np.linspace(df[feat].min(), df[feat].max(), 100)
    ax.plot(x_line, p(x_line), 'r-', linewidth=2)
    corr = df[feat].corr(df['total_cost'])
    ax.set_title(f'{label}\nr = {corr:.3f}', fontsize=11, fontweight='bold')
    ax.set_xlabel(label, fontsize=10)
    ax.set_ylabel('Coût (€)', fontsize=10)
    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x:,.0f}€'))

plt.tight_layout()
plt.savefig('C:/Users/LYESS/Desktop/Event Management/ia-studies/modele2_correlations.png',
            dpi=150, bbox_inches='tight', facecolor='white')
print("✅ Corrélations sauvegardées : modele2_correlations.png")
plt.show()

print("\n" + "="*60)
print("RÉSUMÉ MODÈLE 2")
print("="*60)
print(f"  Type           : Réseau de Neurones MLP")
print(f"  Architecture   : 9 → 128 → 64 → 32 → 1 (régression)")
print(f"                   9 → 64 → 32 → 3 (classification)")
print(f"  Target 1       : Coût total (€) — R² = {r2:.4f}")
print(f"  Target 2       : Mode de paiement (3 classes)")
print(f"  Target 3       : Facteurs de risque (0-4)")
print(f"  Target 4       : Approbation requise (binaire)")
print(f"  Échantillons   : {N} grands événements (>100 pers.)")
print(f"  RMSE Coût      : {rmse:,.2f} €")
print(f"  MAE Coût       : {mae:,.2f} €")
