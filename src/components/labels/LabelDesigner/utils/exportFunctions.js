// utils/exportFunctions.js
import { jsPDF } from 'jspdf';
import 'jspdf-autotable'; // Si vous utilisez des tableaux

// Fonction pour générer un PDF
export const generatePdf = async (options) => {
  const { pieces, materials, panels, config, companyInfo } = options;
  
  // Créer un nouveau document PDF
  const pdf = new jsPDF({
    orientation: config.layout.orientation,
    unit: 'mm',
    format: config.layout.pageSize
  });
  
  // Configuration des étiquettes
  const { width, height } = config.layout;
  const labelsPerRow = config.layout.labelsPerRow;
  const marginTop = config.layout.marginTop;
  const marginLeft = config.layout.marginLeft;
  const marginRight = config.layout.marginRight;
  const spacing = config.layout.spacing || 5;
  
  // Calcul de dimensions
  const pageWidth = pdf.internal.pageSize.getWidth();
  const availableWidth = pageWidth - marginLeft - marginRight;
  const labelSpacing = spacing;
  
  // Fonction pour obtenir les informations du matériau
  const getMaterialInfo = (materialId) => {
    const material = materials.find(m => m.id === materialId);
    if (!material) return "Matériau inconnu";
    return `${material.description || "Matériau"} ${material.thickness ? `(${material.thickness}mm)` : ""}`;
  };
  
  // Fonction pour obtenir les informations sur les chants
  const getEdgesInfo = (piece) => {
    const edges = [];
    if (piece.edgingFront || piece.edgeFront) edges.push('Avant');
    if (piece.edgingBack || piece.edgeBack) edges.push('Arrière');
    if (piece.edgingLeft || piece.edgeLeft) edges.push('Gauche');
    if (piece.edgingRight || piece.edgeRight) edges.push('Droite');
    
    if (edges.length === 0) return "Aucun";
    if (edges.length === 4) return "Tous les côtés";
    return edges.join(', ');
  };
  
  // Fonction pour obtenir le numéro de panneau pour une pièce
  const getPanelNumber = (piece) => {
    if (!panels || panels.length === 0) return "-";
    
    // Recherche dans les panneaux optimisés
    for (let i = 0; i < panels.length; i++) {
      const panel = panels[i];
      const placedPieces = panel.placedPieces || panel.cuts || [];
      
      if (placedPieces.some(p => 
        (p.id === piece.id) || 
        (p.pieceId === piece.id) || 
        (p.piece && p.piece.id === piece.id)
      )) {
        return `Panneau ${i + 1}`;
      }
    }
    
    return "-";
  };
  
  // Fonction pour obtenir la date courante
  const getCurrentDate = () => {
    return new Date().toLocaleDateString();
  };
  
  // Fonction pour dessiner une étiquette
  const drawLabel = (piece, x, y, index) => {
    // Style
    const { 
      mainColor, secondaryColor, textColor, 
      fontFamily, fontSize, headerFontSize, 
      borderWidth, borderColor, borderRadius 
    } = config.style;
    
    // Convertir la couleur hex en RGB pour jsPDF
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };
    
    const mainColorRgb = hexToRgb(mainColor);
    const borderColorRgb = hexToRgb(borderColor || mainColor);
    const textColorRgb = hexToRgb(textColor || '#000000');
    
    // Dessiner le rectangle principal
    pdf.setDrawColor(borderColorRgb.r, borderColorRgb.g, borderColorRgb.b);
    pdf.setLineWidth(borderWidth || 1);
    pdf.rect(x, y, width, height);
    
    // En-tête
    pdf.setFillColor(mainColorRgb.r, mainColorRgb.g, mainColorRgb.b);
    pdf.rect(x, y, width, 7, 'F');
    
    // Texte d'en-tête
    pdf.setTextColor(255, 255, 255); // Blanc pour contraste
    pdf.setFontSize(headerFontSize || (fontSize + 2));
    
    if (config.content.showPieceId && piece.id) {
      pdf.text(`#${piece.id.substring(0, 6)}`, x + 2, y + 4.5);
    } else {
      pdf.text(`Pièce ${index + 1}`, x + 2, y + 4.5);
    }
    
    if (config.content.showPanelNumber) {
      const panelText = getPanelNumber(piece);
      const panelTextWidth = pdf.getStringUnitWidth(panelText) * headerFontSize / pdf.internal.scaleFactor;
      pdf.text(panelText, x + width - panelTextWidth - 2, y + 4.5);
    }
    
    // Contenu principal
    pdf.setTextColor(textColorRgb.r, textColorRgb.g, textColorRgb.b);
    pdf.setFontSize(fontSize);
    let yOffset = y + 10;
    
    // Description
    if (config.content.showDescription) {
      pdf.setFont(undefined, 'bold');
      pdf.text(piece.description || "Sans description", x + 2, yOffset);
      pdf.setFont(undefined, 'normal');
      yOffset += 5;
    }
    
    // Dimensions
    if (config.content.showDimensions) {
      const dimensionText = `L: ${piece.length} × l: ${piece.width} ${piece.thickness ? `× e: ${piece.thickness}` : ''} mm`;
      pdf.text(dimensionText, x + 2, yOffset);
      yOffset += 5;
    }
    
    // Matériau
    if (config.content.showMaterial && piece.materialId) {
      pdf.text(`Mat: ${getMaterialInfo(piece.materialId)}`, x + 2, yOffset);
      yOffset += 5;
    }
    
    // Chants
    if (config.content.showEdges) {
      pdf.text(`Chants: ${getEdgesInfo(piece)}`, x + 2, yOffset);
      yOffset += 5;
    }
    
    // Pied de page
    if (secondaryColor) {
      const secColorRgb = hexToRgb(secondaryColor);
      pdf.setFillColor(secColorRgb.r, secColorRgb.g, secColorRgb.b);
      pdf.rect(x, y + height - 5, width, 5, 'F');
    }
    
    // Date
    if (config.content.showDate) {
      pdf.setFontSize(fontSize - 2);
      pdf.text(getCurrentDate(), x + 2, y + height - 2);
    }
    
    // Quantité
    if (config.content.showQuantity) {
      const qtyText = `Qté: ${piece.quantity || 1}`;
      const qtyTextWidth = pdf.getStringUnitWidth(qtyText) * (fontSize - 2) / pdf.internal.scaleFactor;
      pdf.setFontSize(fontSize - 2);
      pdf.setFont(undefined, 'bold');
      pdf.text(qtyText, x + width - qtyTextWidth - 2, y + height - 2);
      pdf.setFont(undefined, 'normal');
    }
    
    // Logo (si activé et disponible)
    if (config.logo && config.logo.enabled && companyInfo && companyInfo.logo) {
      // Implémentation du logo à ajouter plus tard
    }
  };
  
  // Dessiner les étiquettes
  let pageCount = 0;
  let xPos = marginLeft;
  let yPos = marginTop;
  let labelsInRowCount = 0;
  
  for (let i = 0; i < pieces.length; i++) {
    // Si on atteint le nombre maximum d'étiquettes par ligne
    if (labelsInRowCount >= labelsPerRow) {
      xPos = marginLeft;
      yPos += height + labelSpacing;
      labelsInRowCount = 0;
    }
    
    // Si on atteint le bas de la page, créer une nouvelle page
    if (yPos + height > pdf.internal.pageSize.getHeight() - 10) {
      pdf.addPage();
      pageCount++;
      yPos = marginTop;
      xPos = marginLeft;
      labelsInRowCount = 0;
    }
    
    // Dessiner l'étiquette
    drawLabel(pieces[i], xPos, yPos, i);
    
    // Passer à la position suivante
    xPos += width + labelSpacing;
    labelsInRowCount++;
  }
  
  // Ajouter une numérotation des pages
  const totalPages = pageCount + 1;
  for (let i = 0; i < totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Page ${i + 1} / ${totalPages}`, pdf.internal.pageSize.getWidth() - 25, pdf.internal.pageSize.getHeight() - 5);
  }
  
  // Sauvegarder le PDF
  pdf.save(`Etiquettes_${new Date().toISOString().slice(0, 10)}.pdf`);
  
  return true;
};

// Fonction pour imprimer en HTML
export const printHtml = (options) => {
  const { pieces, materials, panels, config, companyInfo } = options;
  
  // Créer une fenêtre d'impression
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error("Le popup d'impression a été bloqué. Veuillez autoriser les popups pour ce site.");
  }
  
  // Fonction pour obtenir les informations du matériau
  const getMaterialInfo = (materialId) => {
    const material = materials.find(m => m.id === materialId);
    if (!material) return "Matériau inconnu";
    return `${material.description || "Matériau"} ${material.thickness ? `(${material.thickness}mm)` : ""}`;
  };
  
  // Fonction pour obtenir les informations sur les chants
  const getEdgesInfo = (piece) => {
    const edges = [];
    if (piece.edgingFront || piece.edgeFront) edges.push('Avant');
    if (piece.edgingBack || piece.edgeBack) edges.push('Arrière');
    if (piece.edgingLeft || piece.edgeLeft) edges.push('Gauche');
    if (piece.edgingRight || piece.edgeRight) edges.push('Droite');
    
    if (edges.length === 0) return "Aucun";
    if (edges.length === 4) return "Tous les côtés";
    return edges.join(', ');
  };
  
  // Fonction pour obtenir le numéro de panneau pour une pièce
  const getPanelNumber = (piece) => {
    if (!panels || panels.length === 0) return "-";
    
    // Recherche dans les panneaux optimisés
    for (let i = 0; i < panels.length; i++) {
      const panel = panels[i];
      const placedPieces = panel.placedPieces || panel.cuts || [];
      
      if (placedPieces.some(p => 
        (p.id === piece.id) || 
        (p.pieceId === piece.id) || 
        (p.piece && p.piece.id === piece.id)
      )) {
        return `Panneau ${i + 1}`;
      }
    }
    
    return "-";
  };
  
  // Fonction pour obtenir la date courante
  const getCurrentDate = () => {
    return new Date().toLocaleDateString();
  };
  
  // Générer le HTML pour les étiquettes
  let labelsHtml = '';
  pieces.forEach((piece, index) => {
    labelsHtml += `
      <div class="label" style="width: ${config.layout.width}mm; height: ${config.layout.height}mm;">
        <div class="label-header" style="background-color: ${config.style.mainColor};">
          <span class="piece-id">${config.content.showPieceId && piece.id ? `#${piece.id.substring(0, 6)}` : `Pièce ${index + 1}`}</span>
          ${config.content.showPanelNumber ? `<span class="panel-number">${getPanelNumber(piece)}</span>` : ''}
        </div>
        <div class="label-content">
          ${config.content.showDescription ? `<div class="description">${piece.description || "Sans description"}</div>` : ''}
          ${config.content.showDimensions ? `<div class="dimensions">L: ${piece.length} × l: ${piece.width} ${piece.thickness ? `× e: ${piece.thickness}` : ''} mm</div>` : ''}
          ${config.content.showMaterial && piece.materialId ? `<div class="material">Mat: ${getMaterialInfo(piece.materialId)}</div>` : ''}
          ${config.content.showEdges ? `<div class="edges">Chants: ${getEdgesInfo(piece)}</div>` : ''}
        </div>
        <div class="label-footer" style="background-color: ${config.style.secondaryColor || '#f5f5f5'};">
          ${config.content.showDate ? `<span class="date">${getCurrentDate()}</span>` : ''}
          ${config.content.showQuantity ? `<span class="quantity">Qté: ${piece.quantity || 1}</span>` : ''}
        </div>
      </div>
    `;
  });
  
  // Générer le HTML complet
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Étiquettes</title>
      <style>
        @page {
          size: ${config.layout.pageSize} ${config.layout.orientation};
          margin: ${config.layout.marginTop}mm ${config.layout.marginRight}mm ${config.layout.marginBottom}mm ${config.layout.marginLeft}mm;
        }
        body {
          font-family: ${config.style.fontFamily || 'Arial, sans-serif'};
          font-size: ${config.style.fontSize}pt;
          color: ${config.style.textColor || '#000000'};
          margin: 0;
          padding: 0;
        }
        .container {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-start;
          gap: ${config.layout.spacing || 5}mm;
        }
        .label {
          border: ${config.style.borderWidth || 1}px solid ${config.style.borderColor || config.style.mainColor};
          border-radius: ${config.style.borderRadius || 0}px;
          overflow: hidden;
          page-break-inside: avoid;
          display: flex;
          flex-direction: column;
          background-color: white;
          margin-bottom: ${config.layout.spacing || 5}mm;
        }
        .label-header {
          background-color: ${config.style.mainColor};
          color: white;
          padding: 2mm;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: ${config.style.headerFontSize || (config.style.fontSize + 2)}pt;
          font-weight: bold;
        }
        .label-content {
          padding: 2mm;
          flex-grow: 1;
        }
        .description {
          font-weight: bold;
          margin-bottom: 1mm;
        }
        .dimensions, .material, .edges {
          margin-bottom: 1mm;
        }
        .label-footer {
          border-top: 1px solid ${config.style.borderColor || config.style.mainColor};
          background-color: ${config.style.secondaryColor || '#f5f5f5'};
          padding: 1mm 2mm;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: ${(config.style.fontSize - 2) || 8}pt;
        }
        .quantity {
          font-weight: bold;
        }
        @media print {
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 10mm; padding: 5mm;">
        <h1>Impression d'étiquettes</h1>
        <p>Cliquez sur le bouton Imprimer de votre navigateur ou appuyez sur Ctrl+P pour imprimer.</p>
      </div>
      <div class="container">
        ${labelsHtml}
      </div>
    </body>
    </html>
  `;
  
  // Écrire le contenu dans la fenêtre d'impression
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Attendre que tout soit chargé, puis imprimer
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 200);
  };
  
  return true;
};