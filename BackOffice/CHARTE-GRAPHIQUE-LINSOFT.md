# 🎨 Charte Graphique Linsoft - Guide d'Utilisation

## Vue d'ensemble

Ce guide présente la charte graphique Linsoft appliquée au backoffice, inspirée du site officiel [www.linsoft.com](https://www.linsoft.com/fr).

## 📐 Palette de Couleurs

### Couleurs Principales

#### Bleu Linsoft (Principal)
- **Primary**: `#0066cc` - Bleu corporate principal
- **Primary Dark**: `#004c99` - Pour les éléments sombres
- **Primary Light**: `#3399ff` - Pour les éléments clairs
- **Secondary**: `#00ccff` - Bleu technologique/accent

#### Couleurs d'Accent
- **Orange**: `#ff6b35` - Accent chaleureux
- **Rouge**: `#e63946` - Accent alternatif

### Couleurs Neutres

- **Dark**: `#1a1a2e` - Fond sombre principal
- **Dark Secondary**: `#16213e` - Fond sombre secondaire
- **Gray Dark**: `#2c3e50` - Textes foncés
- **Gray**: `#7f8c8d` - Textes neutres
- **Gray Light**: `#ecf0f1` - Fonds clairs
- **White**: `#ffffff` - Blanc pur
- **Background**: `#f5f7fa` - Fond de page

### Couleurs de Statut

- **Success**: `#27ae60` - Succès/validation
- **Warning**: `#f39c12` - Avertissement
- **Danger**: `#e74c3c` - Erreur/danger
- **Info**: `#3498db` - Information

## 🎨 Gradients

### Principaux
```scss
// Gradient principal Linsoft
background: linear-gradient(135deg, #0066cc 0%, #00ccff 100%);

// Gradient sombre
background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);

// Gradient accent
background: linear-gradient(135deg, #ff6b35 0%, #e63946 100%);

// Gradient hero
background: linear-gradient(135deg, #004c99 0%, #0066cc 50%, #00ccff 100%);
```

## 🔤 Typographie

### Police de caractères
```scss
font-family: 'Inter', 'Segoe UI', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Tailles
- **Base**: `14px` - Texte standard
- **Large**: `16px` - Texte important
- **XL**: `20px` - Sous-titres
- **2XL**: `24px` - Titres H3
- **3XL**: `32px` - Titres H2

## 🎯 Composants

### Cartes (Cards)

```html
<div class="card">
  <div class="card-header">
    <h4 class="card-title">Titre de la carte</h4>
    <p class="card-category">Catégorie ou description</p>
  </div>
  <div class="card-body">
    <!-- Contenu -->
  </div>
</div>
```

**Caractéristiques:**
- Fond blanc avec ombre subtile
- Header avec gradient bleu Linsoft
- Effet de hover avec élévation
- Border-radius de 12px

### Boutons

```html
<!-- Bouton principal -->
<button class="btn btn-primary">
  <i class="tim-icons icon-check-2"></i>
  Valider
</button>

<!-- Bouton succès -->
<button class="btn btn-success">Enregistrer</button>

<!-- Bouton danger -->
<button class="btn btn-danger">Supprimer</button>

<!-- Bouton info -->
<button class="btn btn-info">Information</button>

<!-- Bouton outline -->
<button class="btn btn-outline-primary">Contour</button>
```

**Caractéristiques:**
- Gradients Linsoft
- Effet de hover avec élévation
- Ombres colorées selon le type
- Border-radius de 8px

### Formulaires

```html
<div class="form-group">
  <label for="input">Libellé</label>
  <input type="text" class="form-control" id="input" placeholder="Saisir...">
</div>
```

**Caractéristiques:**
- Border de 2px avec couleur neutre
- Focus avec bordure bleue Linsoft
- Ombre colorée au focus
- Placeholder en gris neutre

## 🎭 Classes Utilitaires

### Gradients
```html
<div class="linsoft-gradient-primary"></div>
<div class="linsoft-gradient-dark"></div>
<div class="linsoft-gradient-accent"></div>
<div class="linsoft-gradient-hero"></div>
```

### Couleurs de texte
```html
<p class="linsoft-text-primary">Texte bleu principal</p>
<p class="linsoft-text-accent">Texte accent orange</p>
```

### Couleurs de fond
```html
<div class="linsoft-bg-primary">Fond bleu</div>
<div class="linsoft-bg-dark">Fond sombre</div>
```

### Ombres
```html
<div class="linsoft-shadow-sm">Ombre petite</div>
<div class="linsoft-shadow-md">Ombre moyenne</div>
<div class="linsoft-shadow-lg">Ombre grande</div>
```

### Border-radius
```html
<div class="linsoft-border-radius">Coins arrondis</div>
```

## 🎬 Animations

### FadeIn
```scss
animation: linsoft-fadeIn 0.5s ease;
```

### SlideIn
```scss
animation: linsoft-slideIn 0.3s ease;
```

### ScaleIn
```scss
animation: linsoft-scaleIn 0.3s ease;
```

### Pulse
```scss
animation: linsoft-pulse 2s infinite;
```

## 📱 Breakpoints Responsive

```scss
$linsoft-breakpoint-xs: 480px;   // Mobile petit
$linsoft-breakpoint-sm: 640px;   // Mobile
$linsoft-breakpoint-md: 768px;   // Tablette
$linsoft-breakpoint-lg: 1024px;  // Desktop petit
$linsoft-breakpoint-xl: 1280px;  // Desktop
$linsoft-breakpoint-2xl: 1536px; // Grand écran
```

## 🔧 Mixins SCSS

### Card Linsoft
```scss
@include linsoft-card;
```

### Button Linsoft
```scss
@include linsoft-button;
```

### Input Linsoft
```scss
@include linsoft-input;
```

## 💡 Bonnes Pratiques

### ✅ À FAIRE

1. **Utiliser les variables SCSS** au lieu de valeurs en dur
   ```scss
   // ✅ Bon
   color: $linsoft-primary;
   
   // ❌ Éviter
   color: #0066cc;
   ```

2. **Utiliser les gradients Linsoft** pour les éléments importants
   ```scss
   background: $linsoft-gradient-primary;
   ```

3. **Privilégier les mixins** pour la cohérence
   ```scss
   @include linsoft-button;
   ```

4. **Respecter l'espacement** avec les variables
   ```scss
   padding: $linsoft-spacing-lg;
   margin: $linsoft-spacing-md;
   ```

### ❌ À ÉVITER

1. Ne pas mélanger l'ancienne et la nouvelle charte
2. Ne pas utiliser de couleurs qui ne sont pas dans la palette
3. Ne pas ignorer les animations pour une meilleure UX
4. Ne pas oublier les états hover/focus/active

## 🎯 Exemples d'Application

### Dashboard Card
```html
<div class="card">
  <div class="card-header linsoft-gradient-primary">
    <h4 class="card-title">Statistiques</h4>
    <p class="card-category">Vue d'ensemble</p>
  </div>
  <div class="card-body">
    <!-- Graphiques et données -->
  </div>
</div>
```

### Formulaire de modification
```html
<form>
  <div class="form-group">
    <label>Nom d'utilisateur</label>
    <input type="text" class="form-control" placeholder="Saisir le nom">
  </div>
  
  <div class="d-flex gap-3">
    <button type="submit" class="btn btn-primary">
      <i class="tim-icons icon-check-2"></i>
      Enregistrer
    </button>
    <button type="button" class="btn btn-outline-primary">
      Annuler
    </button>
  </div>
</form>
```

## 📦 Import dans les composants

### Dans les fichiers SCSS de composants
```scss
@import 'src/assets/scss/linsoft-theme.scss';

.mon-composant {
  background: $linsoft-primary;
  @include linsoft-card;
}
```

### Dans styles.scss (déjà fait)
```scss
@import 'assets/scss/linsoft-theme.scss';
```

## 🔄 Migration depuis l'ancien thème

### Correspondances de couleurs

| Ancienne couleur | Nouvelle couleur Linsoft |
|-----------------|--------------------------|
| `#51bcda` (primary) | `$linsoft-primary` (#0066cc) |
| `#e14eca` (accent) | `$linsoft-accent` (#ff6b35) |
| `#667eea` (gradient) | `$linsoft-gradient-primary` |
| `#27293d` (dark) | `$linsoft-dark` (#1a1a2e) |

## 🎨 Inspiration

Cette charte graphique est directement inspirée du site officiel de Linsoft :
- **URL**: [https://www.linsoft.com/fr](https://www.linsoft.com/fr)
- **Design**: Moderne, épuré, professionnel
- **Philosophie**: Excellence technologique et innovation

## 📞 Support

Pour toute question sur l'utilisation de cette charte graphique, consultez :
- Ce guide
- Le fichier `linsoft-theme.scss`
- Les composants existants pour des exemples

---

**Version**: 1.0  
**Date**: Mars 2026  
**Projet**: Event Management BackOffice pour LinSoft
