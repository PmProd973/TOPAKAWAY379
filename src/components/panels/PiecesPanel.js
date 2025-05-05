import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText, // Ajoutez cette ligne
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Tooltip,
  Grid,
  CircularProgress,
  Backdrop,
  TablePagination,
  Chip,
  InputAdornment,
  Divider,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  writeBatch,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import Papa from 'papaparse';

// Import le nouveau composant de sélection des chants
import EdgingSelectors from './EdgingSelectors';

const PiecesPanel = ({ projectId }) => {
  // États
  const [pieces, setPieces] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [edgings, setEdgings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });

  // Données de formulaire
  const [formData, setFormData] = useState({
    description: '',
    quantity: 1,
    length: '',
    width: '',
    thickness: '',
    materialId: '',
    hasGrain: false,
    grainDirection: 'length',
    edgingFront: '',
    edgingBack: '',
    edgingLeft: '',
    edgingRight: '',
    priority: 'normal'
  });

  // Charger les données au chargement du composant
  useEffect(() => {
    fetchData();
  }, [projectId]);

  // Fonction pour charger les données depuis Firebase
  const fetchData = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      console.log("Chargement des données pour le projet:", projectId);

      // Récupérer les matériaux disponibles
      const materialsQuery = query(
        collection(db, 'materials'),
        orderBy('description')
      );
      const materialsSnapshot = await getDocs(materialsQuery);
      const materialsData = materialsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMaterials(materialsData);
      console.log("Matériaux chargés:", materialsData);

      // Récupérer les chants disponibles
      const edgingsQuery = query(
        collection(db, 'edgings'),
        orderBy('description')
      );
      const edgingsSnapshot = await getDocs(edgingsQuery);
      
      // Log pour débogage
      console.log("Données brutes des chants:", edgingsSnapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data()
      })));
      
      // Traitement amélioré des chants
      const edgingsData = edgingsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Normaliser les propriétés importantes
          height: parseFloat(data.height || data.hauteur || 0),
          thickness: parseFloat(data.thickness || data.epaisseur || 0),
          // S'assurer que toutes les propriétés requises existent
          description: data.description || '',
          type: data.type || '',
          stock: parseFloat(data.stock || 0),
          pricePerMeter: parseFloat(data.pricePerMeter || 0)
        };
      });
      
      setEdgings(edgingsData);
      console.log("Chants après traitement:", edgingsData);

      // Récupérer les pièces du projet
      const piecesRef = collection(db, 'project_pieces', projectId, 'pieces');
      const piecesSnapshot = await getDocs(piecesRef);
      const piecesData = piecesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPieces(piecesData);
      console.log("Pièces chargées:", piecesData);

      setDataLoaded(true);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      setNotification({
        show: true,
        message: `Erreur: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Gestionnaire d'ouverture du formulaire d'ajout/édition
  const handleOpenDialog = useCallback((piece = null) => {
    // Vérifier que les données sont chargées
    if (!dataLoaded) {
      console.warn("Impossible d'ouvrir le formulaire: les données ne sont pas encore chargées");
      return;
    }

    if (piece) {
      // Mode édition
      console.log("Ouverture du formulaire en mode édition:", piece);
      setSelectedPiece(piece);
      setFormData({
        description: piece.description || '',
        quantity: piece.quantity || 1,
        length: piece.length || '',
        width: piece.width || '',
        thickness: piece.thickness || '',
        materialId: piece.materialId || '',
        hasGrain: piece.hasGrain || false,
        grainDirection: piece.grainDirection || 'length',
        edgingFront: piece.edgingFront || '',
        edgingBack: piece.edgingBack || '',
        edgingLeft: piece.edgingLeft || '',
        edgingRight: piece.edgingRight || '',
        priority: piece.priority || 'normal'
      });
    } else {
      // Mode ajout
      console.log("Ouverture du formulaire en mode ajout");
      setSelectedPiece(null);
      
      // Valeurs par défaut
      const defaultMaterialId = materials.length > 0 ? materials[0].id : '';
      const defaultThickness = defaultMaterialId && materials.length > 0 
        ? materials.find(m => m.id === defaultMaterialId)?.thickness || '' 
        : '';
      
      setFormData({
        description: '',
        quantity: 1,
        length: '',
        width: '',
        thickness: defaultThickness,
        materialId: defaultMaterialId,
        hasGrain: false,
        grainDirection: 'length',
        edgingFront: '',
        edgingBack: '',
        edgingLeft: '',
        edgingRight: '',
        priority: 'normal'
      });
    }
    
    setOpenDialog(true);
  }, [dataLoaded, materials]);

  // Fermer le formulaire
  const handleCloseDialog = () => {
    if (loading) return; // Ne pas fermer si en cours de chargement
    setOpenDialog(false);
  };

  // Changement de valeur dans le formulaire
  const handleFormChange = (e) => {
    const { name, value, checked, type } = e.target;
    
    // Utiliser checked pour les switches, value pour le reste
    const newValue = type === 'checkbox' ? checked : value;
    
    // Gestion spéciale pour le matériau (mise à jour automatique de l'épaisseur)
    if (name === 'materialId' && value) {
      const selectedMaterial = materials.find(m => m.id === value);
      if (selectedMaterial) {
        setFormData(prev => ({
          ...prev,
          [name]: newValue,
          thickness: selectedMaterial.thickness || ''
        }));
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Validation des données
      if (!formData.description || !formData.length || !formData.width || !formData.materialId) {
        setNotification({
          show: true,
          message: 'Veuillez remplir tous les champs obligatoires',
          type: 'error'
        });
        setLoading(false);
        return;
      }
      
      // Convertir les valeurs numériques
      const pieceData = {
        ...formData,
        quantity: Number(formData.quantity) || 1,
        length: Number(formData.length) || 0,
        width: Number(formData.width) || 0,
        thickness: Number(formData.thickness) || 0,
        updatedAt: serverTimestamp()
      };
      
      if (selectedPiece) {
        // Mise à jour d'une pièce existante
        await updateDoc(doc(db, 'project_pieces', projectId, 'pieces', selectedPiece.id), pieceData);
        
        // Mettre à jour l'état local
        const updatedPieces = pieces.map(p => 
          p.id === selectedPiece.id ? { ...pieceData, id: p.id } : p
        );
        setPieces(updatedPieces);
        
        setNotification({
          show: true,
          message: 'Pièce modifiée avec succès',
          type: 'success'
        });
      } else {
        // Ajout d'une nouvelle pièce
        pieceData.createdAt = serverTimestamp();
        
        const docRef = await addDoc(collection(db, 'project_pieces', projectId, 'pieces'), pieceData);
        
        // Ajouter la pièce à l'état local
        const newPiece = { id: docRef.id, ...pieceData };
        setPieces([...pieces, newPiece]);
        
        setNotification({
          show: true,
          message: 'Pièce ajoutée avec succès',
          type: 'success'
        });
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la pièce:", error);
      setNotification({
        show: true,
        message: `Erreur: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Suppression d'une pièce
  const handleDeletePiece = async () => {
    if (!selectedPiece) return;
    
    try {
      setLoading(true);
      
      // Supprimer de Firestore
      await deleteDoc(doc(db, 'project_pieces', projectId, 'pieces', selectedPiece.id));
      
      // Mettre à jour l'état local
      const updatedPieces = pieces.filter(p => p.id !== selectedPiece.id);
      setPieces(updatedPieces);
      
      setNotification({
        show: true,
        message: 'Pièce supprimée avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de la pièce:", error);
      setNotification({
        show: true,
        message: `Erreur: ${error.message}`,
        type: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setLoading(false);
    }
  };

  // Duplication d'une pièce
  const handleDuplicatePiece = async (piece) => {
    try {
      setLoading(true);
      
      // Préparer les données de la nouvelle pièce
      const { id, createdAt, updatedAt, ...pieceData } = piece;
      
      const newPieceData = {
        ...pieceData,
        description: `${pieceData.description} (copie)`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Ajouter à Firestore
      const docRef = await addDoc(collection(db, 'project_pieces', projectId, 'pieces'), newPieceData);
      
      // Ajouter la pièce à l'état local
      const newPiece = { id: docRef.id, ...newPieceData };
      setPieces([...pieces, newPiece]);
      
      setNotification({
        show: true,
        message: 'Pièce dupliquée avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error("Erreur lors de la duplication de la pièce:", error);
      setNotification({
        show: true,
        message: `Erreur: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fonction améliorée pour gérer l'import CSV
  const handleImportComplete = async (importedPieces, stats) => {
    try {
      setLoading(true);
      
      // Utiliser une opération par lots pour ajouter toutes les pièces
      const batch = writeBatch(db);
      const newPieces = [];
      
      for (const pieceData of importedPieces) {
        // Ajouter les timestamps
        const completeData = {
          ...pieceData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        // Créer une référence pour le nouveau document
        const newDocRef = doc(collection(db, 'project_pieces', projectId, 'pieces'));
        batch.set(newDocRef, completeData);
        
        // Ajouter à la liste locale (avec ID temporaire)
        newPieces.push({
          id: newDocRef.id,
          ...completeData
        });
      }
      
      // Exécuter le batch
      await batch.commit();
      
      // Mettre à jour l'état local
      setPieces([...pieces, ...newPieces]);
      
      setNotification({
        show: true,
        message: `Import réussi: ${stats.imported} pièces importées (${stats.skipped} ignorées)`,
        type: 'success'
      });
      
      // Fermer automatiquement la notification après 5 secondes
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
      
    } catch (error) {
      console.error("Erreur lors de l'import des pièces:", error);
      setNotification({
        show: true,
        message: `Erreur lors de l'import: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fonctions utilitaires
  const getMaterialInfo = (materialId) => {
    const material = materials.find(m => m.id === materialId);
    return material ? `${material.description} (${material.thickness}mm)` : 'Non défini';
  };

  // Filtrage des pièces
  const filteredPieces = pieces.filter(piece =>
    piece.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getMaterialInfo(piece.materialId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const paginatedPieces = filteredPieces.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Composant amélioré pour l'import CSV
  const ImportCSVDialog = ({ open, onClose, onImportComplete }) => {
    const [file, setFile] = useState(null);
    const [defaultMaterialId, setDefaultMaterialId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [importWithEdges, setImportWithEdges] = useState(true);
    
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
            dynamicTyping: false,
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
                  width: headers.findIndex(h => /^(largeur|width|l|larg)$/i.test(h)),
                  length: headers.findIndex(h => /^(longueur|length|long|lg)$/i.test(h)),
                  thickness: headers.findIndex(h => /^(épaisseur|epaisseur|thickness|ep)$/i.test(h)),
                  quantity: headers.findIndex(h => /^(quantité|quantity|qté|qte|qty|q)$/i.test(h)),
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
        "Quantité",
        "Longueur",
        "Largeur",
        "Épaisseur",
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
        "TABLETTE;3;562;600;19;Hêtre;Non;;CH001;CH001;CH001;CH001;Normal",
        "MOD_UNI;3;562;600;19;Hêtre;Non;;CH001;CH001;CH001;CH001;Normal",
        "MOD_FIL;3;662;600;19;Hêtre;Oui;length;CH001;CH001;CH001;CH001;Normal",
        "MOD_FIL;3;762;600;19;Hêtre;Oui;length;CH001;CH001;CH001;CH001;Normal",
               
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

  // Rendu du composant
  return (
    <Box sx={{ width: '100%' }}>
      {/* Barre d'outils */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <TextField
          label="Rechercher"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ minWidth: '250px' }}
        />
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setImportDialogOpen(true)}
            disabled={loading || !dataLoaded}
          >
            Importer CSV
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={loading || !dataLoaded}
          >
            Ajouter une pièce
          </Button>
        </Box>
      </Box>
      
      {/* Tableau des pièces */}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} size="small">
          <TableHead>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell align="right">Qté</TableCell>
              <TableCell align="right">L (mm)</TableCell>
              <TableCell align="right">l (mm)</TableCell>
              <TableCell>Matériau</TableCell>
              <TableCell>Fil</TableCell>
              <TableCell>Chants</TableCell>
              <TableCell>Priorité</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedPieces.length > 0 ? (
              paginatedPieces.map((piece) => (
                <TableRow key={piece.id} hover>
                  <TableCell>{piece.description}</TableCell>
                  <TableCell align="right">{piece.quantity}</TableCell>
                  <TableCell align="right">{piece.length}</TableCell>
                  <TableCell align="right">{piece.width}</TableCell>
                  <TableCell>{getMaterialInfo(piece.materialId)}</TableCell>
                  <TableCell>
                    {piece.hasGrain ? (
                      <Chip 
                        size="small"
                        label={piece.grainDirection === 'length' ? 'Longueur' : 'Largeur'} 
                        color="primary" 
                        variant="outlined" 
                      />
                    ) : 'Non'}
                  </TableCell>
                  <TableCell>
                    {[
                      piece.edgingFront && 'Avant',
                      piece.edgingBack && 'Arrière',
                      piece.edgingLeft && 'Gauche',
                      piece.edgingRight && 'Droite'
                    ].filter(Boolean).join(', ') || 'Aucun'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      size="small"
                      label={piece.priority === 'high' ? 'Haute' : piece.priority === 'low' ? 'Basse' : 'Normale'} 
                      color={piece.priority === 'high' ? 'error' : piece.priority === 'low' ? 'default' : 'primary'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Modifier">
                      <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={() => handleOpenDialog(piece)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Dupliquer">
                      <IconButton 
                        size="small" 
                        color="secondary" 
                        onClick={() => handleDuplicatePiece(piece)}
                      >
                        <DuplicateIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Supprimer">
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => {
                          setSelectedPiece(piece);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  {loading ? 'Chargement...' : 'Aucune pièce trouvée'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Pagination */}
      {filteredPieces.length > 0 && (
        <TablePagination
          component="div"
          count={filteredPieces.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
        />
      )}
      
      {/* Dialogue d'ajout/édition de pièce */}
      {openDialog && (
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          disableEscapeKeyDown={loading}
        >
          <DialogTitle>
            {selectedPiece ? 'Modifier la pièce' : 'Ajouter une pièce'}
          </DialogTitle>
          
          <DialogContent dividers>
            <Grid container spacing={2}>
              {/* Informations générales */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Informations générales
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  margin="dense"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Quantité"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleFormChange}
                  margin="dense"
                  inputProps={{ min: 1 }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Longueur (mm)"
                  name="length"
                  type="number"
                  value={formData.length}
                  onChange={handleFormChange}
                  margin="dense"
                  inputProps={{ min: 1 }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Largeur (mm)"
                  name="width"
                  type="number"
                  value={formData.width}
                  onChange={handleFormChange}
                  margin="dense"
                  inputProps={{ min: 1 }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Épaisseur (mm)"
                  name="thickness"
                  type="number"
                  value={formData.thickness}
                  onChange={handleFormChange}
                  margin="dense"
                  inputProps={{ min: 1 }}
                  disabled // L'épaisseur est déterminée par le matériau
                />
              </Grid>
              
              {/* Matériau et fil du bois */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Matériau
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="dense">
                  <InputLabel id="material-label">Matériau</InputLabel>
                  <Select
                    labelId="material-label"
                    name="materialId"
                    value={formData.materialId}
                    onChange={handleFormChange}
                    label="Matériau"
                  >
                    {materials.map((material) => (
                      <MenuItem key={material.id} value={material.id}>
                        {material.description} ({material.thickness}mm)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.hasGrain}
                      onChange={handleFormChange}
                      name="hasGrain"
                    />
                  }
                  label="Présence de fil du bois"
                />
                
                {formData.hasGrain && (
                  <FormControl fullWidth margin="dense">
                    <InputLabel id="grain-direction-label">Orientation du fil</InputLabel>
                    <Select
                      labelId="grain-direction-label"
                      name="grainDirection"
                      value={formData.grainDirection}
                      onChange={handleFormChange}
                      label="Orientation du fil"
                    >
                      <MenuItem value="length">Sens de la longueur</MenuItem>
                      <MenuItem value="width">Sens de la largeur</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Grid>
              
              {/* Placage de chant */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Placage de chant
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                {/* Utilisation du composant dédié pour les sélecteurs de chants */}
                <EdgingSelectors 
                  formData={formData}
                  edgings={edgings}
                  onChange={handleFormChange}
                  showVisualization={true}
                />
              </Grid>
              
              {/* Priorité */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Options d'optimisation
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth margin="dense">
                  <InputLabel id="priority-label">Priorité</InputLabel>
                  <Select
                    labelId="priority-label"
                    name="priority"
                    value={formData.priority}
                    onChange={handleFormChange}
                    label="Priorité"
                  >
                    <MenuItem value="high">Haute - Placer en premier</MenuItem>
                    <MenuItem value="normal">Normale</MenuItem>
                    <MenuItem value="low">Basse - Placer en dernier</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions>
            <Button 
              onClick={handleCloseDialog} 
              disabled={loading}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Enregistrer'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
      
      {/* Dialogue de confirmation de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer la pièce "{selectedPiece?.description}" ?
            Cette action ne peut pas être annulée.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            disabled={loading}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleDeletePiece} 
            variant="contained" 
            color="error" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialogue d'import CSV amélioré */}
      <ImportCSVDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImportComplete={handleImportComplete}
      />
      
      {/* Indicateur de chargement global */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      
      {/* Notifications */}
      {notification.show && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 2000,
            bgcolor: notification.type === 'error' ? 'error.main' : 
                    notification.type === 'success' ? 'success.main' : 'info.main',
            color: 'white',
            py: 1,
            px: 2,
            borderRadius: 1,
            boxShadow: 3,
          }}
        >
          <Typography>{notification.message}</Typography>
        </Box>
      )}
    </Box>
  );
};

export default PiecesPanel;