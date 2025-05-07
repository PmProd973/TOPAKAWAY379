// Suite du fichier src/renderers/TechnicalDrawings.js
class TechnicalDrawings {
  constructor() {
    this.svgNS = "http://www.w3.org/2000/svg"; // À ajouter si absent
    // ... autres initialisations
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
   * Configure les paramètres d'impression
   * @param {Object} options - Options d'impression
   */
  configurePrintSettings(options = {}) {
    // Mettre à jour les options d'impression
    if (options.paperSize && this.paperSizes[options.paperSize]) {
      this.currentPaperSize = options.paperSize;
    }
    
    if (options.scale) {
      this.scale = options.scale;
    }
    
    if (options.margin !== undefined) {
      this.margin = options.margin;
    }
    
    if (options.showGrid !== undefined) {
      this.showGrid = options.showGrid;
    }
    
    if (options.showDimensions !== undefined) {
      this.showDimensions = options.showDimensions;
    }
    
    if (options.dimensionStyle) {
      this.dimensionStyle = options.dimensionStyle;
    }
    
    if (options.showHiddenLines !== undefined) {
      this.showHiddenLines = options.showHiddenLines;
    }
    
    if (options.backgroundColor) {
      this.backgroundColor = options.backgroundColor;
    }
    
    if (options.foregroundColor) {
      this.foregroundColor = options.foregroundColor;
    }
    
    if (options.accentColor) {
      this.accentColor = options.accentColor;
    }
    
    if (options.fontFamily) {
      this.fontFamily = options.fontFamily;
    }
    
    if (options.fontSize) {
      this.fontSize = options.fontSize;
    }
    
    // Redéfinir les dimensions des SVG
    for (const viewType in this.svgs) {
      const svg = this.svgs[viewType];
      if (svg) {
        const paperSize = this.paperSizes[this.currentPaperSize];
        const svgWidth = paperSize.width * this.scale * 10; // Conversion mm -> px
        const svgHeight = paperSize.height * this.scale * 10;
        
        svg.setAttribute("width", svgWidth);
        svg.setAttribute("height", svgHeight);
        svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
      }
    }
    
    // Régénérer les grilles si elles sont actives
    if (this.showGrid) {
      for (const viewType in this.svgs) {
        const svg = this.svgs[viewType];
        if (svg) {
          const grid = svg.querySelector("g.grid");
          if (grid) {
            svg.removeChild(grid);
          }
          
          const newGrid = this.createGrid(parseFloat(svg.getAttribute("width")), parseFloat(svg.getAttribute("height")));
          
          // Ajouter la grille après le fond mais avant le reste
          const background = svg.querySelector("rect:first-child");
          if (background && background.nextSibling) {
            svg.insertBefore(newGrid, background.nextSibling);
          } else {
            svg.appendChild(newGrid);
          }
        }
      }
    }
    
    // Mettre à jour les plans si un projet est chargé
    if (this.currentProject) {
      this.generateDrawings(this.currentProject);
    }
    
    return this;
  }

  /**
   * Exporte tous les plans en format ZIP
   * @return {Promise<Blob>} Promise résolue avec un Blob ZIP
   */
  exportAllToZip() {
    console.log('La méthode exportAllToZip() nécessite une bibliothèque externe comme JSZip');
    return Promise.resolve(null);
  }

  /**
   * Génère un document PDF contenant tous les plans
   * @return {Promise<Blob>} Promise résolue avec un Blob PDF
   */
  generatePDFDocument() {
    console.log('La méthode generatePDFDocument() nécessite une bibliothèque externe comme jsPDF');
    return Promise.resolve(null);
  }

  /**
   * Exporte les plans au format DXF complet
   * @return {string} Chaîne DXF
   */
  exportFullDXF() {
    console.log('La méthode exportFullDXF() nécessite une bibliothèque externe pour la conversion DXF');
    return null;
  }

  /**
   * Ajoute des notes et annotations aux plans
   * @param {string} viewType - Type de vue
   * @param {Object} note - Annotation à ajouter {x, y, text, type}
   * @return {boolean} Succès de l'opération
   */
  addAnnotation(viewType, note) {
    const svg = this.svgs[viewType];
    if (!svg) return false;
    
    // Vérifier si le groupe d'annotations existe déjà
    let annotationsGroup = svg.querySelector("g.annotations");
    if (!annotationsGroup) {
      annotationsGroup = document.createElementNS(this.svgNS, "g");
      annotationsGroup.setAttribute("class", "annotations");
      svg.appendChild(annotationsGroup);
    }
    
    // Créer l'annotation selon son type
    switch (note.type) {
      case 'text':
        // Simple texte
        const text = document.createElementNS(this.svgNS, "text");
        text.setAttribute("x", note.x);
        text.setAttribute("y", note.y);
        text.setAttribute("font-family", this.fontFamily);
        text.setAttribute("font-size", "10px");
        text.setAttribute("fill", this.foregroundColor);
        text.textContent = note.text;
        annotationsGroup.appendChild(text);
        break;
        
      case 'callout':
        // Bulle avec ligne de référence
        const calloutGroup = document.createElementNS(this.svgNS, "g");
        calloutGroup.setAttribute("class", "callout");
        
        // Ligne de référence
        const line = document.createElementNS(this.svgNS, "line");
        line.setAttribute("x1", note.refX);
        line.setAttribute("y1", note.refY);
        line.setAttribute("x2", note.x);
        line.setAttribute("y2", note.y);
        line.setAttribute("stroke", this.foregroundColor);
        line.setAttribute("stroke-width", this.strokeWidth);
        calloutGroup.appendChild(line);
        
        // Bulle
        const bubble = document.createElementNS(this.svgNS, "rect");
        const padding = 5;
        bubble.setAttribute("x", note.x - padding);
        bubble.setAttribute("y", note.y - 15 - padding);
        bubble.setAttribute("rx", 5);
        bubble.setAttribute("ry", 5);
        bubble.setAttribute("width", note.text.length * 6 + padding * 2);
        bubble.setAttribute("height", 20);
        bubble.setAttribute("fill", "white");
        bubble.setAttribute("stroke", this.foregroundColor);
        bubble.setAttribute("stroke-width", this.strokeWidth);
        calloutGroup.appendChild(bubble);
        
        // Texte
        const calloutText = document.createElementNS(this.svgNS, "text");
        calloutText.setAttribute("x", note.x + padding);
        calloutText.setAttribute("y", note.y - 5);
        calloutText.setAttribute("font-family", this.fontFamily);
        calloutText.setAttribute("font-size", "10px");
        calloutText.setAttribute("fill", this.foregroundColor);
        calloutText.textContent = note.text;
        calloutGroup.appendChild(calloutText);
        
        annotationsGroup.appendChild(calloutGroup);
        break;
        
      case 'dimension':
        // Dimension supplémentaire (en plus des dimensions automatiques)
        this.addDimensionLine(
          annotationsGroup,
          note.x1,
          note.y1,
          note.x2,
          note.y2,
          note.text,
          1, // Pas de facteur d'échelle pour les annotations manuelles
          note.vertical || false
        );
        break;
        
      case 'symbol':
        // Symbole (comme un point de perçage, etc.)
        const symbol = document.createElementNS(this.svgNS, "g");
        symbol.setAttribute("class", "symbol");
        
        if (note.symbolType === 'drill') {
          // Symbole de perçage (cercle avec croix)
          const circle = document.createElementNS(this.svgNS, "circle");
          circle.setAttribute("cx", note.x);
          circle.setAttribute("cy", note.y);
          circle.setAttribute("r", 5);
          circle.setAttribute("fill", "none");
          circle.setAttribute("stroke", this.foregroundColor);
          circle.setAttribute("stroke-width", this.strokeWidth);
          symbol.appendChild(circle);
          
          const crossV = document.createElementNS(this.svgNS, "line");
          crossV.setAttribute("x1", note.x);
          crossV.setAttribute("y1", note.y - 5);
          crossV.setAttribute("x2", note.x);
          crossV.setAttribute("y2", note.y + 5);
          crossV.setAttribute("stroke", this.foregroundColor);
          crossV.setAttribute("stroke-width", this.strokeWidth);
          symbol.appendChild(crossV);
          
          const crossH = document.createElementNS(this.svgNS, "line");
          crossH.setAttribute("x1", note.x - 5);
          crossH.setAttribute("y1", note.y);
          crossH.setAttribute("x2", note.x + 5);
          crossH.setAttribute("y2", note.y);
          crossH.setAttribute("stroke", this.foregroundColor);
          crossH.setAttribute("stroke-width", this.strokeWidth);
          symbol.appendChild(crossH);
        } else if (note.symbolType === 'section') {
          // Symbole de coupe (ligne avec lettres)
          const line = document.createElementNS(this.svgNS, "line");
          line.setAttribute("x1", note.x1);
          line.setAttribute("y1", note.y1);
          line.setAttribute("x2", note.x2);
          line.setAttribute("y2", note.y2);
          line.setAttribute("stroke", this.accentColor);
          line.setAttribute("stroke-width", this.strokeWidth * 2);
          line.setAttribute("stroke-dasharray", "5,3");
          symbol.appendChild(line);
          
          // Ajouter les cercles et lettres aux extrémités
          [
            { x: note.x1, y: note.y1, text: 'A' },
            { x: note.x2, y: note.y2, text: 'B' }
          ].forEach(end => {
            const circle = document.createElementNS(this.svgNS, "circle");
            circle.setAttribute("cx", end.x);
            circle.setAttribute("cy", end.y);
            circle.setAttribute("r", 10);
            circle.setAttribute("fill", "white");
            circle.setAttribute("stroke", this.accentColor);
            circle.setAttribute("stroke-width", this.strokeWidth);
            symbol.appendChild(circle);
            
            const text = document.createElementNS(this.svgNS, "text");
            text.setAttribute("x", end.x);
            text.setAttribute("y", end.y + 4);
            text.setAttribute("font-family", this.fontFamily);
            text.setAttribute("font-size", "12px");
            text.setAttribute("font-weight", "bold");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("fill", this.accentColor);
            text.textContent = end.text;
            symbol.appendChild(text);
          });
        }
        
        annotationsGroup.appendChild(symbol);
        break;
        
      default:
        console.warn(`Type d'annotation non reconnu: ${note.type}`);
        return false;
    }
    
    return true;
  }

  /**
   * Calcule et affiche les dimensions intérieures du meuble
   * @param {string} viewType - Type de vue
   */
  showInteriorDimensions(viewType) {
    const project = this.currentProject;
    if (!project) return;
    
    const svg = this.svgs[viewType];
    if (!svg) return;
    
    // Vérifier si le groupe de dimensions intérieures existe déjà
    let interiorDimGroup = svg.querySelector("g.interior-dimensions");
    if (interiorDimGroup) {
      svg.removeChild(interiorDimGroup);
    }
    
    interiorDimGroup = document.createElementNS(this.svgNS, "g");
    interiorDimGroup.setAttribute("class", "interior-dimensions");
    svg.appendChild(interiorDimGroup);
    
    // Calculer les dimensions intérieures en fonction de la vue
    const sideThickness = (project.thicknessSettings.sides || 19) * this.scale;
    
    switch (viewType) {
      case 'front':
        // Largeur intérieure
        const interiorWidth = project.dimensions.width * this.scale - 2 * sideThickness;
        this.addDimensionLine(
          interiorDimGroup,
          sideThickness, project.dimensions.height * this.scale / 2,
          project.dimensions.width * this.scale - sideThickness, project.dimensions.height * this.scale / 2,
          `${Math.round(interiorWidth / this.scale)} mm (int.)`,
          1,
          false,
          "interior"
        );
        
        // Hauteur intérieure
        const topThickness = (project.thicknessSettings.top || 19) * this.scale;
        const bottomThickness = (project.thicknessSettings.bottom || 19) * this.scale;
        const interiorHeight = project.dimensions.height * this.scale - topThickness - bottomThickness;
        this.addDimensionLine(
          interiorDimGroup,
          project.dimensions.width * this.scale / 2, bottomThickness,
          project.dimensions.width * this.scale / 2, project.dimensions.height * this.scale - topThickness,
          `${Math.round(interiorHeight / this.scale)} mm (int.)`,
          1,
          true,
          "interior"
        );
        break;
        
      case 'top':
        // Largeur intérieure
        const interiorWidthTop = project.dimensions.width * this.scale - 2 * sideThickness;
        this.addDimensionLine(
          interiorDimGroup,
          sideThickness, project.dimensions.depth * this.scale / 2,
          project.dimensions.width * this.scale - sideThickness, project.dimensions.depth * this.scale / 2,
          `${Math.round(interiorWidthTop / this.scale)} mm (int.)`,
          1,
          false,
          "interior"
        );
        
        // Profondeur intérieure
        const backThickness = project.hasBack ? (project.thicknessSettings.back || 8) * this.scale : 0;
        const interiorDepth = project.dimensions.depth * this.scale - backThickness;
        this.addDimensionLine(
          interiorDimGroup,
          project.dimensions.width * this.scale / 2, 0,
          project.dimensions.width * this.scale / 2, project.dimensions.depth * this.scale - backThickness,
          `${Math.round(interiorDepth / this.scale)} mm (int.)`,
          1,
          true,
          "interior"
        );
        break;
        
      case 'side':
        // Hauteur intérieure (côté)
        const topThicknessSide = (project.thicknessSettings.top || 19) * this.scale;
        const bottomThicknessSide = (project.thicknessSettings.bottom || 19) * this.scale;
        const interiorHeightSide = project.dimensions.height * this.scale - topThicknessSide - bottomThicknessSide;
        this.addDimensionLine(
          interiorDimGroup,
          project.dimensions.depth * this.scale / 2, bottomThicknessSide,
          project.dimensions.depth * this.scale / 2, project.dimensions.height * this.scale - topThicknessSide,
          `${Math.round(interiorHeightSide / this.scale)} mm (int.)`,
          1,
          true,
          "interior"
        );
        
        // Profondeur intérieure (côté)
        const backThicknessSide = project.hasBack ? (project.thicknessSettings.back || 8) * this.scale : 0;
        const interiorDepthSide = project.dimensions.depth * this.scale - backThicknessSide;
        this.addDimensionLine(
          interiorDimGroup,
          0, project.dimensions.height * this.scale / 2,
          project.dimensions.depth * this.scale - backThicknessSide, project.dimensions.height * this.scale / 2,
          `${Math.round(interiorDepthSide / this.scale)} mm (int.)`,
          1,
          false,
          "interior"
        );
        break;
    }
  }

  /**
   * Génère un cartouche avec informations du projet
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
}

