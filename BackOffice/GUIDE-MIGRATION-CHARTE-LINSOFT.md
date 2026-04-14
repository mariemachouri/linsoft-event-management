# 🔄 Guide de Migration - Ancienne Charte → Charte Linsoft

## 📋 Tableau de Correspondance des Couleurs

### Remplacement des Variables

| Ancienne Variable | Nouvelle Variable Linsoft | Ancienne Valeur | Nouvelle Valeur |
|-------------------|---------------------------|-----------------|-----------------|
| `$primary-color` | `$linsoft-primary` | `#51bcda` | `#0066cc` |
| `$secondary-color` | `$linsoft-gray` | `#6c757d` | `#7f8c8d` |
| `$success-color` | `$linsoft-success` | `#6bd098` | `#27ae60` |
| `$danger-color` | `$linsoft-danger` | `#ef8157` | `#e74c3c` |
| `$warning-color` | `$linsoft-warning` | `#fbc658` | `#f39c12` |
| `$info-color` | `$linsoft-info` | `#51cbce` | `#3498db` |

### Remplacement des Gradients

| Ancien Gradient | Nouveau Gradient Linsoft |
|-----------------|-------------------------|
| `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` | `$linsoft-gradient-primary` |
| `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)` | `$linsoft-gradient-accent` |
| `linear-gradient(135deg, #27293d 0%, rgba(39, 41, 61, 0.8) 100%)` | `$linsoft-gradient-dark` |

### Remplacement des Couleurs en Dur

