// src/renderers/TechnicalDrawings.js
export class TechnicalDrawings {
  /**
   * Crée une nouvelle instance du moteur de rendu de plans techniques
   * @param {string} containerId - ID du conteneur HTML où les plans seront affichés
   */
  constructor(containerId) {
    this.containerId = containerId;
    this.container = null;
    this.svgNS = "http://www.w3.org/2000/svg";
    
    // Projet en cours
    this.currentProject = null;
    
    // Paramètres de rendu
    this.scale = 0.1; // Échelle (1:10 par défaut)
    this.margin = 20; // Marge en pixels
    this.showGrid = true; // Afficher la grille
    this.showDimensions = true; // Afficher les dimensions
    this.dimensionStyle = 'outside'; // Style de cotation (outside, inside, centerline)
    this.showHiddenLines = false; // Afficher les lignes cachées
    this.showLabels = true; // Afficher les étiquettes de composants
    this.currentPaperSize = 'A3'; // Format de papier par défaut
    
    // Éléments SVG pour les différentes vues
    this.svgs = {
      front: null, // Vue de face
      side: null,  // Vue de côté
      top: null,   // Vue de dessus
      details: null // Vue détaillée ou nomenclature
    };
    
    // Styles
    this.backgroundColor = "#FFFFFF";
    this.foregroundColor = "#000000";
    this.accentColor = "#FF0000";
    this.hiddenLineColor = "#AAAAAA";
    this.gridColor = "#EEEEEE";
    this.dimensionColor = "#0000FF";
    this.fontFamily = "Arial, sans-serif";
    this.fontSize = "12px";
    this.strokeWidth = 1;
    
    // Formats de papier standards (largeur x hauteur en mm)
    this.paperSizes = {
      'A0': { width: 841, height: 1189 },
      'A1': { width: 594, height: 841 },
      'A2': { width: 420, height: 594 },
      'A3': { width: 297, height: 420 },
      'A4': { width: 210, height: 297 }
    };
  }

