// src/components/dialogs/ImportCSVDialog.js
import React, { useState } from 'react';
import { 
  Button, Dialog, DialogActions, DialogContent, DialogContentText, 
  DialogTitle, FormControl, InputLabel, Select, MenuItem, Box, Typography, 
  Alert, LinearProgress, Chip, FormControlLabel, Switch, TextField
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import Papa from 'papaparse';

const ImportCSVDialog = ({ open, onClose, onImportComplete, materials = [], edgings = [] }) => {
  const [file, setFile] = useState(null);
  const [defaultMaterialId, setDefaultMaterialId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [importWithEdges, setImportWithEdges] = useState(true);
  const [dimensionTolerance, setDimensionTolerance] = useState(0.5);
  
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv'))) {
      setFile(selectedFile);
      setError(null);
      
      // Lecture préliminaire pour afficher un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const lines = content.split(/\r\n|\n/).slice(0, 6); // Prendre les 5 premières lignes + en-tête
        setPreviewData(lines);
      };
      reader.readAsText(selectedFile);
    } else {
      setFile(null);
      setError('Veuillez sélectionner un fichier CSV valide');
    }
  };
  
  const handleImport = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier CSV');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Lire le fichier
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const csvData = e.target.result;
        
        // Parser le CSV avec des options robustes
        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          delimiter: '',  // Auto-détection du délimiteur
          delimitersToGuess: [',', ';', '\t'],
          transformHeader: header => header.trim().toLowerCase(),
          complete: async (results) => {
            try {
              if (results.errors.length > 0) {
                console.error("Erreurs lors du parsing CSV:", results.errors);
                setError('Le fichier CSV contient des erreurs de format');
                setIsLoading(false);
                return;
              }
              
              if (results.data.length === 0) {
                setError('Le fichier CSV ne contient aucune donnée');
                setIsLoading(false);
                return;
              }
              
              console.log("Données CSV parsées:", results);
              
              // Analyser les en-têtes pour comprendre la structure du fichier
              const headers = results.meta.fields;
              
              // Mappage des colonnes
              const columnMap = {
                description: headers.findIndex(h => /^(desc|description|nom|libellé|libelle)$/i.test(h)),
                length: headers.findIndex(h => /^(longueur|length|long|lg)$/i.test(h)),
                width: headers.findIndex(h => /^(largeur|width|l|larg)$/i.test(h)),
                quantity: headers.findIndex(h => /^(quantité|quantity|qté|qte|qty|q)$/i.test(h)),
                thickness: headers.findIndex(h => /^(épaisseur|epaisseur|thickness|ep)$/i.test(h)),
                materialId: headers.findIndex(h => /^(matériau|materiau|material|mat)$/i.test(h)),
                hasGrain: headers.findIndex(h => /^(fil|grain|sens)$/i.test(h)),
                grainDirection: headers.findIndex(h => /^(sens[ _-]?fil|direction[ _-]?fil|grain[ _-]?direction)$/i.test(h)),
                priority: headers.findIndex(h => /^(priorité|priority|prio)$/i.test(h)),
                // Chants
                edgingFront: headers.findIndex(h => /^(chant[ _-]?avant|edge[ _-]?front|avant)$/i.test(h)),
                edgingBack: headers.findIndex(h => /^(chant[ _-]?arrière|edge[ _-]?back|arriere|arrière)$/i.test(h)),
                edgingLeft: headers.findIndex(h => /^(chant[ _-]?gauche|edge[ _-]?left|gauche)$/i.test(h)),
                edgingRight: headers.findIndex(h => /^(chant[ _-]?droit|edge[ _-]?right|droit)$/i.test(h))
              };
              
              console.log("Mappage des colonnes:", columnMap);
              
              // Vérifier les colonnes obligatoires
              if (columnMap.width === -1 || columnMap.length === -1) {
                setError('Le fichier CSV doit contenir au minimum les colonnes "Longueur" et "Largeur"');
                setIsLoading(false);
                return;
              }
              
              // Préparer les pièces à ajouter
              const importedPieces = [];
              let skippedRows = 0;
              
              for (let i = 0; i < results.data.length; i++) {
                const row = results.data[i];
                
                try {
                  // Récupérer les valeurs en fonction du mappage
                  const getColumnValue = (key) => {
                    if (columnMap[key] === -1) return null;
                    const fieldName = headers[columnMap[key]];
                    return row[fieldName];
                  };
                  
                  const width = parseFloat((getColumnValue('width') || '').toString().replace(',', '.'));
                  const length = parseFloat((getColumnValue('length') || '').toString().replace(',', '.'));
                  
                  // Vérifier les dimensions minimum
                  if (isNaN(width) || isNaN(length) || width <= 0 || length <= 0) {
                    console.warn(`Ligne ${i+1} ignorée: dimensions invalides`, row);
                    skippedRows++;
                    continue;
                  }
                  
                  // Trouver le matériau
                  let materialId = getColumnValue('materialId');
                  if (!materialId && defaultMaterialId) {
                    materialId = defaultMaterialId;
                  } else if (typeof materialId === 'string') {
                    // Chercher le matériau par code ou description
                    const matchedMaterial = materials.find(
                      m => m.code === materialId || 
                           m.description.toLowerCase() === materialId.toLowerCase()
                    );
                    if (matchedMaterial) {
                      materialId = matchedMaterial.id;
                    } else {
                      materialId = defaultMaterialId;
                    }
                  }
                  
                  // Traitement des chants si l'option est activée
                  let edgingFront = null;
                  let edgingBack = null;
                  let edgingLeft = null;
                  let edgingRight = null;
                  
                  if (importWithEdges) {
                    // Fonction pour résoudre l'ID d'un chant
                    const resolveEdgingId = (value) => {
                      if (!value || value === '' || /non|no|false|0/i.test(value.toString())) {
                        return null;
                      }
                      
                      // Si c'est déjà un ID valide
                      if (edgings.some(e => e.id === value)) {
                        return value;
                      }
                      
                      // Chercher par code ou description
                      const matchedEdging = edgings.find(
                        e => e.code === value || 
                             e.description.toLowerCase() === value.toString().toLowerCase()
                      );
                      
                      return matchedEdging ? matchedEdging.id : null;
                    };
                    
                    edgingFront = resolveEdgingId(getColumnValue('edgingFront'));
                    edgingBack = resolveEdgingId(getColumnValue('edgingBack'));
                    edgingLeft = resolveEdgingId(getColumnValue('edgingLeft'));
                    edgingRight = resolveEdgingId(getColumnValue('edgingRight'));
                  }
                  
                  // Interpréter la valeur du "fil du bois"
                  const hasGrainValue = getColumnValue('hasGrain');
                  const hasGrain = hasGrainValue === true || 
                                  /oui|yes|true|1/i.test((hasGrainValue || '').toString());
                  
                  // Interpréter la priorité
                  const priorityValue = getColumnValue('priority');
                  let priority = 'normal';
                  if (priorityValue) {
                    if (/haut|high|forte|important/i.test(priorityValue.toString())) {
                      priority = 'high';
                    } else if (/bas|low|faible/i.test(priorityValue.toString())) {
                      priority = 'low';
                    }
                  }
                  
                  // Créer l'objet pièce
                  const pieceData = {
                    description: getColumnValue('description') || `Pièce importée ${i+1}`,
                    quantity: parseInt(getColumnValue('quantity')) || 1,
                    length: length,
                    width: width,
                    thickness: parseFloat(getColumnValue('thickness')) || 
                               (materialId ? materials.find(m => m.id === materialId)?.thickness || 18 : 18),
                    materialId: materialId,
                    hasGrain: hasGrain,
                    grainDirection: /largeur|width/i.test((getColumnValue('grainDirection') || '').toString()) ? 
                                   'width' : 'length',
                    edgingFront: edgingFront,
                    edgingBack: edgingBack,
                    edgingLeft: edgingLeft,
                    edgingRight: edgingRight,
                    priority: priority
                  };
                  
                  importedPieces.push(pieceData);
                } catch (rowError) {
                  console.error(`Erreur lors du traitement de la ligne ${i+1}:`, rowError, row);
                  skippedRows++;
                }
              }
              
              // Vérifier qu'il y a au moins une pièce à importer
              if (importedPieces.length === 0) {
                setError('Aucune pièce valide n\'a pu être extraite du fichier CSV');
                setIsLoading(false);
                return;
              }
              
              // Appeler la fonction de callback avec les pièces et les statistiques
              onImportComplete(importedPieces, {
                total: results.data.length,
                imported: importedPieces.length,
                skipped: skippedRows
              });
              
              // Fermer la boîte de dialogue
              onClose();
            } catch (error) {
              console.error("Erreur lors du traitement des données CSV:", error);
              setError(`Erreur lors du traitement: ${error.message}`);
            } finally {
              setIsLoading(false);
            }
          },
          error: (parseError) => {
            console.error("Erreur lors du parsing CSV:", parseError);
            setError(`Erreur lors de l'analyse du fichier: ${parseError.message}`);
            setIsLoading(false);
          }
        });
      };
      
      reader.onerror = () => {
        setError('Erreur lors de la lecture du fichier');
        setIsLoading(false);
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error("Erreur lors de l'import:", error);
      setError(`Erreur: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleExportTemplate = () => {
    // Créer un modèle CSV avec toutes les colonnes possibles
    const headers = [
      "Description",
      "Largeur",
      "Longueur",
      "Épaisseur",
      "Quantité",
      "Matériau",
      "Fil",
      "SensFil",
      "ChantAvant",
      "ChantArrière",
      "ChantGauche",
      "ChantDroit",
      "Priorité"
    ].join(';');
    
    // Exemples avec différentes configurations de chants
    const examples = [
      "Étagère;500;800;18;2;Hêtre;Oui;length;CH001;CH001;CH001;CH001;Normal",
      "Porte;400;700;19;1;Chêne;Oui;length;CH002;CH002;;Haute",
      "Côté gauche;400;1200;18;1;Hêtre;Non;;CH001;;;CH001;Normal",
      "Côté droit;400;1200;18;1;Hêtre;Non;;;;CH001;CH001;Basse"
    ];
    
    // Assembler le contenu CSV
    const csvContent = [headers, ...examples].join('\n');
    
    // Créer un objet Blob et un lien de téléchargement
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'modele_pieces.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Importer des pièces depuis un fichier CSV</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Sélectionnez un fichier CSV contenant la liste des pièces à importer. Le fichier doit contenir au minimum les colonnes "Largeur" et "Longueur".
        </DialogContentText>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadIcon />}
            sx={{ mb: 2 }}
          >
            Sélectionner un fichier CSV
            <input
              type="file"
              accept=".csv"
              hidden
              onChange={handleFileChange}
            />
          </Button>
          
          <Button
            variant="text"
            onClick={handleExportTemplate}
            sx={{ ml: 2 }}
          >
            Télécharger un modèle CSV
          </Button>
          
          {file && (
            <Typography variant="body2" sx={{ ml: 1 }}>
              Fichier sélectionné: <Chip label={file.name} size="small" />
            </Typography>
          )}
        </Box>
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="default-material-label">Matériau par défaut</InputLabel>
          <Select
            labelId="default-material-label"
            value={defaultMaterialId}
            onChange={(e) => setDefaultMaterialId(e.target.value)}
            label="Matériau par défaut"
          >
            <MenuItem value="">
              <em>Aucun</em>
            </MenuItem>
            {materials.map((material) => (
              <MenuItem key={material.id} value={material.id}>
                {material.description || `Matériau #${material.id}`} ({material.thickness}mm)
              </MenuItem>
            ))}
          </Select>
          <Typography variant="caption" color="text.secondary">
            Ce matériau sera utilisé pour les pièces qui n'ont pas de matériau spécifié dans le CSV
          </Typography>
        </FormControl>
        
        <FormControlLabel
          control={
            <Switch
              checked={importWithEdges}
              onChange={(e) => setImportWithEdges(e.target.checked)}
              color="primary"
            />
          }
          label="Importer les chants"
          sx={{ mb: 2, display: 'block' }}
        />
        
        {previewData && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Aperçu du fichier:
            </Typography>
            <Box 
              sx={{ 
                p: 1, 
                bgcolor: '#f5f5f5', 
                borderRadius: 1, 
                overflowX: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }}
            >
              {previewData.map((line, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    borderBottom: index === 0 ? '1px solid #ddd' : 'none',
                    fontWeight: index === 0 ? 'bold' : 'normal',
                    py: 0.5
                  }}
                >
                  {line}
                </Box>
              ))}
              {previewData.length > 5 && (
                <Box sx={{ py: 0.5, color: '#999' }}>...</Box>
              )}
            </Box>
          </Box>
        )}
        
        {isLoading && <LinearProgress sx={{ mt: 2 }} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button 
          onClick={handleImport} 
          variant="contained" 
          disabled={!file || isLoading}
        >
          Importer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportCSVDialog;