import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Divider
} from '@mui/material';
import { Print as PrintIcon, PictureAsPdf as PdfIcon } from '@mui/icons-material';

/**
 * Composant d'étiquettes de panneaux - Modèle personnalisé avec chants dans les cadres extérieurs
 * Version corrigée pour jsPDF sans utiliser translate/rotate
 */
const PanelLabelsComponent = ({ panels = [], pieces = [], materials = [] }) => {
  const [loading, setLoading] = useState(false);

  // Préparation des données pour l'affichage des étiquettes
  const prepareLabelsData = () => {
    if (!panels || !Array.isArray(panels) || panels.length === 0) {
      console.log("Données insuffisantes pour générer des étiquettes: pas de panneaux");
      return [];
    }
    
    console.log(`${materials.length} matériaux disponibles pour les étiquettes`);
    
    const labelsData = [];
    
    panels.forEach((panel, panelIndex) => {
      if (!panel) return;
      
      // Récupérer le matériau pour ce panneau
      const material = getMaterialForPanel(panel);
      
      // Traitement des coupes ou pièces placées
      if (panel.cuts && Array.isArray(panel.cuts) && panel.cuts.length > 0) {
        panel.cuts.forEach((cut, cutIndex) => {
          if (!cut || !cut.pieceId) return;
          
          // Trouver la pièce correspondante
          const piece = getPieceById(cut.pieceId);
          if (!piece) return;
          
          // Obtenir le matériau spécifique à la pièce si disponible
          const pieceMaterial = piece.materialId ? getMaterialById(piece.materialId) : null;
          const actualMaterial = pieceMaterial || material;
          
          // Créer une version normalisée de la pièce avec les chants
          const pieceWithEdges = {
            ...piece,
            ...cut,
            // Normaliser les propriétés de chant
            edgeFront: piece.edgeFront || piece.edgingFront,
            edgeBack: piece.edgeBack || piece.edgingBack,
            edgeLeft: piece.edgeLeft || piece.edgingLeft,
            edgeRight: piece.edgeRight || piece.edgingRight
          };
          
          labelsData.push({
            panel: {
              ...panel,
              panelNumber: panelIndex + 1
            },
            piece: pieceWithEdges,
            material: actualMaterial,
            index: cutIndex
          });
        });
      } else if (panel.placedPieces && Array.isArray(panel.placedPieces) && panel.placedPieces.length > 0) {
        panel.placedPieces.forEach((placedItem, pieceIndex) => {
          // Déterminer si la pièce est dans placedItem.piece ou directement dans placedItem
          const originalPiece = placedItem.piece || placedItem;
          if (!originalPiece) return;
          
          // Obtenir le matériau spécifique à la pièce si disponible
          const pieceMaterial = originalPiece.materialId ? getMaterialById(originalPiece.materialId) : null;
          const actualMaterial = pieceMaterial || material;
          
          // Normaliser les données pour l'étiquette
          const pieceWithEdges = {
            ...originalPiece,
            x: placedItem.x || 0,
            y: placedItem.y || 0,
            width: placedItem.rotated ? originalPiece.length : originalPiece.width,
            length: placedItem.rotated ? originalPiece.width : originalPiece.length,
            // Normaliser les propriétés de chant
            edgeFront: originalPiece.edgeFront || originalPiece.edgingFront,
            edgeBack: originalPiece.edgeBack || originalPiece.edgingBack,
            edgeLeft: originalPiece.edgeLeft || originalPiece.edgingLeft,
            edgeRight: originalPiece.edgeRight || originalPiece.edgingRight
          };
          
          labelsData.push({
            panel: {
              ...panel,
              panelNumber: panelIndex + 1
            },
            piece: pieceWithEdges,
            material: actualMaterial,
            index: pieceIndex
          });
        });
      }
    });
    
    console.log(`${labelsData.length} étiquettes générées`);
    
    return labelsData;
  };
  
  // Récupérer une pièce par son ID
  const getPieceById = (pieceId) => {
    if (!pieceId || !Array.isArray(pieces)) return null;
    return pieces.find(p => p && p.id === pieceId);
  };
  
  // Récupérer un matériau par son ID
  const getMaterialById = (materialId) => {
    if (!materialId || !Array.isArray(materials)) return null;
    return materials.find(m => m && m.id === materialId);
  };
  
  // Trouver le matériau pour un panneau
  const getMaterialForPanel = (panel) => {
    if (!panel || !panel.materialId || !Array.isArray(materials)) return null;
    return materials.find(m => m && m.id === panel.materialId);
  };
  
  // Récupérer les informations sur les chants d'une pièce
  const getEdgesInfo = (piece) => {
    if (!piece) return {
      front: null,
      back: null,
      left: null,
      right: null,
      hasAny: false
    };
    
    // Récupérer les chants des quatre côtés
    const frontEdge = piece.edgeFront || piece.edgingFront || null;
    const backEdge = piece.edgeBack || piece.edgingBack || null;
    const leftEdge = piece.edgeLeft || piece.edgingLeft || null;
    const rightEdge = piece.edgeRight || piece.edgingRight || null;
    
    // Vérifier si au moins un chant est présent
    const hasAny = !!(frontEdge || backEdge || leftEdge || rightEdge);
    
    return {
      front: frontEdge,
      back: backEdge,
      left: leftEdge,
      right: rightEdge,
      hasAny
    };
  };
  
  // Formatage de la référence de chant pour un affichage plus compact
  const formatEdgeRef = (ref) => {
    if (!ref) return "";
    
    // Si la référence est un ID long, utiliser une version abrégée
    if (ref.length > 10) {
      return ref.substring(0, 8);
    }
    return ref;
  };
  
  // Générer un ID court pour l'étiquette
  const getShortId = (piece) => {
    if (!piece) return 'xx';
    if (piece.id && typeof piece.id === 'string') {
      // Extraire 4 caractères de l'ID
      const idChars = piece.id.substring(0, 4);
      return idChars;
    }
    return piece.description ? piece.description.substring(0, 4) : 'xx';
  };
  
  // Obtenir un matériau formaté pour l'affichage
  const getFormattedMaterial = (material) => {
    if (!material) return { name: "Matériau inconnu", thickness: "" };
    
    return {
      name: material.description || "Matériau sans nom",
      thickness: material.thickness ? `${material.thickness}MM` : ""
    };
  };
  
  // Générer un ID formaté pour l'étiquette
  const generateLabelId = (panelNumber, index) => {
    const paddedNumber = String(index + 1).padStart(5, '0');
    return paddedNumber;
  };
  
  // Obtenir la date courante formatée
  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Formater les dimensions
  const formatDimension = (value) => {
    if (typeof value !== 'number') return '0.0';
    // Format avec un chiffre après la virgule
    return value.toFixed(1);
  };
  
  // Préparer les données
  const labelsData = prepareLabelsData();
  
  // Fonction pour générer un PDF selon le modèle personnalisé
  const handleGeneratePdf = async () => {
    if (labelsData.length === 0) {
      alert("Aucune étiquette disponible.");
      return;
    }
    
    setLoading(true);
    
    try {
      // Importer jsPDF
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default || jsPDFModule;
      
      // Créer un nouveau document PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Configuration d'étiquettes
      const pageWidth = 210; // largeur A4 en mm
      const labelWidth = 90; // largeur de l'étiquette en mm
      const labelHeight = 50; // hauteur de l'étiquette en mm
      const sideWidth = 6; // largeur des cadres latéraux en mm
      const marginX = (pageWidth - 2 * labelWidth) / 3; // marge horizontale
      const marginY = 15; // marge verticale
      const labelsPerRow = 2; // 2 étiquettes par ligne
      const rowsPerPage = 5; // 5 lignes par page
      const labelsPerPage = labelsPerRow * rowsPerPage; // 10 étiquettes par page
      
      // Fonction pour dessiner une étiquette selon le modèle personnalisé
      const drawLabel = (item, x, y) => {
        const { panel, piece, material } = item;
        const edgesInfo = getEdgesInfo(piece);
        const shortId = getShortId(piece);
        const labelId = generateLabelId(panel.panelNumber, item.index);
        const materialInfo = getFormattedMaterial(material);
        
        // Cadre principal de l'étiquette
        pdf.setDrawColor(0);
        pdf.setLineWidth(0.5);
        pdf.rect(x, y, labelWidth, labelHeight);
        
        // Cadres latéraux pour les chants
        // Cadre gauche
        pdf.rect(x, y, sideWidth, labelHeight);
        // Cadre droit
        pdf.rect(x + labelWidth - sideWidth, y, sideWidth, labelHeight);
        
        // Zone principale
        const mainX = x + sideWidth;
        const mainWidth = labelWidth - (2 * sideWidth);
        
        // Ligne 1: ID panneau, Module/Palette, OPTICOUPE
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${panel.panelNumber}: ${shortId}`, mainX + 2, y + 7);
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.text("Module:", mainX + mainWidth/2 - 5, y + 5);
        pdf.text("Palette:", mainX + mainWidth/2 - 5, y + 9);
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(139, 69, 19); // Couleur marron pour OPTICOUPE
        pdf.text("OPTICOUPE", mainX + mainWidth - 25, y + 6);
        pdf.setFontSize(7);
        pdf.text("découpe", mainX + mainWidth - 15, y + 10);
        pdf.setTextColor(0); // Remettre en noir
        
        // Ligne séparatrice
        pdf.line(x, y + 12, x + labelWidth, y + 12);
        
        // Ligne 2: Client
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Client : OPTICOUPE`, mainX + 2, y + 17);
        
        // Ligne séparatrice
        pdf.line(x, y + 19, x + labelWidth, y + 19);
        
        // Ligne 3: Description de la pièce
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(piece.description || 'Sans description', mainX + 2, y + 25);
        
        // Ligne séparatrice
        pdf.line(x, y + 28, x + labelWidth, y + 28);
        
        // Ligne 4: Dimensions et numéro d'étiquette
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Dim.finies : ${formatDimension(piece.length)} x ${formatDimension(piece.width)}`, mainX + 2, y + 33);
        pdf.text(`Dim.débit : ${formatDimension(piece.length + 2)} x ${formatDimension(piece.width + 2)}`, mainX + 2, y + 38);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(labelId, mainX + mainWidth - 15, y + 36);
        
        // Ligne séparatrice
        pdf.line(x, y + 40, x + labelWidth, y + 40);
        
        // Ligne 5: Matériau, date et quantité
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${materialInfo.name} ${materialInfo.thickness}`, mainX + 2, y + 45);
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(getCurrentDate(), mainX + 2, y + 48);
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Qté : ${piece.quantity || 1} / ${piece.quantity || 1}`, mainX + mainWidth - 22, y + 45);
        
        // Code-barre en bas
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${materialInfo.name} ${materialInfo.thickness}-${edgesInfo.hasAny ? "EDGE" : "NOEDGE"}`, 
                mainX + mainWidth/2, y + labelHeight - 2, { align: 'center' });
        
        // Informations de chants dans les cadres latéraux
        if (edgesInfo.hasAny) {
          // Afficher les références de chants dans les cadres
          pdf.setFontSize(6);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(255, 0, 0); // Rouge pour les chants
          
          // Chant gauche (vertical mais sans utiliser rotate)
          if (edgesInfo.left) {
            // Méthode alternative pour le texte vertical
            const leftText = `G:${formatEdgeRef(edgesInfo.left)}`;
            // On dessine chaque lettre individuellement avec un écart
            for (let i = 0; i < leftText.length; i++) {
              pdf.text(leftText[i], x + 3, y + 15 + (i * 4));
            }
          }
          
          // Chant droit (vertical mais sans utiliser rotate)
          if (edgesInfo.right) {
            // Méthode alternative pour le texte vertical
            const rightText = `D:${formatEdgeRef(edgesInfo.right)}`;
            // On dessine chaque lettre individuellement avec un écart
            for (let i = 0; i < rightText.length; i++) {
              pdf.text(rightText[i], x + labelWidth - 3, y + 15 + (i * 4));
            }
          }
          
          // Chant avant (horizontal en haut)
          if (edgesInfo.front) {
            pdf.text(`AV:${formatEdgeRef(edgesInfo.front)}`, mainX + mainWidth/2, y + 3, { align: 'center' });
          }
          
          // Chant arrière (horizontal en bas)
          if (edgesInfo.back) {
            pdf.text(`AR:${formatEdgeRef(edgesInfo.back)}`, mainX + mainWidth/2, y + labelHeight - 5, { align: 'center' });
          }
          
          // Remettre en noir
          pdf.setTextColor(0);
        }
      };
      
      // Générer les pages d'étiquettes
      for (let i = 0; i < labelsData.length; i++) {
        // Calculer la position de l'étiquette sur la page
        const pageIndex = Math.floor(i / labelsPerPage);
        const positionInPage = i % labelsPerPage;
        const row = Math.floor(positionInPage / labelsPerRow);
        const col = positionInPage % labelsPerRow;
        
        // Si on commence une nouvelle page
        if (positionInPage === 0 && i > 0) {
          pdf.addPage();
        }
        
        // Calculer les coordonnées
        const x = marginX + col * (labelWidth + marginX);
        const y = marginY + row * (labelHeight + 10);
        
        // Dessiner l'étiquette
        drawLabel(labelsData[i], x, y);
      }
      
      // Enregistrer le PDF
      pdf.save("etiquettes_panneaux_custom.pdf");
      
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      alert("Erreur lors de la génération du PDF: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Impression HTML personnalisée
  const handlePrintHtml = () => {
    // Créer une fenêtre d'impression
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Le popup d'impression a été bloqué. Veuillez autoriser les popups pour ce site.");
      return;
    }

    // Générer le HTML des étiquettes personnalisées
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Étiquettes Personnalisées</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 10mm;
          }
          
          .label-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
          }
          
          .label {
            width: 90mm;
            height: 50mm;
            border: 1px solid black;
            margin-bottom: 10mm;
            position: relative;
            box-sizing: border-box;
            page-break-inside: avoid;
          }
          
          .label-content {
            display: flex;
            height: 100%;
          }
          
          .side-left, .side-right {
            width: 6mm;
            height: 100%;
            border-right: 1px solid black;
            position: relative;
            writing-mode: vertical-rl;
            text-orientation: mixed;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          
          .side-right {
            border-right: none;
            border-left: 1px solid black;
            writing-mode: vertical-lr;
          }
          
          .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            position: relative;
          }
          
          .row {
            padding: 2mm 3mm;
            border-bottom: 1px solid black;
          }
          
          .row:last-child {
            border-bottom: none;
            flex: 1;
          }
          
          .row-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .row-header-center {
            text-align: center;
            font-size: 8pt;
          }
          
          .opticoupe {
            text-align: right;
            color: #8B4513;
            font-weight: bold;
          }
          
          .opticoupe-subtitle {
            font-size: 7pt;
          }
          
          .row-dimensions {
            display: flex;
            justify-content: space-between;
          }
          
          .dimensions {
            font-size: 9pt;
          }
          
          .label-id {
            font-size: 10pt;
            font-weight: bold;
            text-align: right;
          }
          
          .row-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .material {
            font-weight: bold;
          }
          
          .date {
            font-size: 8pt;
          }
          
          .quantity {
            font-weight: bold;
          }
          
          .barcode {
            position: absolute;
            bottom: 1mm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 7pt;
            color: #666;
          }
          
          .edge-info {
            color: red;
            font-weight: bold;
            font-size: 8pt;
          }
          
          .edge-top, .edge-bottom {
            position: absolute;
            left: 0;
            right: 0;
            text-align: center;
          }
          
          .edge-top {
            top: 1mm;
          }
          
          .edge-bottom {
            bottom: 1mm;
          }
          
          @media print {
            .no-print {
              display: none;
            }
            
            .label {
              break-inside: avoid;
            }
            
            .edge-info {
              color: red !important;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px;">
          <h1>Étiquettes de panneaux personnalisées</h1>
          <p>Cliquez sur le bouton d'impression de votre navigateur ou appuyez sur Ctrl+P pour imprimer.</p>
        </div>
        
        <div class="label-container">
    `;
    
    // Générer le HTML pour chaque étiquette
    labelsData.forEach((item) => {
      const { panel, piece, material } = item;
      const edgesInfo = getEdgesInfo(piece);
      const shortId = getShortId(piece);
      const labelId = generateLabelId(panel.panelNumber, item.index);
      const materialInfo = getFormattedMaterial(material);
      
      htmlContent += `
        <div class="label">
          <div class="label-content">
            <!-- Cadre gauche avec info chant -->
            <div class="side-left">
              ${edgesInfo.left ? `<span class="edge-info">G:${formatEdgeRef(edgesInfo.left)}</span>` : ''}
            </div>
            
            <!-- Contenu principal -->
            <div class="main-content">
              <!-- En-tête: ID, Module/Palette, OPTICOUPE -->
              <div class="row">
                <div class="row-header">
                  <div><strong>${panel.panelNumber}: ${shortId}</strong></div>
                  
                  <div class="row-header-center">
                    Module:<br>
                    Palette:
                  </div>
                  
                  <div class="opticoupe">
                    OPTICOUPE<br>
                    <span class="opticoupe-subtitle">découpe</span>
                  </div>
                </div>
                
                <!-- Chant avant en haut -->
                ${edgesInfo.front ? `<div class="edge-top edge-info">AV:${formatEdgeRef(edgesInfo.front)}</div>` : ''}
              </div>
              
              <!-- Client -->
              <div class="row">
                Client : OPTICOUPE
              </div>
              
              <!-- Description -->
              <div class="row">
                <strong>${piece.description || 'Sans description'}</strong>
              </div>
              
              <!-- Dimensions et ID -->
              <div class="row">
                <div class="row-dimensions">
                  <div class="dimensions">
                    Dim.finies : ${formatDimension(piece.length)} x ${formatDimension(piece.width)}<br>
                    Dim.débit : ${formatDimension(piece.length + 2)} x ${formatDimension(piece.width + 2)}
                  </div>
                  
                  <div class="label-id">${labelId}</div>
                </div>
              </div>
              
              <!-- Matériau, date et quantité -->
              <div class="row">
                <div class="row-footer">
                  <div>
                    <div class="material">${materialInfo.name} ${materialInfo.thickness}</div>
                    <div class="date">${getCurrentDate()}</div>
                  </div>
                  
                  <div class="quantity">Qté : ${piece.quantity || 1} / ${piece.quantity || 1}</div>
                </div>
                
                <!-- Code en bas -->
                <div class="barcode">${materialInfo.name} ${materialInfo.thickness}-${edgesInfo.hasAny ? "EDGE" : "NOEDGE"}</div>
                
                <!-- Chant arrière en bas -->
                ${edgesInfo.back ? `<div class="edge-bottom edge-info">AR:${formatEdgeRef(edgesInfo.back)}</div>` : ''}
              </div>
            </div>
            
            <!-- Cadre droit avec info chant -->
            <div class="side-right">
              ${edgesInfo.right ? `<span class="edge-info">D:${formatEdgeRef(edgesInfo.right)}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    });
    
    htmlContent += `
        </div>
      </body>
      </html>
    `;
    
    // Écrire le contenu HTML
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Attendre que le contenu soit chargé puis imprimer
    printWindow.onload = function() {
      try {
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      } catch (printError) {
        console.error("Erreur lors de l'impression:", printError);
        alert("Une erreur est survenue lors de l'impression. Veuillez réessayer.");
      }
    };
  };
  
  // Si aucune donnée n'est disponible
  if (labelsData.length === 0) {
    return (
      <Box sx={{ mt: 2, mb: 3 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle1" color="text.secondary">
            Aucune donnée disponible pour générer des étiquettes
          </Typography>
        </Paper>
      </Box>
    );
  }
  
  return (
    <Box sx={{ mt: 2, mb: 3 }}>
      {/* Boutons d'impression */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Impression d'étiquettes - Modèle personnalisé
        </Typography>
        
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body1">
            {labelsData.length} étiquettes prêtes à l'impression
          </Typography>
          
          <Box>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<PrintIcon />}
              onClick={handlePrintHtml}
              sx={{ mr: 2 }}
            >
              Imprimer (HTML)
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PdfIcon />}
              onClick={handleGeneratePdf}
              disabled={loading}
            >
              {loading ? "Génération en cours..." : "Générer PDF"}
            </Button>
          </Box>
        </Box>
      </Paper>
      
      {/* Aperçu des étiquettes */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Aperçu des étiquettes
        </Typography>
        
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          {labelsData.slice(0, 2).map((item, index) => {
            const { panel, piece, material } = item;
            const edgesInfo = getEdgesInfo(piece);
            const shortId = getShortId(piece);
            const labelId = generateLabelId(panel.panelNumber, index);
            const materialInfo = getFormattedMaterial(material);
            
            return (
              <Grid item xs={12} md={6} key={`preview-${index}`}>
                <Card variant="outlined" sx={{ 
                  height: '100%', 
                  borderColor: '#000', 
                  borderWidth: '1px' 
                }}>
                  <CardContent sx={{ 
                    p: 0, 
                    height: '100%',
                    display: 'flex',
                    '&:last-child': { pb: 0 }
                  }}>
                    {/* Cadre gauche */}
                    <Box sx={{ 
                      width: '1.2rem', 
                      borderRight: '1px solid #000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      {edgesInfo.left && (
                        <Typography 
                          sx={{ 
                            color: 'red',
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                            transform: 'rotate(-90deg)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          G:{formatEdgeRef(edgesInfo.left)}
                        </Typography>
                      )}
                    </Box>
                    
                    {/* Contenu principal */}
                    <Box sx={{ 
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      {/* En-tête */}
                      <Box sx={{ 
                        p: 1,
                        borderBottom: '1px solid #000',
                        display: 'flex',
                        justifyContent: 'space-between',
                        position: 'relative'
                      }}>
                        <Typography variant="body2" fontWeight="bold">
                          {panel.panelNumber}: {shortId}
                        </Typography>
                        
                        <Box sx={{ textAlign: 'center', fontSize: '0.75rem' }}>
                          Module:<br />
                          Palette:
                        </Box>
                        
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography sx={{ fontWeight: 'bold', color: '#8B4513' }}>
                            OPTICOUPE
                          </Typography>
                          <Typography sx={{ fontSize: '0.6rem', color: '#8B4513' }}>
                            découpe
                          </Typography>
                        </Box>
                        
                        {/* Chant avant en haut */}
                        {edgesInfo.front && (
                          <Typography 
                            sx={{ 
                              position: 'absolute',
                              top: '1px',
                              left: 0,
                              right: 0,
                              textAlign: 'center',
                              color: 'red',
                              fontWeight: 'bold',
                              fontSize: '0.7rem'
                            }}
                          >
                            AV:{formatEdgeRef(edgesInfo.front)}
                          </Typography>
                        )}
                      </Box>
                      
                      {/* Client */}
                      <Box sx={{ p: 1, borderBottom: '1px solid #000' }}>
                        <Typography variant="body2">
                          Client : OPTICOUPE
                        </Typography>
                      </Box>
                      
                      {/* Description */}
                      <Box sx={{ p: 1, borderBottom: '1px solid #000' }}>
                        <Typography variant="body1" fontWeight="bold">
                          {piece.description || 'Sans description'}
                        </Typography>
                      </Box>
                      
                      {/* Dimensions et ID */}
                      <Box sx={{ 
                        p: 1, 
                        borderBottom: '1px solid #000',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <Box>
                          <Typography variant="body2">
                            Dim.finies : {formatDimension(piece.length)} x {formatDimension(piece.width)}
                          </Typography>
                          <Typography variant="body2">
                            Dim.débit : {formatDimension(piece.length + 2)} x {formatDimension(piece.width + 2)}
                          </Typography>
                        </Box>
                        
                        <Typography variant="body1" fontWeight="bold" sx={{ alignSelf: 'center' }}>
                          {labelId}
                        </Typography>
                      </Box>
                      
                      {/* Matériau, date et quantité */}
                      <Box sx={{ 
                        p: 1,
                        flex: 1,
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <Box sx={{ 
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}>
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              {materialInfo.name} {materialInfo.thickness}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {getCurrentDate()}
                            </Typography>
                          </Box>
                          
                          <Typography variant="body2" fontWeight="bold" sx={{ alignSelf: 'flex-start' }}>
                            Qté : {piece.quantity || 1} / {piece.quantity || 1}
                          </Typography>
                        </Box>
                        
                        {/* Code en bas */}
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            position: 'absolute',
                            bottom: '2px',
                            left: 0,
                            right: 0,
                            textAlign: 'center'
                          }}
                        >
                          {materialInfo.name} {materialInfo.thickness}-{edgesInfo.hasAny ? "EDGE" : "NOEDGE"}
                        </Typography>
                        
                        {/* Chant arrière en bas */}
                        {edgesInfo.back && (
                          <Typography 
                            sx={{ 
                              position: 'absolute',
                              bottom: '6px',
                              left: 0,
                              right: 0,
                              textAlign: 'center',
                              color: 'red',
                              fontWeight: 'bold',
                              fontSize: '0.7rem'
                            }}
                          >
                            AR:{formatEdgeRef(edgesInfo.back)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    
                    {/* Cadre droit */}
                    <Box sx={{ 
                      width: '1.2rem', 
                      borderLeft: '1px solid #000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      {edgesInfo.right && (
                        <Typography 
                          sx={{ 
                            color: 'red',
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                            transform: 'rotate(90deg)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          D:{formatEdgeRef(edgesInfo.right)}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
        
        {labelsData.length > 2 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {labelsData.length - 2} autres étiquettes non affichées dans l'aperçu
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default PanelLabelsComponent;