  /**
   * Initialise le moteur de rendu de plans techniques
   * @return {Promise} Promesse résolue lorsque l'initialisation est terminée
   */
  async initialize() {
    try {
      // Obtenir le conteneur
      this.container = document.getElementById(this.containerId);
      if (!this.container) {
        console.error(`Conteneur avec ID ${this.containerId} non trouvé`);
        return false;
      }
      
      // Créer les SVG pour chaque vue
      for (const viewType in this.svgs) {
        const svg = this.createSVG(viewType);
        this.svgs[viewType] = svg;
        
        // Ajouter le SVG au conteneur (sauf pour les vues cachées)
        if (viewType !== 'details') {
          this.container.appendChild(svg);
        }
      }
      
      // Si les dimensions du conteneur sont trop petites, ajuster
      if (this.container.clientWidth < 800) {
        this.container.style.minWidth = '800px';
      }
      if (this.container.clientHeight < 600) {
        this.container.style.minHeight = '600px';
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du rendu de plans techniques:', error);
      return false;
    }
  }

  /**
   * Crée un élément SVG pour une vue spécifique
   * @param {string} viewType - Type de vue (front, side, top, details)
   * @return {SVGElement} Élément SVG créé
   */
  createSVG(viewType) {
    const svg = document.createElementNS(this.svgNS, "svg");
    svg.setAttribute("id", `technical-${viewType}-view`);
    svg.setAttribute("class", `technical-view ${viewType}-view`);
    
    // Définir les dimensions selon le format de papier
    const paperSize = this.paperSizes[this.currentPaperSize];
    const svgWidth = paperSize.width * this.scale * 10; // Conversion mm -> px
    const svgHeight = paperSize.height * this.scale * 10;
    
    svg.setAttribute("width", svgWidth);
    svg.setAttribute("height", svgHeight);
    svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
    
    // Appliquer des styles CSS
    svg.style.border = "1px solid #ccc";
    svg.style.margin = "5px";
    svg.style.backgroundColor = this.backgroundColor;
    
    // Ajouter un fond blanc
    const background = document.createElementNS(this.svgNS, "rect");
    background.setAttribute("width", "100%");
    background.setAttribute("height", "100%");
    background.setAttribute("fill", this.backgroundColor);
    svg.appendChild(background);
    
    // Ajouter une grille si nécessaire
    if (this.showGrid) {
      const grid = this.createGrid(svgWidth, svgHeight);
      svg.appendChild(grid);
    }
    
    // Ajouter un titre à la vue
    const title = document.createElementNS(this.svgNS, "text");
    title.setAttribute("x", svgWidth / 2);
    title.setAttribute("y", this.margin - 5);
    title.setAttribute("font-family", this.fontFamily);
    title.setAttribute("font-size", "14px");
    title.setAttribute("font-weight", "bold");
    title.setAttribute("text-anchor", "middle");
    title.textContent = this.getViewTitle(viewType);
    svg.appendChild(title);
    
    return svg;
  }

  /**
   * Obtient le titre localisé pour une vue
   * @param {string} viewType - Type de vue
   * @return {string} Titre localisé
   */
  getViewTitle(viewType) {
    // Pourrait être localisé via un système i18n
    switch (viewType) {
      case 'front': return 'Vue de Face';
      case 'side': return 'Vue de Côté';
      case 'top': return 'Vue de Dessus';
      case 'details': return 'Détails Techniques';
      default: return 'Vue Technique';
    }
  }

  /**
   * Crée une grille pour le fond du SVG
   * @param {number} width - Largeur du SVG
   * @param {number} height - Hauteur du SVG
   * @return {SVGElement} Élément de grille
   */
  createGrid(width, height) {
    const gridGroup = document.createElementNS(this.svgNS, "g");
    gridGroup.setAttribute("class", "grid");
    
    // Taille de la cellule de la grille en pixels
    const gridSize = 10;
    
    // Lignes horizontales
    for (let y = 0; y <= height; y += gridSize) {
      const line = document.createElementNS(this.svgNS, "line");
      line.setAttribute("x1", 0);
      line.setAttribute("y1", y);
      line.setAttribute("x2", width);
      line.setAttribute("y2", y);
      line.setAttribute("stroke", this.gridColor);
      line.setAttribute("stroke-width", 0.5);
      gridGroup.appendChild(line);
    }
    
    // Lignes verticales
    for (let x = 0; x <= width; x += gridSize) {
      const line = document.createElementNS(this.svgNS, "line");
      line.setAttribute("x1", x);
      line.setAttribute("y1", 0);
      line.setAttribute("x2", x);
      line.setAttribute("y2", height);
      line.setAttribute("stroke", this.gridColor);
      line.setAttribute("stroke-width", 0.5);
      gridGroup.appendChild(line);
    }
    
    return gridGroup;
  }

  /**
   * Nettoie le contenu d'une vue
   * @param {SVGElement} svg - Élément SVG à nettoyer
   */
  clearViewContent(svg) {
    if (!svg) return;
    
    // Conserver seulement le fond et la grille
    const background = svg.querySelector("rect:first-child");
    const grid = svg.querySelector("g.grid");
    const title = svg.querySelector("text:first-of-type");
    
    while (svg.lastChild) {
      svg.removeChild(svg.lastChild);
    }
    
    if (background) svg.appendChild(background);
    if (grid) svg.appendChild(grid);
    if (title) svg.appendChild(title);
  }

  /**
   * Génère tous les plans techniques pour un projet
   * @param {FurnitureProject} project - Projet de meuble
   */
  generateDrawings(project) {
    if (!project) return;
    
    this.currentProject = project;
    
    // Générer les différentes vues
    this.generateFrontView();
    this.generateSideView();
    this.generateTopView();
    
    // Générer aussi la nomenclature
    this.generateComponentsList();
  }

  /**
   * Génère la vue de face
   */
  generateFrontView() {
    const project = this.currentProject;
    if (!project) return;
    
    const svg = this.svgs.front;
    if (!svg) return;
    
    // Vider le SVG (sauf le fond et la grille)
    this.clearViewContent(svg);
    
    // Dimensions du SVG
    const svgWidth = parseFloat(svg.getAttribute("width"));
    const svgHeight = parseFloat(svg.getAttribute("height"));
    
    // Créer un groupe pour les composants
    const componentsGroup = document.createElementNS(this.svgNS, "g");
    componentsGroup.setAttribute("class", "components");
    
    // Créer un groupe pour les dimensions
    const dimensionsGroup = document.createElementNS(this.svgNS, "g");
    dimensionsGroup.setAttribute("class", "dimensions");
    
    // Calculer les dimensions de l'armoire en pixels
    const cabinetWidth = project.dimensions.width * this.scale;
    const cabinetHeight = project.dimensions.height * this.scale;
    
    // Centrer l'armoire dans la vue
    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;
    const startX = centerX - cabinetWidth / 2;
    const startY = centerY - cabinetHeight / 2;
    
    // Dessiner le cadre extérieur
    const outline = document.createElementNS(this.svgNS, "rect");
    outline.setAttribute("x", startX);
    outline.setAttribute("y", startY);
    outline.setAttribute("width", cabinetWidth);
    outline.setAttribute("height", cabinetHeight);
    outline.setAttribute("fill", "none");
    outline.setAttribute("stroke", this.foregroundColor);
    outline.setAttribute("stroke-width", this.strokeWidth);
    componentsGroup.appendChild(outline);
    
    // Dessiner les panneaux latéraux avec l'épaisseur
    const sideThickness = (project.thicknessSettings.sides || 19) * this.scale;
    
    // Panneau latéral gauche
    const leftSide = document.createElementNS(this.svgNS, "rect");
    leftSide.setAttribute("x", startX);
    leftSide.setAttribute("y", startY);
    leftSide.setAttribute("width", sideThickness);
    leftSide.setAttribute("height", cabinetHeight);
    leftSide.setAttribute("fill", this.backgroundColor);
    leftSide.setAttribute("stroke", this.foregroundColor);
    leftSide.setAttribute("stroke-width", this.strokeWidth);
    componentsGroup.appendChild(leftSide);
    
    // Panneau latéral droit
    const rightSide = document.createElementNS(this.svgNS, "rect");
    rightSide.setAttribute("x", startX + cabinetWidth - sideThickness);
    rightSide.setAttribute("y", startY);
    rightSide.setAttribute("width", sideThickness);
    rightSide.setAttribute("height", cabinetHeight);
    rightSide.setAttribute("fill", this.backgroundColor);
    rightSide.setAttribute("stroke", this.foregroundColor);
    rightSide.setAttribute("stroke-width", this.strokeWidth);
    componentsGroup.appendChild(rightSide);
    
    // Dessiner les traverses horizontales (haut et bas)
    const topThickness = (project.thicknessSettings.top || 19) * this.scale;
    const bottomThickness = (project.thicknessSettings.bottom || 19) * this.scale;
    
    // Traverse haute
    const top = document.createElementNS(this.svgNS, "rect");
    top.setAttribute("x", startX);
    top.setAttribute("y", startY);
    top.setAttribute("width", cabinetWidth);
    top.setAttribute("height", topThickness);
    top.setAttribute("fill", this.backgroundColor);
    top.setAttribute("stroke", this.foregroundColor);
    top.setAttribute("stroke-width", this.strokeWidth);
    componentsGroup.appendChild(top);
    
    // Traverse basse
    const bottom = document.createElementNS(this.svgNS, "rect");
    bottom.setAttribute("x", startX);
    bottom.setAttribute("y", startY + cabinetHeight - bottomThickness);
    bottom.setAttribute("width", cabinetWidth);
    bottom.setAttribute("height", bottomThickness);
    bottom.setAttribute("fill", this.backgroundColor);
    bottom.setAttribute("stroke", this.foregroundColor);
    bottom.setAttribute("stroke-width", this.strokeWidth);
    componentsGroup.appendChild(bottom);
    
    // Dessiner les séparateurs verticaux
    project.dividers.forEach(divider => {
      const dividerX = startX + (divider.position * this.scale);
      const dividerThickness = (project.thicknessSettings.dividers || 19) * this.scale;
      
      const dividerRect = document.createElementNS(this.svgNS, "rect");
      dividerRect.setAttribute("x", dividerX - dividerThickness / 2);
      dividerRect.setAttribute("y", startY + topThickness);
      dividerRect.setAttribute("width", dividerThickness);
      dividerRect.setAttribute("height", cabinetHeight - topThickness - bottomThickness);
      dividerRect.setAttribute("fill", this.backgroundColor);
      dividerRect.setAttribute("stroke", this.foregroundColor);
      dividerRect.setAttribute("stroke-width", this.strokeWidth);
      componentsGroup.appendChild(dividerRect);
    });
    
    // Dessiner les étagères et autres composants
    this.drawComponentsInView(
      componentsGroup, 
      project, 
      startX, 
      startY, 
      cabinetWidth, 
      cabinetHeight, 
      'front'
    );
    
    // Ajouter les dimensions si nécessaire
    if (this.showDimensions) {
      // Dimension de largeur (en bas)
      this.addDimensionLine(
        dimensionsGroup,
        startX, startY + cabinetHeight + 20,
        startX + cabinetWidth, startY + cabinetHeight + 20,
        `${project.dimensions.width} mm`,
        this.scale
      );
      
      // Dimension de hauteur (à droite)
      this.addDimensionLine(
        dimensionsGroup,
        startX + cabinetWidth + 20, startY,
        startX + cabinetWidth + 20, startY + cabinetHeight,
        `${project.dimensions.height} mm`,
        this.scale,
        true // vertical
      );
      
      // Dimensions des séparateurs
      project.dividers.forEach((divider, index) => {
        const dividerX = startX + (divider.position * this.scale);
        this.addDimensionLine(
          dimensionsGroup,
          startX, startY + cabinetHeight + 50,
          dividerX, startY + cabinetHeight + 50,
          `${divider.position} mm`,
          this.scale
        );
      });
    }
    
    // Ajouter les groupes au SVG
    svg.appendChild(componentsGroup);
    svg.appendChild(dimensionsGroup);
    
    // Ajouter un cartouche avec les informations du projet
    this.addCartouche('front');
  }

  /**
   * Génère la vue de côté
   */
  generateSideView() {
    const project = this.currentProject;
    if (!project) return;
    
    const svg = this.svgs.side;
    if (!svg) return;
    
    // Vider le SVG (sauf le fond et la grille)
    this.clearViewContent(svg);
    
    // Dimensions du SVG
    const svgWidth = parseFloat(svg.getAttribute("width"));
    const svgHeight = parseFloat(svg.getAttribute("height"));
    
    // Créer un groupe pour les composants
    const componentsGroup = document.createElementNS(this.svgNS, "g");
    componentsGroup.setAttribute("class", "components");
    
    // Créer un groupe pour les dimensions
    const dimensionsGroup = document.createElementNS(this.svgNS, "g");
    dimensionsGroup.setAttribute("class", "dimensions");
    
    // Calculer les dimensions de l'armoire en pixels
    const cabinetDepth = project.dimensions.depth * this.scale;
    const cabinetHeight = project.dimensions.height * this.scale;
    
    // Centrer l'armoire dans la vue
    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;
    const startX = centerX - cabinetDepth / 2;
    const startY = centerY - cabinetHeight / 2;
    
    // Dessiner le cadre extérieur
    const outline = document.createElementNS(this.svgNS, "rect");
    outline.setAttribute("x", startX);
    outline.setAttribute("y", startY);
    outline.setAttribute("width", cabinetDepth);
    outline.setAttribute("height", cabinetHeight);
    outline.setAttribute("fill", "none");
    outline.setAttribute("stroke", this.foregroundColor);
    outline.setAttribute("stroke-width", this.strokeWidth);
    componentsGroup.appendChild(outline);
    
    // Dessiner les traverses horizontales (haut et bas)
    const topThickness = (project.thicknessSettings.top || 19) * this.scale;
    const bottomThickness = (project.thicknessSettings.bottom || 19) * this.scale;
    
    // Traverse haute
    const top = document.createElementNS(this.svgNS, "rect");
    top.setAttribute("x", startX);
    top.setAttribute("y", startY);
    top.setAttribute("width", cabinetDepth);
    top.setAttribute("height", topThickness);
    top.setAttribute("fill", this.backgroundColor);
    top.setAttribute("stroke", this.foregroundColor);
    top.setAttribute("stroke-width", this.strokeWidth);
    componentsGroup.appendChild(top);
    
    // Traverse basse
    const bottom = document.createElementNS(this.svgNS, "rect");
    bottom.setAttribute("x", startX);
    bottom.setAttribute("y", startY + cabinetHeight - bottomThickness);
    bottom.setAttribute("width", cabinetDepth);
    bottom.setAttribute("height", bottomThickness);
    bottom.setAttribute("fill", this.backgroundColor);
    bottom.setAttribute("stroke", this.foregroundColor);
    bottom.setAttribute("stroke-width", this.strokeWidth);
    componentsGroup.appendChild(bottom);
    
    // Fond (si présent)
    if (project.hasBack) {
      const backThickness = (project.thicknessSettings.back || 8) * this.scale;
      const back = document.createElementNS(this.svgNS, "rect");
      back.setAttribute("x", startX);
      back.setAttribute("y", startY + topThickness);
      back.setAttribute("width", backThickness);
      back.setAttribute("height", cabinetHeight - topThickness - bottomThickness);
      back.setAttribute("fill", this.backgroundColor);
      back.setAttribute("stroke", this.foregroundColor);
      back.setAttribute("stroke-width", this.strokeWidth);
      componentsGroup.appendChild(back);
    }
    
    // Dessiner les étagères et autres composants
    this.drawComponentsInView(
      componentsGroup, 
      project, 
      startX, 
      startY, 
      cabinetDepth, 
      cabinetHeight, 
      'side'
    );
    
    // Ajouter les dimensions si nécessaire
    if (this.showDimensions) {
      // Dimension de profondeur (en bas)
      this.addDimensionLine(
        dimensionsGroup,
        startX, startY + cabinetHeight + 20,
        startX + cabinetDepth, startY + cabinetHeight + 20,
        `${project.dimensions.depth} mm`,
        this.scale
      );
      
      // Dimension de hauteur (à droite)
      this.addDimensionLine(
        dimensionsGroup,
        startX + cabinetDepth + 20, startY,
        startX + cabinetDepth + 20, startY + cabinetHeight,
        `${project.dimensions.height} mm`,
        this.scale,
        true // vertical
      );
    }
    
    // Ajouter les groupes au SVG
    svg.appendChild(componentsGroup);
    svg.appendChild(dimensionsGroup);
    
    // Ajouter un cartouche avec les informations du projet
    this.addCartouche('side');
  }

  /**
   * Génère la vue de dessus
   */
  generateTopView() {
    const project = this.currentProject;
    if (!project) return;
    
    const svg = this.svgs.top;
    if (!svg) return;
    
    // Vider le SVG (sauf le fond et la grille)
    this.clearViewContent(svg);
    
    // Dimensions du SVG
    const svgWidth = parseFloat(svg.getAttribute("width"));
    const svgHeight = parseFloat(svg.getAttribute("height"));
    
    // Créer un groupe pour les composants
    const componentsGroup = document.createElementNS(this.svgNS, "g");
    componentsGroup.setAttribute("class", "components");
    
    // Créer un groupe pour les dimensions
    const dimensionsGroup = document.createElementNS(this.svgNS, "g");
    dimensionsGroup.setAttribute("class", "dimensions");
    
    // Calculer les dimensions de l'armoire en pixels
    const cabinetWidth = project.dimensions.width * this.scale;
    const cabinetDepth = project.dimensions.depth * this.scale;
    
    // Centrer l'armoire dans la vue
    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;
    const startX = centerX - cabinetWidth / 2;
    const startY = centerY - cabinetDepth / 2;
    
    // Dessiner le cadre extérieur
    const outline = document.createElementNS(this.svgNS, "rect");
    outline.setAttribute("x", startX);
    outline.setAttribute("y", startY);
    outline.setAttribute("width", cabinetWidth);
    outline.setAttribute("height", cabinetDepth);
    outline.setAttribute("fill", "none");
    outline.setAttribute("stroke", this.foregroundColor);
    outline.setAttribute("stroke-width", this.strokeWidth);
    componentsGroup.appendChild(outline);
    
    // Dessiner les panneaux latéraux avec l'épaisseur
    const sideThickness = (project.thicknessSettings.sides || 19) * this.scale;
    
    // Panneau latéral gauche
    const leftSide = document.createElementNS(this.svgNS, "rect");
    leftSide.setAttribute("x", startX);
    leftSide.setAttribute("y", startY);
    leftSide.setAttribute("width", sideThickness);
    leftSide.setAttribute("height", cabinetDepth);
    leftSide.setAttribute("fill", this.backgroundColor);
    leftSide.setAttribute("stroke", this.foregroundColor);
    leftSide.setAttribute("stroke-width", this.strokeWidth);
    componentsGroup.appendChild(leftSide);
    
    // Panneau latéral droit
    const rightSide = document.createElementNS(this.svgNS, "rect");
    rightSide.setAttribute("x", startX + cabinetWidth - sideThickness);
    rightSide.setAttribute("y", startY);
    rightSide.setAttribute("width", sideThickness);
    rightSide.setAttribute("height", cabinetDepth);
    rightSide.setAttribute("fill", this.backgroundColor);
    rightSide.setAttribute("stroke", this.foregroundColor);
    rightSide.setAttribute("stroke-width", this.strokeWidth);
    componentsGroup.appendChild(rightSide);
    
    // Fond (si présent)
    if (project.hasBack) {
      const backThickness = (project.thicknessSettings.back || 8) * this.scale;
      const back = document.createElementNS(this.svgNS, "rect");
      back.setAttribute("x", startX + sideThickness);
      back.setAttribute("y", startY + cabinetDepth - backThickness);
      back.setAttribute("width", cabinetWidth - 2 * sideThickness);
      back.setAttribute("height", backThickness);
      back.setAttribute("fill", this.backgroundColor);
      back.setAttribute("stroke", this.foregroundColor);
      back.setAttribute("stroke-width", this.strokeWidth);
      componentsGroup.appendChild(back);
    }
    
    // Dessiner les séparateurs verticaux
    project.dividers.forEach(divider => {
      const dividerX = startX + (divider.position * this.scale);
      const dividerThickness = (project.thicknessSettings.dividers || 19) * this.scale;
      
      const dividerRect = document.createElementNS(this.svgNS, "rect");
      dividerRect.setAttribute("x", dividerX - dividerThickness / 2);
      dividerRect.setAttribute("y", startY);
      dividerRect.setAttribute("width", dividerThickness);
      dividerRect.setAttribute("height", cabinetDepth);
      dividerRect.setAttribute("fill", this.backgroundColor);
      dividerRect.setAttribute("stroke", this.foregroundColor);
      dividerRect.setAttribute("stroke-width", this.strokeWidth);
      componentsGroup.appendChild(dividerRect);
    });
    
    // Dessiner les étagères et autres composants
    this.drawComponentsInView(
      componentsGroup, 
      project, 
      startX, 
      startY, 
      cabinetWidth, 
      cabinetDepth, 
      'top'
    );
    
    // Ajouter les dimensions si nécessaire
    if (this.showDimensions) {
      // Dimension de largeur (en bas)
      this.addDimensionLine(
        dimensionsGroup,
        startX, startY + cabinetDepth + 20,
        startX + cabinetWidth, startY + cabinetDepth + 20,
        `${project.dimensions.width} mm`,
        this.scale
      );
      
      // Dimension de profondeur (à droite)
      this.addDimensionLine(
        dimensionsGroup,
        startX + cabinetWidth + 20, startY,
        startX + cabinetWidth + 20, startY + cabinetDepth,
        `${project.dimensions.depth} mm`,
        this.scale,
        true // vertical
      );
      
      // Dimensions des séparateurs
      project.dividers.forEach((divider, index) => {
        const dividerX = startX + (divider.position * this.scale);
        this.addDimensionLine(
          dimensionsGroup,
          startX, startY + cabinetDepth + 50,
          dividerX, startY + cabinetDepth + 50,
          `${divider.position} mm`,
          this.scale
        );
      });
    }
    
    // Ajouter les groupes au SVG
    svg.appendChild(componentsGroup);
    svg.appendChild(dimensionsGroup);
    
    // Ajouter un cartouche avec les informations du projet
    this.addCartouche('top');
  }

  /**
   * Dessine les composants internes dans une vue
   * @param {SVGElement} group - Groupe SVG parent
   * @param {FurnitureProject} project - Projet de meuble
   * @param {number} startX - Position X de départ
   * @param {number} startY - Position Y de départ
   * @param {number} width - Largeur totale
   * @param {number} height - Hauteur totale
   * @param {string} viewType - Type de vue (front, side, top)
   */
  drawComponentsInView(group, project, startX, startY, width, height, viewType) {
    // Épaisseurs
    const topThickness = (project.thicknessSettings.top || 19) * this.scale;
    const bottomThickness = (project.thicknessSettings.bottom || 19) * this.scale;
    const sideThickness = (project.thicknessSettings.sides || 19) * this.scale;
    
    // Dessiner les étagères
    project.components.forEach(component => {
      if (component.type === 'shelf') {
        // Trouver la zone et la position Y
        if (component.metadata && component.metadata.zoneIndex !== undefined) {
          const zone = project.zones.find(z => z.index === component.metadata.zoneIndex);
          if (zone) {
            const shelfIndex = component.metadata.shelfIndex || 0;
            const shelfCount = zone.settings.shelfCount || 1;
            const zoneHeight = zone.height * this.scale;
            const shelfSpacing = zoneHeight / (shelfCount + 1);
            const shelfY = (shelfIndex + 1) * shelfSpacing;
            const shelfThickness = component.thickness * this.scale;
            
            if (viewType === 'front') {
              // En vue de face, dessiner l'étagère comme une ligne horizontale
              const shelfWidth = component.width * this.scale;
              const zoneStartX = startX + (zone.position - zone.width / 2) * this.scale;
              
              const shelf = document.createElementNS(this.svgNS, "rect");
              shelf.setAttribute("x", zoneStartX);
              shelf.setAttribute("y", startY + topThickness + shelfY - shelfThickness / 2);
              shelf.setAttribute("width", shelfWidth);
              shelf.setAttribute("height", shelfThickness);
              shelf.setAttribute("fill", this.backgroundColor);
              shelf.setAttribute("stroke", this.foregroundColor);
              shelf.setAttribute("stroke-width", this.strokeWidth);
              group.appendChild(shelf);
            } else if (viewType === 'side') {
              // En vue de côté, dessiner l'étagère comme une ligne horizontale
              const zoneStartY = startY + topThickness;
              
              const shelf = document.createElementNS(this.svgNS, "rect");
              shelf.setAttribute("x", startX);
              shelf.setAttribute("y", zoneStartY + shelfY - shelfThickness / 2);
              shelf.setAttribute("width", width);
              shelf.setAttribute("height", shelfThickness);
              shelf.setAttribute("fill", this.backgroundColor);
              shelf.setAttribute("stroke", this.foregroundColor);
              shelf.setAttribute("stroke-width", this.strokeWidth);
              group.appendChild(shelf);
            } else if (viewType === 'top') {
              // En vue de dessus, dessiner l'étagère comme un rectangle
              const shelfWidth = component.width * this.scale;
              const shelfDepth = component.length * this.scale;
              const zoneStartX = startX + (zone.position - zone.width / 2) * this.scale;
              
              // Tenir compte du retrait éventuel
              const retraction = component.metadata.retraction || 0;
              const retractionPx = retraction * this.scale;
              
              const shelf = document.createElementNS(this.svgNS, "rect");
              shelf.setAttribute("x", zoneStartX);
              shelf.setAttribute("y", startY + retractionPx);
              shelf.setAttribute("width", shelfWidth);
              shelf.setAttribute("height", shelfDepth - retractionPx);
              shelf.setAttribute("fill", "none");
              shelf.setAttribute("stroke", this.foregroundColor);
              shelf.setAttribute("stroke-width", this.strokeWidth);
              shelf.setAttribute("stroke-dasharray", "2,2");
              group.appendChild(shelf);
            }
          }
        }
      } else if (component.type === 'drawer_front') {
        // Dessiner les façades de tiroirs (seulement en vue de face)
        if (viewType === 'front' && component.metadata && component.metadata.zoneIndex !== undefined) {
          const zone = project.zones.find(z => z.index === component.metadata.zoneIndex);
          if (zone) {
            const drawerIndex = component.metadata.drawerIndex || 0;
            const drawerCount = zone.settings.drawerCount || 1;
            const zoneHeight = zone.height * this.scale;
            const drawerHeight = component.width * this.scale;
            const drawerSpacing = (zoneHeight - drawerCount * drawerHeight) / (drawerCount + 1);
            const drawerY = drawerSpacing + drawerIndex * (drawerHeight + drawerSpacing);
            
            const zoneStartX = startX + (zone.position - zone.width / 2) * this.scale;
            const zoneStartY = startY + topThickness;
            
            const drawer = document.createElementNS(this.svgNS, "rect");
            drawer.setAttribute("x", zoneStartX);
            drawer.setAttribute("y", zoneStartY + drawerY);
            drawer.setAttribute("width", zone.width * this.scale);
            drawer.setAttribute("height", drawerHeight);
            drawer.setAttribute("fill", this.backgroundColor);
            drawer.setAttribute("stroke", this.foregroundColor);
            drawer.setAttribute("stroke-width", this.strokeWidth);
            group.appendChild(drawer);
            
            // Ajouter une poignée
            const handleWidth = 30;
            const handleHeight = 5;
            const handle = document.createElementNS(this.svgNS, "rect");
            handle.setAttribute("x", zoneStartX + zone.width * this.scale / 2 - handleWidth / 2);
            handle.setAttribute("y", zoneStartY + drawerY + drawerHeight / 2 - handleHeight / 2);
            handle.setAttribute("width", handleWidth);
            handle.setAttribute("height", handleHeight);
            handle.setAttribute("fill", this.foregroundColor);
            handle.setAttribute("rx", 2);
            handle.setAttribute("ry", 2);
            group.appendChild(handle);
          }
        }
      }
      // Ajouter d'autres types de composants au besoin
    });
  }

  /**
   * Ajoute une ligne de dimension
   * @param {SVGElement} group - Groupe SVG parent
   * @param {number} x1 - Coordonnée X de début
   * @param {number} y1 - Coordonnée Y de début
   * @param {number} x2 - Coordonnée X de fin
   * @param {number} y2 - Coordonnée Y de fin
   * @param {string} text - Texte de la dimension
   * @param {number} scale - Échelle de conversion (optionnel)
   * @param {boolean} vertical - Si la dimension est verticale
   * @param {string} style - Style de la dimension (normal, interior)
   */
  addDimensionLine(group, x1, y1, x2, y2, text, scale = 1, vertical = false, style = 'normal') {
    // Calculer la longueur et l'angle
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Calculer les propriétés de la flèche
    const arrowSize = 5;
    const arrowAngle = Math.atan2(dy, dx);
    
    // Ligne principale
    const line = document.createElementNS(this.svgNS, "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", style === 'interior' ? this.accentColor : this.dimensionColor);
    line.setAttribute("stroke-width", 0.75);
    group.appendChild(line);
    
    // Flèches aux extrémités
    // Côté début
    const startArrow1X = x1 + arrowSize * Math.cos(arrowAngle + Math.PI * 0.85);
    const startArrow1Y = y1 + arrowSize * Math.sin(arrowAngle + Math.PI * 0.85);
    const startArrow2X = x1 + arrowSize * Math.cos(arrowAngle - Math.PI * 0.85);
    const startArrow2Y = y1 + arrowSize * Math.sin(arrowAngle - Math.PI * 0.85);
    
    const startArrow1 = document.createElementNS(this.svgNS, "line");
    startArrow1.setAttribute("x1", x1);
    startArrow1.setAttribute("y1", y1);
    startArrow1.setAttribute("x2", startArrow1X);
    startArrow1.setAttribute("y2", startArrow1Y);
    startArrow1.setAttribute("stroke", style === 'interior' ? this.accentColor : this.dimensionColor);
    startArrow1.setAttribute("stroke-width", 0.75);
    group.appendChild(startArrow1);
    
    const startArrow2 = document.createElementNS(this.svgNS, "line");
    startArrow2.setAttribute("x1", x1);
    startArrow2.setAttribute("y1", y1);
    startArrow2.setAttribute("x2", startArrow2X);
    startArrow2.setAttribute("y2", startArrow2Y);
    startArrow2.setAttribute("stroke", style === 'interior' ? this.accentColor : this.dimensionColor);
    startArrow2.setAttribute("stroke-width", 0.75);
    group.appendChild(startArrow2);
    
    // Côté fin
    const endArrow1X = x2 + arrowSize * Math.cos(arrowAngle + Math.PI * 1.15);
    const endArrow1Y = y2 + arrowSize * Math.sin(arrowAngle + Math.PI * 1.15);
    const endArrow2X = x2 + arrowSize * Math.cos(arrowAngle - Math.PI * 1.15);
    const endArrow2Y = y2 + arrowSize * Math.sin(arrowAngle - Math.PI * 1.15);
    
    const endArrow1 = document.createElementNS(this.svgNS, "line");
    endArrow1.setAttribute("x1", x2);
    endArrow1.setAttribute("y1", y2);
    endArrow1.setAttribute("x2", endArrow1X);
    endArrow1.setAttribute("y2", endArrow1Y);
    endArrow1.setAttribute("stroke", style === 'interior' ? this.accentColor : this.dimensionColor);
    endArrow1.setAttribute("stroke-width", 0.75);
    group.appendChild(endArrow1);
    
    const endArrow2 = document.createElementNS(this.svgNS, "line");
    endArrow2.setAttribute("x1", x2);
    endArrow2.setAttribute("y1", y2);
    endArrow2.setAttribute("x2", endArrow2X);
    endArrow2.setAttribute("y2", endArrow2Y);
    endArrow2.setAttribute("stroke", style === 'interior' ? this.accentColor : this.dimensionColor);
    endArrow2.setAttribute("stroke-width", 0.75);
    group.appendChild(endArrow2);
    
    // Ajouter le texte de dimension
    const textElement = document.createElementNS(this.svgNS, "text");
    if (vertical) {
      // Texte vertical
      const textX = x1 - 5;
      const textY = y1 + length / 2;
      textElement.setAttribute("x", textX);
      textElement.setAttribute("y", textY);
      textElement.setAttribute("transform", `rotate(-90 ${textX} ${textY})`);
    } else {
      // Texte horizontal
      textElement.setAttribute("x", x1 + length / 2);
      textElement.setAttribute("y", y1 - 5);
    }
    textElement.setAttribute("font-family", this.fontFamily);
    textElement.setAttribute("font-size", "10px");
    textElement.setAttribute("text-anchor", "middle");
    textElement.setAttribute("fill", style === 'interior' ? this.accentColor : this.dimensionColor);
    textElement.textContent = text;
    group.appendChild(textElement);
  }

  /**
   * Génère une nomenclature des composants
   * @param {boolean} separateView - Générer dans une vue séparée (sinon dans la vue détails)
   * @return {SVGElement} Élément SVG de la nomenclature
   */
  generateComponentsList(separateView = false) {
    const project = this.currentProject;
    if (!project) return null;
    
    // Déterminer le SVG cible
    const svg = separateView ? this.svgs.details : this.createTemporarySVG("components-list");
    if (!svg) return null;
    
    // Si on utilise la vue détails existante, la nettoyer
    if (!separateView) {
      this.clearViewContent(svg);
    }
    
    // Dimensions du SVG
    const svgWidth = parseFloat(svg.getAttribute("width"));
    const svgHeight = parseFloat(svg.getAttribute("height"));
    
    // Créer un groupe pour la nomenclature
    const listGroup = document.createElementNS(this.svgNS, "g");
    listGroup.setAttribute("class", "components-list");
    
    // Définir les paramètres de la table
    const tableX = this.margin;
    const tableY = this.margin + 30; // Espace pour le titre
    const tableWidth = svgWidth - 2 * this.margin;
    const rowHeight = 20;
    const headerHeight = 30;
    
    // Colonnes de la table
    const columns = [
      { title: "Repère", width: tableWidth * 0.1 },
      { title: "Désignation", width: tableWidth * 0.3 },
      { title: "Matériau", width: tableWidth * 0.15 },
      { title: "Largeur", width: tableWidth * 0.15 },
      { title: "Longueur", width: tableWidth * 0.15 },
      { title: "Épaisseur", width: tableWidth * 0.15 }
    ];
    
    // Titre de la nomenclature
    const title = document.createElementNS(this.svgNS, "text");
    title.setAttribute("x", svgWidth / 2);
    title.setAttribute("y", tableY - 10);
    title.setAttribute("font-family", this.fontFamily);
    title.setAttribute("font-size", "14px");
    title.setAttribute("font-weight", "bold");
    title.setAttribute("text-anchor", "middle");
    title.textContent = "Nomenclature des Composants";
    listGroup.appendChild(title);
    
    // Créer le fond de la table
    const tableBackground = document.createElementNS(this.svgNS, "rect");
    tableBackground.setAttribute("x", tableX);
    tableBackground.setAttribute("y", tableY);
    tableBackground.setAttribute("width", tableWidth);
    tableBackground.setAttribute("height", headerHeight + rowHeight * project.components.length);
    tableBackground.setAttribute("fill", "#FFFFFF");
    tableBackground.setAttribute("stroke", this.foregroundColor);
    tableBackground.setAttribute("stroke-width", this.strokeWidth);
    listGroup.appendChild(tableBackground);
    
    // Dessiner l'en-tête de la table
    let currentX = tableX;
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      
      // Ligne verticale séparatrice (sauf pour la première colonne)
      if (i > 0) {
        const line = document.createElementNS(this.svgNS, "line");
        line.setAttribute("x1", currentX);
        line.setAttribute("y1", tableY);
        line.setAttribute("x2", currentX);
        line.setAttribute("y2", tableY + headerHeight + rowHeight * project.components.length);
        line.setAttribute("stroke", this.foregroundColor);
        line.setAttribute("stroke-width", this.strokeWidth);
        listGroup.appendChild(line);
      }
      
      // Titre de la colonne
      const headerText = document.createElementNS(this.svgNS, "text");
      headerText.setAttribute("x", currentX + column.width / 2);
      headerText.setAttribute("y", tableY + headerHeight / 2);
      headerText.setAttribute("font-family", this.fontFamily);
      headerText.setAttribute("font-size", "12px");
      headerText.setAttribute("font-weight", "bold");
      headerText.setAttribute("text-anchor", "middle");
      headerText.setAttribute("dominant-baseline", "middle");
      headerText.textContent = column.title;
      listGroup.appendChild(headerText);
      
      currentX += column.width;
    }
    
    // Ligne horizontale sous l'en-tête
    const headerLine = document.createElementNS(this.svgNS, "line");
    headerLine.setAttribute("x1", tableX);
    headerLine.setAttribute("y1", tableY + headerHeight);
    headerLine.setAttribute("x2", tableX + tableWidth);
    headerLine.setAttribute("y2", tableY + headerHeight);
    headerLine.setAttribute("stroke", this.foregroundColor);
    headerLine.setAttribute("stroke-width", this.strokeWidth);
    listGroup.appendChild(headerLine);
    
    // Ajouter les données des composants
    project.components.forEach((component, index) => {
      const rowY = tableY + headerHeight + index * rowHeight;
      
      // Alternance de couleur pour les lignes
      if (index % 2 === 1) {
        const rowBackground = document.createElementNS(this.svgNS, "rect");
        rowBackground.setAttribute("x", tableX);
        rowBackground.setAttribute("y", rowY);
        rowBackground.setAttribute("width", tableWidth);
        rowBackground.setAttribute("height", rowHeight);
        rowBackground.setAttribute("fill", "#F5F5F5");
        rowBackground.setAttribute("stroke", "none");
        listGroup.appendChild(rowBackground);
      }
      
      // Numéro de repère
      const refText = document.createElementNS(this.svgNS, "text");
      refText.setAttribute("x", tableX + columns[0].width / 2);
      refText.setAttribute("y", rowY + rowHeight / 2);
      refText.setAttribute("font-family", this.fontFamily);
      refText.setAttribute("font-size", "10px");
      refText.setAttribute("text-anchor", "middle");
      refText.setAttribute("dominant-baseline", "middle");
      refText.textContent = (index + 1).toString();
      listGroup.appendChild(refText);
      
      // Désignation
      const nameText = document.createElementNS(this.svgNS, "text");
      nameText.setAttribute("x", tableX + columns[0].width + 5);
      nameText.setAttribute("y", rowY + rowHeight / 2);
      nameText.setAttribute("font-family", this.fontFamily);
      nameText.setAttribute("font-size", "10px");
      nameText.setAttribute("text-anchor", "start");
      nameText.setAttribute("dominant-baseline", "middle");
      nameText.textContent = component.name;
      listGroup.appendChild(nameText);
      
      // Matériau
      const materialText = document.createElementNS(this.svgNS, "text");
      materialText.setAttribute("x", tableX + columns[0].width + columns[1].width + columns[2].width / 2);
      materialText.setAttribute("y", rowY + rowHeight / 2);
      materialText.setAttribute("font-family", this.fontFamily);
      materialText.setAttribute("font-size", "10px");
      materialText.setAttribute("text-anchor", "middle");
      materialText.setAttribute("dominant-baseline", "middle");
      
      // Obtenir le nom du matériau
      let materialName = "Standard";
      if (window.configurator && window.configurator.materialManager) {
        const material = window.configurator.materialManager.getMaterialById(component.materialId);
        if (material) {
          materialName = material.name;
        }
      }
      
      materialText.textContent = materialName;
      listGroup.appendChild(materialText);
      
      // Largeur
      const widthText = document.createElementNS(this.svgNS, "text");
      widthText.setAttribute("x", tableX + columns[0].width + columns[1].width + columns[2].width + columns[3].width / 2);
      widthText.setAttribute("y", rowY + rowHeight / 2);
      widthText.setAttribute("font-family", this.fontFamily);
      widthText.setAttribute("font-size", "10px");
      widthText.setAttribute("text-anchor", "middle");
      widthText.setAttribute("dominant-baseline", "middle");
      widthText.textContent = `${component.width} mm`;
      listGroup.appendChild(widthText);
      
      // Longueur
      const lengthText = document.createElementNS(this.svgNS, "text");
      lengthText.setAttribute("x", tableX + columns[0].width + columns[1].width + columns[2].width + columns[3].width + columns[4].width / 2);
      lengthText.setAttribute("y", rowY + rowHeight / 2);
      lengthText.setAttribute("font-family", this.fontFamily);
      lengthText.setAttribute("font-size", "10px");
      lengthText.setAttribute("text-anchor", "middle");
      lengthText.setAttribute("dominant-baseline", "middle");
      lengthText.textContent = `${component.length} mm`;
      listGroup.appendChild(lengthText);
      
      // Épaisseur
      const thicknessText = document.createElementNS(this.svgNS, "text");
      thicknessText.setAttribute("x", tableX + columns[0].width + columns[1].width + columns[2].width + columns[3].width + columns[4].width + columns[5].width / 2);
      thicknessText.setAttribute("y", rowY + rowHeight / 2);
      thicknessText.setAttribute("font-family", this.fontFamily);
      thicknessText.setAttribute("font-size", "10px");
      thicknessText.setAttribute("text-anchor", "middle");
      thicknessText.setAttribute("dominant-baseline", "middle");
      thicknessText.textContent = `${component.thickness} mm`;
      listGroup.appendChild(thicknessText);
      
      // Ligne horizontale après chaque ligne (sauf la dernière)
      if (index < project.components.length - 1) {
        const rowLine = document.createElementNS(this.svgNS, "line");
        rowLine.setAttribute("x1", tableX);
        rowLine.setAttribute("y1", rowY + rowHeight);
        rowLine.setAttribute("x2", tableX + tableWidth);
        rowLine.setAttribute("y2", rowY + rowHeight);
        rowLine.setAttribute("stroke", this.foregroundColor);
        rowLine.setAttribute("stroke-width", 0.5);
        listGroup.appendChild(rowLine);
      }
    });
    
    // Ajouter le groupe au SVG
    svg.appendChild(listGroup);
    
    // Si on a créé un SVG temporaire, le renvoyer
    if (separateView) {
      return svg;
    } else {
      return listGroup;
    }
  }

