import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Paper,
  Divider,
  Grid,
  Chip,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Snackbar,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  DeleteOutline as DeleteIcon,
  ContentCopy as DuplicateIcon,
  Share as ShareIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  writeBatch,
  updateDoc, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

// Importation des composants de panneau spécifiques
import PiecesPanel from '../components/panels/PiecesPanel';
import OptimizationPanel from '../components/panels/OptimizationPanel';
import LabelDesigner from '../components/labels/LabelDesigner';
import FurnitureDesigner from '../components/furniture3d/FurnitureDesigner';

// Composants pour les autres onglets
const MaterialsTab = ({ projectId, materials }) => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Matériaux utilisés</Typography>
      {materials && materials.length > 0 ? (
        <Grid container spacing={2}>
          {materials.map((material, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1">{material.description}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Code: {material.code}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Dimensions: {material.length}×{material.width}×{material.thickness} mm
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Fil: {material.hasGrain ? 'Oui' : 'Non'}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Aucun matériau n'a encore été ajouté à ce projet.
        </Typography>
      )}
    </Box>
  );
};

const ReportsTab = ({ projectId, optimizationResult }) => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Rapports</Typography>
      
      {!optimizationResult ? (
        <Typography variant="body2" color="text.secondary">
          Veuillez d'abord exécuter une optimisation pour générer des rapports.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Résumé du projet</Typography>
              <Typography variant="body2">
                Nombre total de pièces: <strong>XX</strong>
              </Typography>
              <Typography variant="body2">
                Surface totale: <strong>XX m²</strong>
              </Typography>
              <Typography variant="body2">
                Coût estimé des matériaux: <strong>{optimizationResult.summary?.totalCost || '0.00'} €</strong>
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Statistiques d'optimisation</Typography>
              <Typography variant="body2">
                Efficacité globale: <strong>{optimizationResult.summary?.efficiency || '0.00'}%</strong>
              </Typography>
              <Typography variant="body2">
                Panneaux utilisés: <strong>{optimizationResult.summary?.totalPanels || '0'}</strong>
              </Typography>
              <Typography variant="body2">
                Chutes réutilisables: <strong>{optimizationResult.summary?.reusableOffcuts || '0'}</strong>
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Détail des coûts</Typography>
              <Typography variant="body2" paragraph>
                Un rapport détaillé pourrait être généré ici, montrant la répartition des coûts par matériau,
                le coût par pièce, etc.
              </Typography>
              <Button variant="outlined">Générer un rapport détaillé</Button>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [project, setProject] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    clientName: '',
    notes: ''
  });

  useEffect(() => {
    async function fetchProjectData() {
      try {
        setLoading(true);
        
        // Récupérer les données du projet depuis Firestore
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (!projectDoc.exists()) {
          setNotification({
            open: true,
            message: "Projet introuvable",
            severity: "error"
          });
          navigate('/projects', { replace: true });
          return;
        }
        
        const projectData = { id: projectDoc.id, ...projectDoc.data() };
        setProject(projectData);
        setEditForm({
          name: projectData.name || '',
          description: projectData.description || '',
          clientName: projectData.clientName || '',
          notes: projectData.notes || ''
        });
        
        // Récupérer les pièces du projet
        const piecesSnapshot = await getDocs(collection(db, 'project_pieces', projectId, 'pieces'));
        const piecesData = piecesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPieces(piecesData);
        
        // Récupérer tous les matériaux disponibles
        const materialsSnapshot = await getDocs(collection(db, 'materials'));
        const materialsData = materialsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMaterials(materialsData);
        
      } catch (error) {
        console.error("Erreur lors de la récupération des données du projet:", error);
        setNotification({
          open: true,
          message: "Erreur lors du chargement du projet",
          severity: "error"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchProjectData();
  }, [projectId, navigate]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      
      // Supprimer toutes les pièces du projet
      const piecesRef = collection(db, 'project_pieces', projectId, 'pieces');
      const piecesSnapshot = await getDocs(piecesRef);
      
      const batch = writeBatch(db);
      piecesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // Supprimer le document du projet
      batch.delete(doc(db, 'projects', projectId));
      
      // Exécuter le batch
      await batch.commit();
      
      setNotification({
        open: true,
        message: "Projet supprimé avec succès",
        severity: "success"
      });
      
      navigate('/projects', { replace: true });
    } catch (error) {
      console.error("Erreur lors de la suppression du projet:", error);
      setNotification({
        open: true,
        message: "Erreur lors de la suppression du projet",
        severity: "error"
      });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleEditClick = () => {
    setEditDialogOpen(true);
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    // Réinitialiser le formulaire avec les valeurs actuelles du projet
    setEditForm({
      name: project.name || '',
      description: project.description || '',
      clientName: project.clientName || '',
      notes: project.notes || ''
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: value
    });
  };

  const handleSaveProject = async () => {
    try {
      setLoading(true);
      
      // Mettre à jour le document du projet
      await updateDoc(doc(db, 'projects', projectId), {
        name: editForm.name,
        description: editForm.description,
        clientName: editForm.clientName,
        notes: editForm.notes,
        updatedAt: serverTimestamp()
      });
      
      // Mettre à jour l'état local
      setProject({
        ...project,
        name: editForm.name,
        description: editForm.description,
        clientName: editForm.clientName,
        notes: editForm.notes,
        updatedAt: new Date().toISOString() // Pour l'affichage immédiat
      });
      
      setNotification({
        open: true,
        message: "Projet mis à jour avec succès",
        severity: "success"
      });
      
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du projet:", error);
      setNotification({
        open: true,
        message: "Erreur lors de la mise à jour du projet",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };
// Fonction améliorée pour dupliquer un projet avec ses pièces
const handleDuplicateProject = async () => {
  if (!project) return;
  
  try {
    setLoading(true);
    
    // Créer un objet avec uniquement des champs valides
    const projectData = {
      name: `${project.name} (copie)`,
      description: project.description || '',
      status: 'draft',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // N'ajouter ces champs que s'ils ont des valeurs définies
    if (project.client) projectData.client = project.client;
    if (project.clientName) projectData.clientName = project.clientName;
    if (project.deadline) projectData.deadline = project.deadline;
    if (project.notes) projectData.notes = project.notes;
    if (project.category) projectData.category = project.category;
    if (project.tags) projectData.tags = project.tags;
    if (project.efficiency) projectData.efficiency = project.efficiency;
    if (project.totalPieces) projectData.totalPieces = project.totalPieces;
    if (project.completedPieces) projectData.completedPieces = project.completedPieces;
    
    // Ajouter le document à Firestore
    const newProjectRef = await addDoc(collection(db, 'projects'), projectData);
    const newProjectId = newProjectRef.id;
    
    // Récupérer et dupliquer les pièces du projet original
    try {
      const piecesRef = collection(db, 'project_pieces', projectId, 'pieces');
      const piecesSnapshot = await getDocs(piecesRef);
      
      if (!piecesSnapshot.empty) {
        // Créer un batch pour les opérations multiples
        const batch = writeBatch(db);
        
        // Dupliquer chaque pièce
        piecesSnapshot.docs.forEach((pieceDoc) => {
          const pieceData = pieceDoc.data();
          const newPieceRef = doc(collection(db, 'project_pieces', newProjectId, 'pieces'));
          
          // Créer un nouvel objet pièce sans les champs undefined
          const newPieceData = {};
          
          // Filtrer les champs undefined
          Object.keys(pieceData).forEach(key => {
            if (pieceData[key] !== undefined) {
              newPieceData[key] = pieceData[key];
            }
          });
          
          // Mettre à jour les timestamps
          newPieceData.createdAt = serverTimestamp();
          newPieceData.updatedAt = serverTimestamp();
          
          // Ajouter la pièce au batch
          batch.set(newPieceRef, newPieceData);
        });
        
        // Exécuter le batch
        await batch.commit();
        
        // Mettre à jour le nombre de pièces dans le projet
        await updateDoc(newProjectRef, {
          totalPieces: piecesSnapshot.size
        });
        
        console.log(`${piecesSnapshot.size} pièces dupliquées avec succès`);
      }
    } catch (error) {
      console.warn("Erreur lors de la duplication des pièces:", error);
      // La duplication continue même si les pièces ne sont pas dupliquées
    }
    
    // Navigation vers le nouveau projet
    navigate(`/projects/${newProjectId}`);
    
    // Afficher une notification de succès
    setNotification({
      show: true,
      message: 'Projet et pièces dupliqués avec succès',
      type: 'success'
    });
    
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  } catch (error) {
    console.error('Erreur lors de la duplication du projet:', error);
    
    setNotification({
      show: true,
      message: `Erreur lors de la duplication: ${error.message}`,
      type: 'error'
    });
    
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  } finally {
    setLoading(false);
  }
};
  const handleShareProject = () => {
    // Logique pour partager le projet (pourrait être implémentée plus tard)
    setNotification({
      open: true,
      message: "Fonctionnalité de partage à venir",
      severity: "info"
    });
  };

  const handleOptimizationResult = (result) => {
    setOptimizationResult(result);
    
    // Mettre à jour le statut du projet si l'optimisation a réussi
    if (result && project) {
      updateDoc(doc(db, 'projects', projectId), {
        status: 'optimized',
        updatedAt: serverTimestamp()
      }).then(() => {
        setProject({
          ...project,
          status: 'optimized',
          updatedAt: new Date().toISOString() // Pour l'affichage immédiat
        });
      }).catch(error => {
        console.error("Erreur lors de la mise à jour du statut du projet:", error);
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'optimized':
        return 'success';
      case 'production':
        return 'info';
      case 'completed':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'optimized':
        return 'Optimisé';
      case 'production':
        return 'En production';
      case 'completed':
        return 'Terminé';
      default:
        return 'Inconnu';
    }
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    let date;
    if (typeof dateString === 'object' && dateString.seconds) {
      // Timestamp Firestore
      date = new Date(dateString.seconds * 1000);
    } else {
      // Date string ISO
      date = new Date(dateString);
    }
    
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  // Fonction pour mettre à jour les pièces
  const handleUpdatePieces = async (updatedPieces) => {
    setPieces(updatedPieces);
    
    // Si nécessaire, mettez à jour les pièces dans Firestore ici
    // Cette fonction peut être passée à PiecesPanel
  };

  if (loading && !project) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ textAlign: 'center', py: 5 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Projet non trouvé
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/projects')}
          sx={{ mt: 2 }}
        >
          Retour aux projets
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Notification */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* En-tête du projet */}
      <Box sx={{ mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/projects')}
          sx={{ mb: 2 }}
        >
          Retour aux projets
        </Button>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {project.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Client: {project.clientName}
            </Typography>
            <Chip 
              label={getStatusText(project.status)} 
              color={getStatusColor(project.status)}
              sx={{ mr: 1 }}
            />
            {optimizationResult && (
              <Chip 
                label={`Efficacité: ${optimizationResult.summary?.efficiency || '0'}%`} 
                color="primary" 
              />
            )}
          </Box>
          
          <Box>
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />}
              onClick={handleEditClick}
              sx={{ mr: 1 }}
            >
              Modifier
            </Button>
            <IconButton onClick={handleShareProject} title="Partager">
              <ShareIcon />
            </IconButton>
            <IconButton onClick={handleDuplicateProject} title="Dupliquer">
              <DuplicateIcon />
            </IconButton>
            <IconButton color="error" onClick={handleDeleteClick} title="Supprimer">
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Informations du projet */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              <strong>Description:</strong> {project.description || 'Aucune description'}
            </Typography>
            {project.notes && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>Notes:</strong> {project.notes}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              <strong>Créé le:</strong> {formatDate(project.createdAt)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Dernière modification:</strong> {formatDate(project.updatedAt)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Nombre de pièces:</strong> {pieces.reduce((acc, piece) => acc + (piece.quantity || 1), 0)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Onglets */}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            aria-label="project tabs"
          >
            <Tab label="Pièces" />
            <Tab label="Matériaux" />
            <Tab label="Optimisation" />
            <Tab label="Étiquettes" /> {/* Nouvel onglet */}
            <Tab label="Conception 3D" /> {/* Nouvel onglet */}
            <Tab label="Rapports" />
          </Tabs>
        </Box>
        <Paper sx={{ mt: 2, p: 0 }}>
          {currentTab === 0 && (
            <PiecesPanel
              projectId={projectId}
              pieces={pieces}
              setPieces={handleUpdatePieces}
              materials={materials}
            />
          )}
          {currentTab === 1 && (
            <MaterialsTab
              projectId={projectId}
              materials={materials}
            />
          )}
          {currentTab === 2 && (
            <OptimizationPanel
              projectId={projectId}
              pieces={pieces}
              materials={materials}
              onOptimizationComplete={handleOptimizationResult}
            />
          )}
          {currentTab === 3 && (
  <LabelDesigner
    projectId={projectId}
    pieces={pieces}
    materials={materials}
    panels={optimizationResult?.panels || []}
  />
)}
{currentTab === 4 && (
  <ReportsTab
    projectId={projectId}
    optimizationResult={optimizationResult}
  />
)}

{currentTab === 4 && (
  <FurnitureDesigner
    projectId={projectId}
    pieces={pieces}
    materials={materials}
  />
)}
{currentTab === 5 && (
  <ReportsTab
    projectId={projectId}
    optimizationResult={optimizationResult}
  />
)}
        </Paper>
      </Box>

      {/* Dialogue de confirmation de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Supprimer le projet
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Êtes-vous sûr de vouloir supprimer définitivement le projet "{project.name}" ?
            Cette action est irréversible et toutes les données associées seront perdues.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue d'édition du projet */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditCancel}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Modifier le projet
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom du projet"
                name="name"
                value={editForm.name}
                onChange={handleEditFormChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom du client"
                name="clientName"
                value={editForm.clientName}
                onChange={handleEditFormChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={editForm.description}
                onChange={handleEditFormChange}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={editForm.notes}
                onChange={handleEditFormChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            startIcon={<CancelIcon />}
            onClick={handleEditCancel}
          >
            Annuler
          </Button>
          <Button 
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveProject}
            disabled={!editForm.name.trim()}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}