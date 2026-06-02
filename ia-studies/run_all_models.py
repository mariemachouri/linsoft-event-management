"""
=============================================================================
LANCEUR — Exécute les 3 études IA en séquence
=============================================================================
Usage : python run_all_models.py
=============================================================================
"""

import subprocess
import sys
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

models = [
    ("MODÈLE 1 — Régression Linéaire",         "modele1_regression_lineaire.py"),
    ("MODÈLE 2 — Réseau de Neurones (MLP)",     "modele2_neural_network.py"),
    ("MODÈLE 3 — Analytics IA Dashboard",       "modele3_dashboard_analytics.py"),
]

print("=" * 60)
print("  EVENT MANAGEMENT — ÉTUDES IA COMPLÈTES")
print("  LinSoft — Rapport IA")
print("=" * 60)

for title, script in models:
    print(f"\n▶  Lancement : {title}")
    print("-" * 60)
    result = subprocess.run([sys.executable, script], capture_output=False)
    if result.returncode != 0:
        print(f"❌ Erreur dans {script}")
    else:
        print(f"✅ {title} terminé")

print("\n" + "=" * 60)
print("  TOUS LES MODÈLES EXÉCUTÉS")
print("  Graphiques PNG sauvegardés dans : ia-studies/")
print("=" * 60)