  /**
   * Crée un SVG temporaire (pour l'export)
   * @param {string} id - Identifiant du SVG
   * @return {SVGElement} Élément SVG créé
   */
  createTemporarySVG(id) {
    const svg = document.createElementNS(this.svgNS, "svg");
    svg.setAttribute("xmlns", this.svgNS);
    svg.setAttribute("id", id);
    
    // Définir les dimensions selon le format de papier
    const paperSize = this.paperSizes[this.currentPaperSize];
    const svgWidth = paperSize.width * this.scale * 10; // Conversion mm -> px
    const svgHeight = paperSize.height * this.scale * 10;
    
    svg.setAttribute("width", svgWidth);
    svg.setAttribute("height", svgHeight);
    svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
    
    // Fond blanc
    const background = document.createElementNS(this.svgNS, "rect");
    background.setAttribute("width", "100%");
    background.setAttribute("height", "100%");
    background.setAttribute("fill", this.backgroundColor);
    svg.appendChild(background);
    
    return svg;
  }

  /**
   * Génère une vue éclatée du meuble
   */
  generateExplodedView() {
    const project = this.currentProject;
    if (!project) return;
    
    const svg = this.svgs.details;
    if (!svg) return;
    
    // Vider le SVG (sauf le fond et la grille)
    this.clearViewContent(svg);
    
    // Dimensions du SVG
    const svgWidth = parseFloat(svg.getAttribute("width"));
    const svgHeight = parseFloat(svg.getAttribute("height"));
    
    // Créer un groupe pour la vue éclatée
    const explodedGroup = document.createElementNS(this.svgNS, "g");
    explodedGroup.setAttribute("class", "exploded-view");
    
    // Titre de la vue
    const title = document.createElementNS(this.svgNS, "text");
    title.setAttribute("x", svgWidth / 2);
    title.setAttribute("y", this.margin);
    title.setAttribute("font-family", this.fontFamily);
    title.setAttribute("font-size", "14px");
    title.setAttribute("font-weight", "bold");
    title.setAttribute("text-anchor", "middle");
    title.textContent = "Vue Éclatée";
    explodedGroup.appendChild(title);
    
    // Calculer l'échelle et la position pour le meuble
    const furnitureWidth = project.dimensions.width * this.scale;
    const furnitureHeight = project.dimensions.height * this.scale;
    const furnitureDepth = project.dimensions.depth * this.scale;
    
    const maxDimension = Math.max(furnitureWidth, furnitureHeight, furnitureDepth);
    const availableSpace = Math.min(svgWidth, svgHeight) - 2 * this.margin;
    
    const scaleFactor = availableSpace / (maxDimension * 1.5); // 1.5 pour tenir compte de l'éclatement
    
    // Centre de la vue
    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;
    
    // Dessiner les panneaux en vue isométrique éclatée
    const isoPanels = this.drawExplodedIsometricPanels(project, centerX, centerY, scaleFactor);
    explodedGroup.appendChild(isoPanels);
    
    // Ajouter des numéros de repère
    this.addReferenceNumbers(explodedGroup, project, centerX, centerY, scaleFactor);
    
    // Ajouter le groupe au SVG
    svg.appendChild(explodedGroup);
  }