| Ancienne Couleur | Nouvelle Couleur | Contexte |
|------------------|------------------|----------|
| `#e14eca` (rose/magenta) | `$linsoft-primary` (#0066cc) | Boutons, liens principaux |
| `#27293d` (fond sombre) | `$linsoft-dark` (#1a1a2e) | Fond de sidebar, headers sombres |
| `#f5f7fa` | `$linsoft-background` | Fond de page (même valeur) |

## 🔍 Recherche et Remplacement dans les Fichiers

### Étape 1: Rechercher les Anciennes Couleurs

**Recherchez dans tous les fichiers `.scss`, `.css`:**

```bash
# Dans VS Code, utilisez Ctrl+Shift+F et cherchez:
#e14eca
#51bcda
#667eea
#764ba2
#f093fb
#f5576c
#27293d
rgba(226, 78, 202
```

### Étape 2: Remplacer par les Variables Linsoft

#### Dans les fichiers SCSS:

**AVANT:**
```scss
.ma-classe {
  color: #51bcda;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #e14eca;
}
```

**APRÈS:**
```scss
@import 'src/assets/scss/linsoft-theme.scss';

.ma-classe {
  color: $linsoft-primary;
  background: $linsoft-gradient-primary;
  border-color: $linsoft-primary;
}
```

#### Dans les fichiers CSS:

**AVANT:**
```css
.ma-classe {
  color: #51bcda;
  background: #667eea;
}
```

**APRÈS:**
```css
.ma-classe {
  color: #0066cc;
  background: linear-gradient(135deg, #0066cc 0%, #00ccff 100%);
}
```

## 📝 Fichiers à Modifier en Priorité

### 1. Components

#### Dashboard Component
**Fichier:** `src/app/pages/dashboard/dashboard.component.scss`

**Sections à modifier:**
- Headers de cartes → utiliser `$linsoft-gradient-primary`
- Boutons → utiliser les classes Linsoft
- Stats cards → appliquer `icon-primary`, `icon-success`, etc.

#### Users List Component
**Fichier:** `src/app/pages/users-list/users-list.component.scss`

**Sections à modifier:**
- Gradient de fond → `$linsoft-background`
- Boutons d'action → `btn-primary` avec gradient Linsoft
- Hover effects → couleurs Linsoft

#### Sidebar Component
**Fichier:** `src/app/components/sidebar/sidebar.component.scss`
✅ **Déjà mis à jour!**

#### Navbar Component
**Fichier:** `src/app/components/navbar/navbar.component.scss`

**Sections à modifier:**
- Background → `$linsoft-dark` ou `$linsoft-gradient-dark`
- Liens actifs → `$linsoft-primary`
- Icônes → `$linsoft-primary` ou `$linsoft-accent`

### 2. Layouts

#### Admin Layout
**Fichier:** `src/app/layouts/admin-layout/admin-layout.component.scss`

**À modifier:**
- Background principal → déjà en `#f5f7fa`
- Peut rester tel quel ou utiliser `$linsoft-background`

### 3. Pages

Pour chaque page, suivez ce pattern:

```scss
@import 'src/assets/scss/linsoft-theme.scss';

// Utilisez les variables au lieu des couleurs en dur
.page-header {
  background: $linsoft-gradient-primary;
}

.action-button {
  @include linsoft-button;
  background: $linsoft-gradient-primary;
}

.info-card {
  @include linsoft-card;
}

.form-input {
  @include linsoft-input;
}
```

## 🛠️ Script de Migration Automatique

### Recherche dans VS Code

1. Ouvrez la recherche globale: `Ctrl + Shift + F`
2. Activez le mode RegEx (icône `.*`)
3. Utilisez ces patterns:

**Pattern pour trouver les couleurs héxa:**
```
#[0-9a-fA-F]{6}
```

**Pattern pour trouver les gradients:**
```
linear-gradient\([^)]+\)
```

### Remplacement Semi-Automatique

**Dans VS Code:**
1. `Ctrl + Shift + H` (Rechercher et Remplacer)
2. Cochez "Utiliser les expressions régulières"
3. Utilisez les remplacements ci-dessous

#### Remplacement 1: Couleur Primary
**Rechercher:** `#51bcda`  
**Remplacer par:** `$linsoft-primary` (dans .scss) ou `#0066cc` (dans .css)

#### Remplacement 2: Gradient Purple/Pink
**Rechercher:** `linear-gradient\(135deg, #667eea 0%, #764ba2 100%\)`  
**Remplacer par:** `$linsoft-gradient-primary` (dans .scss)

#### Remplacement 3: Couleur Rose/Magenta
**Rechercher:** `#e14eca`  
**Remplacer par:** `$linsoft-primary` (dans .scss) ou `#0066cc` (dans .css)

#### Remplacement 4: Fond Sombre
**Rechercher:** `#27293d`  
**Remplacer par:** `$linsoft-dark` (dans .scss) ou `#1a1a2e` (dans .css)

## ✅ Checklist de Migration par Composant

### Pour chaque composant:

- [ ] Ajouter l'import: `@import 'src/assets/scss/linsoft-theme.scss';`
- [ ] Remplacer les couleurs en dur par les variables
- [ ] Remplacer les gradients par les gradients Linsoft
- [ ] Utiliser les mixins quand c'est possible
- [ ] Tester visuellement le composant
- [ ] Vérifier les états hover/focus/active
- [ ] Vérifier la responsivité

### Composants Prioritaires:

1. ✅ Sidebar (fait)
2. ✅ Styles globaux (fait)
3. [ ] Navbar
4. [ ] Dashboard
5. [ ] Users List
6. [ ] Events List
7. [ ] Forms
8. [ ] Login/Auth pages
9. [ ] Modals
10. [ ] Tables

## 🎨 Conversion des Classes Bootstrap

Si vous utilisez Bootstrap, voici les équivalences:

| Bootstrap | Linsoft |
|-----------|---------|
| `.btn-primary` | Automatiquement converti avec gradient bleu |
| `.btn-success` | Automatiquement converti avec gradient vert |
| `.btn-danger` | Automatiquement converti avec gradient rouge |
| `.text-primary` | Utiliser `.linsoft-text-primary` |
| `.bg-primary` | Utiliser `.linsoft-bg-primary` |

## 🔧 Outils de Développement

### Extension VS Code Recommandées

1. **SCSS Formatter** - Pour formater automatiquement
2. **Color Highlight** - Pour voir les couleurs dans le code
3. **SCSS IntelliSense** - Pour l'autocomplétion des variables

### Snippets Utiles

Créez des snippets dans VS Code pour accélérer:

```json
{
  "Linsoft Primary Gradient": {
    "prefix": "lin-grad-primary",
    "body": "background: $linsoft-gradient-primary;",
    "description": "Gradient principal Linsoft"
  },
  "Linsoft Card Mixin": {
    "prefix": "lin-card",
    "body": "@include linsoft-card;",
    "description": "Mixin de carte Linsoft"
  },
  "Linsoft Button Mixin": {
    "prefix": "lin-btn",
    "body": "@include linsoft-button;",
    "description": "Mixin de bouton Linsoft"
  }
}
```

## 📊 État de Migration

Utilisez ce tableau pour suivre votre progression:

| Composant/Page | État | Date | Notes |
|----------------|------|------|-------|
| styles.scss | ✅ Fait | 2026-03-31 | Variables migrées |
| linsoft-theme.scss | ✅ Créé | 2026-03-31 | Fichier de thème complet |
| Sidebar | ✅ Fait | 2026-03-31 | Bouton logout migré |
| Navbar | ⏳ À faire | - | - |
| Dashboard | ⏳ À faire | - | - |
| Users List | ⏳ À faire | - | - |
| Events List | ⏳ À faire | - | - |
| Login | ⏳ À faire | - | - |

## 🚀 Test après Migration

### Tests Visuels

Pour chaque composant migré:

1. **États normaux**
   - [ ] Apparence par défaut correcte
   - [ ] Couleurs conformes à la charte
   - [ ] Espacements corrects

2. **États interactifs**
   - [ ] Hover fonctionne
   - [ ] Focus visible
   - [ ] Active state correct
   - [ ] Disabled style approprié

3. **Responsive**
   - [ ] Mobile (< 768px)
   - [ ] Tablette (768px - 1024px)
   - [ ] Desktop (> 1024px)

4. **Thèmes**
   - [ ] Mode clair
   - [ ] Mode sombre (si applicable)

### Tests Fonctionnels

- [ ] Aucune régression fonctionnelle
- [ ] Animations fluides
- [ ] Performance maintenue
- [ ] Accessibilité préservée

## 💡 Conseils

1. **Migrez progressivement** - Un composant à la fois
2. **Testez immédiatement** - Ne pas accumuler les changements
3. **Utilisez Git** - Commitez après chaque composant migré
4. **Documentez** - Notez les cas particuliers
5. **Demandez une revue** - Faites valider visuellement

## 🆘 Problèmes Courants

### Problème 1: Variable Non Définie
**Erreur:** `Undefined variable: "$linsoft-primary"`
**Solution:** Vérifiez que vous avez bien importé le fichier de thème:
```scss
@import 'src/assets/scss/linsoft-theme.scss';
```

### Problème 2: Gradient Non Appliqué
**Erreur:** Fond uni au lieu du gradient
**Solution:** Vérifiez la syntaxe:
```scss
// ✅ Correct
background: $linsoft-gradient-primary;

// ❌ Incorrect
background-color: $linsoft-gradient-primary;
```

### Problème 3: Couleurs qui Semblent Étranges
**Erreur:** Les couleurs ne correspondent pas à la charte
**Solution:** Vérifiez qu'il n'y a pas de `!important` qui écrase vos styles

### Problème 4: Import Multiple
**Erreur:** Fichier de thème importé plusieurs fois
**Solution:** Importez une seule fois en haut du fichier SCSS

## 📞 Support

En cas de problème ou de question:
1. Consultez `CHARTE-GRAPHIQUE-LINSOFT.md`
2. Regardez la page de démo (`/theme-demo`)
3. Vérifiez `linsoft-theme.scss` pour les variables disponibles
4. Contactez l'équipe de développement

---

**Date de création**: Mars 2026  
**Version**: 1.0  
**Auteur**: Système de migration Linsoft
