import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardActions, 
  Grid, 
  IconButton, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel, 
  Chip,
  Menu,
  CircularProgress,
  Snackbar,
  Alert,
  InputAdornment,
  DialogContentText
} from '@mui/material';
import { 
  Add as AddIcon, 
  Search as SearchIcon, 
  FilterList as FilterIcon, 
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ContentCopy as DuplicateIcon,
  Bookmark as BookmarkIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  where, 
  writeBatch
} from 'firebase/firestore';
import { db } from '../services/firebase';

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client: '',
    deadline: '',
  });
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Construire la requête de base
      let projectsQuery = collection(db, 'projects');
      
      // Ajouter le tri
      projectsQuery = query(projectsQuery, orderBy(sortBy, 'desc'));
      
      // Ajouter le filtre par statut si nécessaire
      if (filterStatus !== 'all') {
        projectsQuery = query(projectsQuery, where('status', '==', filterStatus));
      }
      
      const snapshot = await getDocs(projectsQuery);
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      showAlert('Erreur lors du chargement des projets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      setLoading(true);
      
      const newProject = {
        ...formData,
        status: 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        efficiency: 0,
        totalPieces: 0,
        completedPieces: 0
      };
      
      const docRef = await addDoc(collection(db, 'projects'), newProject);
      
      // Rediriger vers la page de détail du nouveau projet
      navigate(`/projects/${docRef.id}`);
      
      showAlert('Projet créé avec succès', 'success');
    } catch (error) {
      console.error('Error creating project:', error);
      showAlert('Erreur lors de la création du projet', 'error');
    } finally {
      setLoading(false);
      setCreateDialogOpen(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    
    try {
      setLoading(true);
      
      // Utiliser un batch pour les opérations multiples
      const batch = writeBatch(db);
      
      // 1. Supprimer toutes les pièces du projet
      try {
        // Vérifier si la collection project_pieces/projectId/pieces existe
        const piecesRef = collection(db, 'project_pieces', selectedProject.id, 'pieces');
        const piecesSnapshot = await getDocs(piecesRef);
        
        piecesSnapshot.docs.forEach((pieceDoc) => {
          batch.delete(pieceDoc.ref);
        });
        
        console.log(`${piecesSnapshot.docs.length} pièces trouvées pour suppression`);
      } catch (error) {
        console.warn(`Aucune pièce trouvée pour le projet ${selectedProject.id} ou erreur:`, error);
      }
      
      // 2. Supprimer tous les plans de découpe du projet
      try {
        const plansQuery = query(collection(db, 'cutting_plans'), where('projectId', '==', selectedProject.id));
        const plansSnapshot = await getDocs(plansQuery);
        
        plansSnapshot.docs.forEach((planDoc) => {
          batch.delete(planDoc.ref);
        });
        
        console.log(`${plansSnapshot.docs.length} plans de découpe trouvés pour suppression`);
      } catch (error) {
        console.warn(`Aucun plan de découpe trouvé pour le projet ${selectedProject.id} ou erreur:`, error);
      }
      
      // 3. Supprimer le projet lui-même
      batch.delete(doc(db, 'projects', selectedProject.id));
      
      // Exécuter le batch
      await batch.commit();
      
      // Mettre à jour l'état local
      setProjects(projects.filter(p => p.id !== selectedProject.id));
      
      showAlert('Projet et données associées supprimés avec succès', 'success');
    } catch (error) {
      console.error('Error deleting project:', error);
      showAlert(`Erreur lors de la suppression du projet: ${error.message}`, 'error');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setSelectedProject(null);
    }
  };

  const handleDuplicateProject = async (project) => {
    try {
      setLoading(true);
      
      const newProject = {
        name: `${project.name} (copie)`,
        description: project.description,
        client: project.client,
        deadline: project.deadline,
        status: 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        efficiency: 0,
        totalPieces: 0,
        completedPieces: 0
      };
      
      const docRef = await addDoc(collection(db, 'projects'), newProject);
      
      // Mettre à jour l'état local
      setProjects([...projects, { id: docRef.id, ...newProject }]);
      
      showAlert('Projet dupliqué avec succès', 'success');
    } catch (error) {
      console.error('Error duplicating project:', error);
      showAlert('Erreur lors de la duplication du projet', 'error');
    } finally {
      setLoading(false);
      handleCloseMenu();
    }
  };

  const handleChangeFormData = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleOpenMenu = (event, project) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setSelectedProject(null);
  };

  const handleOpenCreateDialog = () => {
    setFormData({
      name: '',
      description: '',
      client: '',
      deadline: ''
    });
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
  };

  const handleOpenDeleteDialog = (project) => {
    setSelectedProject(project);
    setDeleteDialogOpen(true);
    handleCloseMenu();
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedProject(null);
  };

  const showAlert = (message, severity) => {
    setAlertInfo({
      open: true,
      message,
      severity
    });
  };

  const handleCloseAlert = () => {
    setAlertInfo({
      ...alertInfo,
      open: false
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return { color: 'default', icon: null };
      case 'in_progress':
        return { color: 'primary', icon: null };
      case 'optimized':
        return { color: 'success', icon: <CheckCircleIcon /> };
      case 'issue':
        return { color: 'error', icon: <WarningIcon /> };
      default:
        return { color: 'default', icon: null };
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'in_progress':
        return 'En cours';
      case 'optimized':
        return 'Optimisé';
      case 'issue':
        return 'Problème';
      default:
        return 'Inconnu';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    // Convertir le timestamp Firestore en Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getFilteredProjects = () => {
    return projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.client && project.client.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (filterStatus === 'all') {
        return matchesSearch;
      }
      
      return matchesSearch && project.status === filterStatus;
    });
  };

  const filteredProjects = getFilteredProjects();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Mes Projets
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Nouveau Projet
        </Button>
      </Box>
      
      <Box sx={{ display: 'flex', mb: 3, gap: 2 }}>
        <TextField
          placeholder="Rechercher un projet..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="filter-status-label">Statut</InputLabel>
          <Select
            labelId="filter-status-label"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            label="Statut"
          >
            <MenuItem value="all">Tous les statuts</MenuItem>
            <MenuItem value="draft">Brouillon</MenuItem>
            <MenuItem value="in_progress">En cours</MenuItem>
            <MenuItem value="optimized">Optimisé</MenuItem>
            <MenuItem value="issue">Problème</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="sort-by-label">Trier par</InputLabel>
          <Select
            labelId="sort-by-label"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              fetchProjects(); // Recharger avec le nouveau tri
            }}
            label="Trier par"
          >
            <MenuItem value="updatedAt">Dernière modification</MenuItem>
            <MenuItem value="createdAt">Date de création</MenuItem>
            <MenuItem value="name">Nom</MenuItem>
            <MenuItem value="client">Client</MenuItem>
            <MenuItem value="deadline">Date limite</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredProjects.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            Aucun projet trouvé
          </Typography>
          <Typography color="textSecondary">
            Créez un nouveau projet ou modifiez vos critères de recherche
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredProjects.map((project) => {
            const statusInfo = getStatusColor(project.status);
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={project.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" component="h2" noWrap sx={{ mb: 1 }}>
                        {project.name}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => handleOpenMenu(e, project)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {project.description || 'Aucune description'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Chip 
                        label={getStatusLabel(project.status)} 
                        color={statusInfo.color} 
                        size="small"
                        icon={statusInfo.icon}
                      />
                      {project.starred && (
                        <BookmarkIcon color="primary" sx={{ ml: 1 }} fontSize="small" />
                      )}
                    </Box>
                    
                    {project.client && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Client:</strong> {project.client}
                      </Typography>
                    )}
                    
                    {project.deadline && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Échéance:</strong> {project.deadline}
                      </Typography>
                    )}
                    
                    {project.totalPieces > 0 && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Pièces:</strong> {project.completedPieces || 0}/{project.totalPieces}
                      </Typography>
                    )}
                    
                    {project.efficiency > 0 && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Efficacité:</strong> {project.efficiency}%
                      </Typography>
                    )}
                    
                    <Typography variant="caption" color="text.secondary" display="block">
                      Modifié le {formatDate(project.updatedAt)}
                    </Typography>
                  </CardContent>
                  
                  <CardActions>
                    <Button 
                      size="small" 
                      component={Link} 
                      to={`/projects/${project.id}`}
                    >
                      Ouvrir
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
      
      {/* Menu contextuel pour les actions sur un projet */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem 
          component={Link} 
          to={selectedProject ? `/projects/${selectedProject.id}` : '#'}
          onClick={handleCloseMenu}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Modifier
        </MenuItem>
        <MenuItem onClick={() => selectedProject && handleDuplicateProject(selectedProject)}>
          <DuplicateIcon fontSize="small" sx={{ mr: 1 }} />
          Dupliquer
        </MenuItem>
        <MenuItem onClick={() => selectedProject && handleOpenDeleteDialog(selectedProject)}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Supprimer
        </MenuItem>
      </Menu>
      
      {/* Dialogue de création de projet */}
      <Dialog open={createDialogOpen} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Nouveau Projet</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Nom du projet"
            type="text"
            fullWidth
            value={formData.name}
            onChange={handleChangeFormData}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={handleChangeFormData}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="client"
            label="Client"
            type="text"
            fullWidth
            value={formData.client}
            onChange={handleChangeFormData}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="deadline"
            label="Date limite"
            type="date"
            fullWidth
            value={formData.deadline}
            onChange={handleChangeFormData}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Annuler</Button>
          <Button 
            onClick={handleCreateProject} 
            variant="contained" 
            color="primary"
            disabled={!formData.name || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialogue de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer le projet "{selectedProject?.name}" ?
            Cette action supprimera également toutes les pièces et les plans de découpe associés.
            Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Annuler</Button>
          <Button 
            onClick={handleDeleteProject} 
            color="error"
            startIcon={loading ? null : <DeleteIcon />}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notifications */}
      <Snackbar 
        open={alertInfo.open} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity={alertInfo.severity}>
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Projects;