  /**
   * Dessine les panneaux en vue isométrique éclatée
   * @param {FurnitureProject} project - Projet de meuble
   * @param {number} centerX - Centre X de la vue
   * @param {number} centerY - Centre Y de la vue
   * @param {number} scaleFactor - Facteur d'échelle
   * @return {SVGElement} Groupe contenant les panneaux
   */
  drawExplodedIsometricPanels(project, centerX, centerY, scaleFactor) {
    const group = document.createElementNS(this.svgNS, "g");
    group.setAttribute("class", "iso-panels");
    
    // Définir une projection isométrique simplifiée
    // (x, y, z) -> (x' = x - z/2, y' = y - z/2)
    const isoProject = (x, y, z) => {
      return {
        x: centerX + (x - z * 0.5) * scaleFactor,
        y: centerY + (y - z * 0.5) * scaleFactor
      };
    };
    
    // Paramètres d'éclatement
    const explodeOffset = 50 * scaleFactor; // Décalage entre les composants
    
    // Trier les composants par type pour l'éclatement
    const sides = project.components.filter(c => c.id.includes('side_'));
    const horizontals = project.components.filter(c => c.id.includes('top') || c.id.includes('bottom'));
    const dividers = project.components.filter(c => c.id.includes('divider_'));
    const back = project.components.find(c => c.id.includes('back'));
    const shelves = project.components.filter(c => c.type === 'shelf');
    const drawers = project.components.filter(c => c.type.includes('drawer'));
    
    // Décalages pour chaque groupe de composants
    const offsets = {
      side_left: { x: -explodeOffset * 2, y: 0, z: 0 },
      side_right: { x: explodeOffset * 2, y: 0, z: 0 },
      top: { x: 0, y: -explodeOffset * 2, z: 0 },
      bottom: { x: 0, y: explodeOffset * 2, z: 0 },
      divider: { x: 0, y: 0, z: -explodeOffset },
      back: { x: 0, y: 0, z: explodeOffset * 2 },
      shelf: { x: 0, y: explodeOffset, z: -explodeOffset * 0.5 },
      drawer: { x: 0, y: -explodeOffset * 0.5, z: -explodeOffset * 3 }
    };
    
    // Dessiner chaque panneau avec son décalage approprié
    // Note: Ceci est une implémentation simplifiée - une implémentation complète
    // nécessiterait un algorithme plus complexe pour positionner correctement
    // chaque composant dans l'espace 3D
    
    // Dessiner les panneaux latéraux
    sides.forEach(panel => {
      const offset = panel.id.includes('left') ? offsets.side_left : offsets.side_right;
      this.drawIsometricPanel(group, panel, project, isoProject, offset, 'vertical');
    });
    
    // Dessiner les panneaux horizontaux
    horizontals.forEach(panel => {
      const offset = panel.id.includes('top') ? offsets.top : offsets.bottom;
      this.drawIsometricPanel(group, panel, project, isoProject, offset, 'horizontal');
    });
    
    // Dessiner les séparateurs
    dividers.forEach(panel => {
      this.drawIsometricPanel(group, panel, project, isoProject, offsets.divider, 'vertical');
    });
    
    // Dessiner le fond
    if (back) {
      this.drawIsometricPanel(group, back, project, isoProject, offsets.back, 'back');
    }
    
    // Dessiner les étagères
    shelves.forEach(panel => {
      this.drawIsometricPanel(group, panel, project, isoProject, offsets.shelf, 'horizontal');
    });
    
   // Dessiner les tiroirs
   drawers.forEach(panel => {
    this.drawIsometricPanel(group, panel, project, isoProject, offsets.drawer, 'drawer');
  });
  
  return group;
}

  

      /**
   * Dessine un panneau en vue isométrique
   * @param {SVGElement} group - Groupe parent
   * @param {Object} panel - Panneau à dessiner
   * @param {FurnitureProject} project - Projet parent
   * @param {Function} projFunc - Fonction de projection
   * @param {Object} offset - Décalage pour l'éclatement {x, y, z}
   * @param {string} orientation - Orientation du panneau
   */
  drawIsometricPanel(group, panel, project, projFunc, offset, orientation) {
    // Paramètres du panneau
    let width, height, depth;
    let baseX, baseY, baseZ;
    
    // Position de base du panneau selon son type
    switch (orientation) {
      case 'vertical':
        width = panel.thickness;
        height = panel.width;
        depth = panel.length;
        
        if (panel.id.includes('side_left')) {
          baseX = -project.dimensions.width / 2;
          baseY = 0;
          baseZ = 0;
        } else if (panel.id.includes('side_right')) {
          baseX = project.dimensions.width / 2 - panel.thickness;
          baseY = 0;
          baseZ = 0;
        } else if (panel.id.includes('divider_')) {
          // Obtenir la position du séparateur
          const dividerIndex = parseInt(panel.id.split('_')[1]);
          const divider = project.dividers[dividerIndex];
          if (divider) {
            baseX = divider.position - project.dimensions.width / 2;
            baseY = 0;
            baseZ = 0;
          } else {
            baseX = 0;
            baseY = 0;
            baseZ = 0;
          }
        } else {
          baseX = 0;
          baseY = 0;
          baseZ = 0;
        }
        break;
        
      case 'horizontal':
        width = panel.width;
        height = panel.thickness;
        depth = panel.length;
        
        if (panel.id.includes('top')) {
          baseX = -width / 2;
          baseY = project.dimensions.height - panel.thickness;
          baseZ = 0;
        } else if (panel.id.includes('bottom')) {
          baseX = -width / 2;
          baseY = 0;
          baseZ = 0;
        } else if (panel.type === 'shelf') {
          // Calculer la position de l'étagère
          if (panel.metadata && panel.metadata.zoneIndex !== undefined) {
            const zone = project.zones.find(z => z.index === panel.metadata.zoneIndex);
            if (zone) {
              const shelfIndex = panel.metadata.shelfIndex || 0;
              const shelfCount = zone.settings.shelfCount || 1;
              const shelfSpacing = zone.height / (shelfCount + 1);
              const shelfY = (shelfIndex + 1) * shelfSpacing;
              
              baseX = zone.position - project.dimensions.width / 2;
              baseY = shelfY;
              baseZ = 0;
              
              if (panel.metadata.retraction > 0) {
                baseZ += panel.metadata.retraction;
              }
              
              width = panel.width;
            } else {
              baseX = -width / 2;
              baseY = project.dimensions.height / 2;
              baseZ = 0;
            }
          } else {
            baseX = -width / 2;
            baseY = project.dimensions.height / 2;
            baseZ = 0;
          }
        } else {
          baseX = -width / 2;
          baseY = project.dimensions.height / 2;
          baseZ = 0;
        }
        break;
        
      case 'back':
        width = panel.length;
        height = panel.width;
        depth = panel.thickness;
        baseX = -width / 2;
        baseY = 0;
        baseZ = project.dimensions.depth - panel.thickness;
        break;
        
      case 'drawer':
        // Simplification pour les tiroirs (juste un rectangle)
        width = panel.length;
        height = panel.width;
        depth = panel.thickness;
        
        if (panel.metadata && panel.metadata.zoneIndex !== undefined) {
          const zone = project.zones.find(z => z.index === panel.metadata.zoneIndex);
          if (zone) {
            const drawerIndex = panel.metadata.drawerIndex || 0;
            const drawerCount = zone.settings.drawerCount || 1;
            const drawerSpacing = zone.height / drawerCount;
            const drawerY = zone.height - (drawerIndex + 0.5) * drawerSpacing;
            
            baseX = zone.position - project.dimensions.width / 2;
            baseY = drawerY;
            baseZ = 0;
            
            width = panel.length;
          } else {
            baseX = -width / 2;
            baseY = project.dimensions.height / 2;
            baseZ = 0;
          }
        } else {
          baseX = -width / 2;
          baseY = project.dimensions.height / 2;
          baseZ = 0;
        }
        break;
        
      default:
        width = panel.width;
        height = panel.thickness;
        depth = panel.length;
        baseX = 0;
        baseY = 0;
        baseZ = 0;
    }
    
    // Appliquer l'offset d'éclatement
    baseX += offset.x / this.scale;
    baseY += offset.y / this.scale;
    baseZ += offset.z / this.scale;
    
    // Calculer les points du panneau en perspective isométrique
    // (simplifié - idéalement, nous aurions besoin d'une matrice de transformation complète)
    const points = [
      projFunc(baseX, baseY, baseZ),
      projFunc(baseX + width, baseY, baseZ),
      projFunc(baseX + width, baseY + height, baseZ),
      projFunc(baseX, baseY + height, baseZ),
      projFunc(baseX, baseY, baseZ + depth),
      projFunc(baseX + width, baseY, baseZ + depth),
      projFunc(baseX + width, baseY + height, baseZ + depth),
      projFunc(baseX, baseY + height, baseZ + depth)
    ];
    
    // Faces visibles seulement (simplification)
    const faces = [
      [0, 1, 2, 3], // Face avant
      [0, 4, 7, 3], // Face gauche
      [1, 5, 6, 2], // Face droite
      [0, 1, 5, 4], // Face dessus
      [3, 2, 6, 7]  // Face dessous
    ];
    
    // Couleurs des faces (pour une meilleure visualisation)
    const faceColors = [
      "#E0E0E0", // Face avant - gris clair
      "#D0D0D0", // Face gauche - gris moyen
      "#C0C0C0", // Face droite - gris foncé
      "#F0F0F0", // Face dessus - gris très clair
      "#B0B0B0"  // Face dessous - gris encore plus foncé
    ];
    
    // Créer un groupe pour ce panneau
    const panelGroup = document.createElementNS(this.svgNS, "g");
    panelGroup.setAttribute("class", `panel ${panel.id}`);
    panelGroup.setAttribute("data-component-id", panel.id);
    
    // Dessiner les faces (dans l'ordre pour superposition correcte)
    faces.forEach((face, index) => {
      const polygon = document.createElementNS(this.svgNS, "polygon");
      const pointsStr = face.map(i => `${points[i].x},${points[i].y}`).join(" ");
      polygon.setAttribute("points", pointsStr);
      polygon.setAttribute("fill", faceColors[index]);
      polygon.setAttribute("stroke", this.foregroundColor);
      polygon.setAttribute("stroke-width", this.strokeWidth);
      panelGroup.appendChild(polygon);
    });
    
    group.appendChild(panelGroup);
  }

  /**
   * Ajoute des numéros de repère aux composants
   * @param {SVGElement} group - Groupe parent
   * @param {FurnitureProject} project - Projet de meuble
   * @param {number} centerX - Centre X de la vue
   * @param {number} centerY - Centre Y de la vue
   * @param {number} scaleFactor - Facteur d'échelle
   */
  addReferenceNumbers(group, project, centerX, centerY, scaleFactor) {
    // Positions relatives pour les numéros de repère (simplifiées)
    const positions = {
      side_left: { x: -project.dimensions.width / 2 - 20, y: project.dimensions.height / 2 },
      side_right: { x: project.dimensions.width / 2 + 20, y: project.dimensions.height / 2 },
      top: { x: 0, y: -20 },
      bottom: { x: 0, y: project.dimensions.height + 20 },
      divider: { x: 0, y: project.dimensions.height / 4 },
      back: { x: 0, y: project.dimensions.height / 2 },
      shelf: { x: 0, y: 0 }, // Position calculée individuellement
      drawer: { x: 0, y: 0 }  // Position calculée individuellement
    };
    
    // Définir une projection isométrique simplifiée
    const isoProject = (x, y, z) => {
      return {
        x: centerX + (x - z * 0.5) * scaleFactor,
        y: centerY + (y - z * 0.5) * scaleFactor
      };
    };
    
    // Ajouter un numéro de repère pour chaque composant
    project.components.forEach((component, index) => {
      let x, y;
      
      // Déterminer la position selon le type de composant
      if (component.id.includes('side_left')) {
        const pos = positions.side_left;
        const projected = isoProject(pos.x, pos.y, 0);
        x = projected.x;
        y = projected.y;
      } else if (component.id.includes('side_right')) {
        const pos = positions.side_right;
        const projected = isoProject(pos.x, pos.y, 0);
        x = projected.x;
        y = projected.y;
      } else if (component.id.includes('top')) {
        const pos = positions.top;
        const projected = isoProject(pos.x, pos.y, 0);
        x = projected.x;
        y = projected.y;
      } else if (component.id.includes('bottom')) {
        const pos = positions.bottom;
        const projected = isoProject(pos.x, pos.y, 0);
        x = projected.x;
        y = projected.y;
      } else if (component.id.includes('divider_')) {
        // Calculer la position pour le séparateur
        const dividerIndex = parseInt(component.id.split('_')[1]);
        const divider = project.dividers[dividerIndex];
        if (divider) {
          const pos = { 
            x: divider.position - project.dimensions.width / 2,
            y: positions.divider.y
          };
          const projected = isoProject(pos.x, pos.y, 0);
          x = projected.x;
          y = projected.y;
        } else {
          const projected = isoProject(0, project.dimensions.height / 2, 0);
          x = projected.x;
          y = projected.y;
        }
      } else if (component.id.includes('back')) {
        const pos = positions.back;
        const projected = isoProject(pos.x, pos.y, project.dimensions.depth);
        x = projected.x;
        y = projected.y;
      } else if (component.type === 'shelf') {
        // Calculer la position pour l'étagère
        if (component.metadata && component.metadata.zoneIndex !== undefined) {
          const zone = project.zones.find(z => z.index === component.metadata.zoneIndex);
          if (zone) {
            const shelfIndex = component.metadata.shelfIndex || 0;
            const shelfCount = zone.settings.shelfCount || 1;
            const shelfSpacing = zone.height / (shelfCount + 1);
            const shelfY = (shelfIndex + 1) * shelfSpacing;
            
            const pos = {
              x: zone.position - project.dimensions.width / 2 + zone.width / 2,
              y: shelfY
            };
            const projected = isoProject(pos.x, pos.y, 0);
            x = projected.x;
            y = projected.y;
          } else {
            const projected = isoProject(0, project.dimensions.height / 2, 0);
            x = projected.x;
            y = projected.y;
          }
        } else {
          const projected = isoProject(0, project.dimensions.height / 2, 0);
          x = projected.x;
          y = projected.y;
        }
      } else if (component.type.includes('drawer')) {
        // Calculer la position pour le tiroir
        if (component.metadata && component.metadata.zoneIndex !== undefined) {
          const zone = project.zones.find(z => z.index === component.metadata.zoneIndex);
          if (zone) {
            const drawerIndex = component.metadata.drawerIndex || 0;
            const drawerCount = zone.settings.drawerCount || 1;
            const drawerSpacing = zone.height / drawerCount;
            const drawerY = zone.height - (drawerIndex + 0.5) * drawerSpacing;
            
            const pos = {
              x: zone.position - project.dimensions.width / 2 + zone.width / 2,
              y: drawerY
            };
            const projected = isoProject(pos.x, pos.y, -50); // Tiroirs vers l'avant
            x = projected.x;
            y = projected.y;
          } else {
            const projected = isoProject(0, project.dimensions.height / 2, 0);
            x = projected.x;
            y = projected.y;
          }
        } else {
          const projected = isoProject(0, project.dimensions.height / 2, 0);
          x = projected.x;
          y = projected.y;
        }
      } else {
        // Position par défaut
        const projected = isoProject(0, project.dimensions.height / 2, 0);
        x = projected.x;
        y = projected.y;
      }
      
      // Créer le cercle pour le numéro de repère
      const circle = document.createElementNS(this.svgNS, "circle");
      circle.setAttribute("cx", x);
      circle.setAttribute("cy", y);
      circle.setAttribute("r", 12);
      circle.setAttribute("fill", "white");
      circle.setAttribute("stroke", this.foregroundColor);
      circle.setAttribute("stroke-width", this.strokeWidth);
      
      // Ajouter le numéro
      const text = document.createElementNS(this.svgNS, "text");
      text.setAttribute("x", x);
      text.setAttribute("y", y);
      text.setAttribute("font-family", this.fontFamily);
      text.setAttribute("font-size", "10px");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.textContent = (index + 1).toString();
      
      group.appendChild(circle);
      group.appendChild(text);
    });
  }

  /**
   * Ajoute un cartouche avec informations du projet
   * @param {string} viewType - Type de vue
   */
  addCartouche(viewType) {
    const project = this.currentProject;
    if (!project) return;
    
    const svg = this.svgs[viewType];
    if (!svg) return;
    
    // Vérifier si le cartouche existe déjà
    let cartouche = svg.querySelector("g.cartouche");
    if (cartouche) {
      svg.removeChild(cartouche);
    }
    
    cartouche = document.createElementNS(this.svgNS, "g");
    cartouche.setAttribute("class", "cartouche");
    
    // Dimensions du SVG
    const svgWidth = parseFloat(svg.getAttribute("width"));
    const svgHeight = parseFloat(svg.getAttribute("height"));
    
    // Définir les dimensions du cartouche
    const cartoucheWidth = 200;
    const cartoucheHeight = 100;
    const cartoucheX = svgWidth - cartoucheWidth - 10;
    const cartoucheY = svgHeight - cartoucheHeight - 10;
    
    // Fond du cartouche
    const background = document.createElementNS(this.svgNS, "rect");
    background.setAttribute("x", cartoucheX);
    background.setAttribute("y", cartoucheY);
    background.setAttribute("width", cartoucheWidth);
    background.setAttribute("height", cartoucheHeight);
    background.setAttribute("fill", "white");
    background.setAttribute("stroke", this.foregroundColor);
    background.setAttribute("stroke-width", this.strokeWidth);
    cartouche.appendChild(background);
    
    // Titre du projet
    const title = document.createElementNS(this.svgNS, "text");
    title.setAttribute("x", cartoucheX + 10);
    title.setAttribute("y", cartoucheY + 20);
    title.setAttribute("font-family", this.fontFamily);
    title.setAttribute("font-size", "14px");
    title.setAttribute("font-weight", "bold");
    title.textContent = project.name;
    cartouche.appendChild(title);
    
    // Dimensions principales
    const dimensions = document.createElementNS(this.svgNS, "text");
    dimensions.setAttribute("x", cartoucheX + 10);
    dimensions.setAttribute("y", cartoucheY + 40);
    dimensions.setAttribute("font-family", this.fontFamily);
    dimensions.setAttribute("font-size", "10px");
    dimensions.textContent = `Dimensions: ${project.dimensions.width} × ${project.dimensions.height} × ${project.dimensions.depth} mm`;
    cartouche.appendChild(dimensions);
    
    // Date
    const date = document.createElementNS(this.svgNS, "text");
    date.setAttribute("x", cartoucheX + 10);
    date.setAttribute("y", cartoucheY + 60);
    date.setAttribute("font-family", this.fontFamily);
    date.setAttribute("font-size", "10px");
    date.textContent = `Date: ${new Date().toLocaleDateString()}`;
    cartouche.appendChild(date);
    
    // Échelle
    const scale = document.createElementNS(this.svgNS, "text");
    scale.setAttribute("x", cartoucheX + 10);
    scale.setAttribute("y", cartoucheY + 80);
    scale.setAttribute("font-family", this.fontFamily);
    scale.setAttribute("font-size", "10px");
    scale.textContent = `Échelle: 1:${Math.round(1 / this.scale)}`;
    cartouche.appendChild(scale);
    
    // Type de vue
    const view = document.createElementNS(this.svgNS, "text");
    view.setAttribute("x", cartoucheX + cartoucheWidth - 10);
    view.setAttribute("y", cartoucheY + 20);
    view.setAttribute("font-family", this.fontFamily);
    view.setAttribute("font-size", "12px");
    view.setAttribute("font-weight", "bold");
    view.setAttribute("text-anchor", "end");
    view.textContent = this.getViewTitle(viewType);
    cartouche.appendChild(view);
    
    // Ajouter le cartouche au SVG
    svg.appendChild(cartouche);
  }

  /**
   * Nettoie les ressources utilisées par le renderer
   */
  dispose() {
    // Supprimer les SVG du conteneur
    if (this.container) {
      for (const viewType in this.svgs) {
        const svg = this.svgs[viewType];
        if (svg && svg.parentNode === this.container) {
          this.container.removeChild(svg);
        }
      }
    }
    
    // Vider les références
    this.svgs = {};
    this.currentProject = null;
  }
}