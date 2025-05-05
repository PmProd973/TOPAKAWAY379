import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Grid,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

// Composant d'onglet pour les panneaux
function PanelsTab() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const { currentUser } = useAuth();

  // État pour le formulaire d'ajout/édition
  const [formData, setFormData] = useState({
    description: '',
    code: '',
    type: 'panel', // panel, rest
    hasGrain: false,
    length: '',
    width: '',
    thickness: '',
    stock: '',
    pricePerSquareMeter: '',
    lastUsed: null
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const materialsRef = collection(db, 'materials');
      const materialsQuery = query(
        materialsRef,
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(materialsQuery);
      const materialsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // S'assurer que les champs numériques sont bien des nombres
        length: Number(doc.data().length || 0),
        width: Number(doc.data().width || 0),
        thickness: Number(doc.data().thickness || 0),
        stock: Number(doc.data().stock || 0),
        pricePerSquareMeter: Number(doc.data().pricePerSquareMeter || 0),
        surface: Number(doc.data().surface || 0)
      }));
      setMaterials(materialsList);
    } catch (error) {
      console.error("Erreur lors de la récupération des matériaux:", error);
      showNotification("Erreur lors du chargement des matériaux", "error");
    } finally {
      setLoading(false);
    }
  };

  // Afficher une notification
  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  // Fermer la notification
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  // Filtrer les matériaux selon le terme de recherche
  const filteredMaterials = materials.filter(material => 
    material.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Gérer l'ouverture du formulaire (ajout/édition)
  const handleOpenDialog = (material = null) => {
    if (material) {
      setSelectedMaterial(material);
      setFormData({ ...material });
    } else {
      setSelectedMaterial(null);
      setFormData({
        description: '',
        code: '',
        type: 'panel',
        hasGrain: false,
        length: '',
        width: '',
        thickness: '',
        stock: '',
        pricePerSquareMeter: '',
        lastUsed: null
      });
    }
    setOpenDialog(true);
  };

  // Gérer la fermeture du formulaire
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Gérer les changements de champs dans le formulaire
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Convertir les valeurs numériques
      const length = Number(formData.length) || 0;
      const width = Number(formData.width) || 0;
      const thickness = Number(formData.thickness) || 0;
      const stock = Number(formData.stock) || 0;
      const pricePerSquareMeter = Number(formData.pricePerSquareMeter) || 0;
      
      // Calculer la surface en m²
      const surface = (length * width) / 1000000;
      
      const materialData = {
        description: formData.description,
        code: formData.code,
        type: formData.type,
        hasGrain: formData.hasGrain,
        length,
        width,
        thickness,
        stock,
        pricePerSquareMeter,
        surface,
        updatedAt: serverTimestamp(),
        createdBy: currentUser ? currentUser.uid : 'anonymous',
        lastUsed: formData.lastUsed || null
      };
      
      if (selectedMaterial) {
        // Édition d'un matériau existant
        await updateDoc(doc(db, 'materials', selectedMaterial.id), materialData);
        
        // Mettre à jour l'état local
        setMaterials(materials.map(mat => 
          mat.id === selectedMaterial.id ? { ...materialData, id: mat.id } : mat
        ));
        
        showNotification("Matériau modifié avec succès");
      } else {
        // Ajout d'un nouveau matériau
        materialData.createdAt = serverTimestamp();
        
        const docRef = await addDoc(collection(db, 'materials'), materialData);
        const newMaterial = { id: docRef.id, ...materialData };
        
        setMaterials([newMaterial, ...materials]);
        showNotification("Matériau ajouté avec succès");
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du matériau:", error);
      showNotification("Erreur lors de la sauvegarde du matériau", "error");
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir le dialogue de confirmation de suppression
  const handleOpenDeleteDialog = (material) => {
    setSelectedMaterial(material);
    setDeleteDialogOpen(true);
  };

  // Gérer la suppression d'un matériau
  const handleDeleteMaterial = async () => {
    try {
      setLoading(true);
      
      await deleteDoc(doc(db, 'materials', selectedMaterial.id));
      
      // Mettre à jour l'état local
      setMaterials(materials.filter(mat => mat.id !== selectedMaterial.id));
      
      setDeleteDialogOpen(false);
      showNotification("Matériau supprimé avec succès");
    } catch (error) {
      console.error("Erreur lors de la suppression du matériau:", error);
      showNotification("Erreur lors de la suppression du matériau", "error");
    } finally {
      setLoading(false);
    }
  };

  // Formater la date
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    
    // Gérer les timestamps Firestore
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Gestion des panneaux</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={loading}
        >
          Ajouter un panneau
        </Button>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <TextField
          placeholder="Rechercher un matériau..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <Button 
          variant="outlined" 
          startIcon={<FilterListIcon />}
        >
          Filtrer
        </Button>
      </Box>
      
      {loading && materials.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Fil</TableCell>
                <TableCell>Longueur</TableCell>
                <TableCell>Largeur</TableCell>
                <TableCell>Épaisseur</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Prix €/M²</TableCell>
                <TableCell>Surface M²</TableCell>
                <TableCell>Dernière util.</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMaterials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} align="center">
                    Aucun matériau trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredMaterials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell>{material.description}</TableCell>
                    <TableCell>{material.code}</TableCell>
                    <TableCell>{material.type === 'panel' ? 'Panneau' : 'Reste'}</TableCell>
                    <TableCell>{material.hasGrain ? 'Oui' : 'Non'}</TableCell>
                    <TableCell>{material.length} mm</TableCell>
                    <TableCell>{material.width} mm</TableCell>
                    <TableCell>{material.thickness} mm</TableCell>
                    <TableCell>{material.stock}</TableCell>
                    <TableCell>{typeof material.pricePerSquareMeter === 'number' 
                      ? material.pricePerSquareMeter.toFixed(2) 
                      : Number(material.pricePerSquareMeter || 0).toFixed(2)} €</TableCell>
                    <TableCell>{typeof material.surface === 'number' 
                      ? material.surface.toFixed(2) 
                      : Number(material.surface || 0).toFixed(2)} m²</TableCell>
                    <TableCell>{formatDate(material.lastUsed)}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenDialog(material)} disabled={loading}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDeleteDialog(material)} disabled={loading}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Formulaire d'ajout/édition de matériau */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedMaterial ? 'Modifier le matériau' : 'Ajouter un matériau'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                name="description"
                label="Description"
                fullWidth
                value={formData.description}
                onChange={handleFormChange}
                margin="dense"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="code"
                label="Code"
                fullWidth
                value={formData.code}
                onChange={handleFormChange}
                margin="dense"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleFormChange}
                  label="Type"
                >
                  <MenuItem value="panel">Panneau</MenuItem>
                  <MenuItem value="rest">Reste</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="hasGrain"
                    checked={formData.hasGrain}
                    onChange={handleFormChange}
                  />
                }
                label="Possède un fil"
                sx={{ mt: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="length"
                label="Longueur (mm)"
                type="number"
                fullWidth
                value={formData.length}
                onChange={handleFormChange}
                margin="dense"
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="width"
                label="Largeur (mm)"
                type="number"
                fullWidth
                value={formData.width}
                onChange={handleFormChange}
                margin="dense"
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="thickness"
                label="Épaisseur (mm)"
                type="number"
                fullWidth
                value={formData.thickness}
                onChange={handleFormChange}
                margin="dense"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="stock"
                label="Stock"
                type="number"
                fullWidth
                value={formData.stock}
                onChange={handleFormChange}
                margin="dense"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="pricePerSquareMeter"
                label="Prix (€/m²)"
                type="number"
                fullWidth
                value={formData.pricePerSquareMeter}
                onChange={handleFormChange}
                margin="dense"
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>Annuler</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : selectedMaterial ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialogue de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Supprimer le matériau</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer ce matériau ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>Annuler</Button>
          <Button 
            onClick={handleDeleteMaterial} 
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// Composant d'onglet pour les chants
function EdgingsTab() {
  const [edgings, setEdgings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEdging, setSelectedEdging] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const { currentUser } = useAuth();

  // État pour le formulaire d'ajout/édition
  const [formData, setFormData] = useState({
    description: '',
    code: '',
    type: 'abs', // abs, pvc, wood, laminate
    length: '',
    height: '',
    thickness: '',
    dressing: false,
    stock: '',
    pricePerMeter: '',
    totalLinear: '',
    lastUsed: null
  });

  useEffect(() => {
    fetchEdgings();
  }, []);

  // Récupérer les chants depuis Firestore
  const fetchEdgings = async () => {
    try {
      setLoading(true);
      const edgingsRef = collection(db, 'edgings');
      const edgingsQuery = query(
        edgingsRef,
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(edgingsQuery);
      const edgingsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // S'assurer que les champs numériques sont bien des nombres
        length: Number(doc.data().length || 0),
        height: Number(doc.data().height || 0),
        thickness: Number(doc.data().thickness || 0),
        stock: Number(doc.data().stock || 0),
        pricePerMeter: Number(doc.data().pricePerMeter || 0),
        totalLinear: Number(doc.data().totalLinear || 0)
      }));
      setEdgings(edgingsList);
    } catch (error) {
      console.error("Erreur lors de la récupération des chants:", error);
      showNotification("Erreur lors du chargement des chants", "error");
    } finally {
      setLoading(false);
    }
  };

  // Afficher une notification
  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  // Fermer la notification
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  // Gérer l'ouverture du formulaire (ajout/édition)
  const handleOpenDialog = (edging = null) => {
    if (edging) {
      setSelectedEdging(edging);
      setFormData({ ...edging });
    } else {
      setSelectedEdging(null);
      setFormData({
        description: '',
        code: '',
        type: 'abs',
        length: '',
        height: '',
        thickness: '',
        dressing: false,
        stock: '',
        pricePerMeter: '',
        totalLinear: '',
        lastUsed: null
      });
    }
    setOpenDialog(true);
  };

  // Gérer la fermeture du formulaire
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Gérer les changements de champs dans le formulaire
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Convertir les valeurs numériques
      const length = Number(formData.length) || 0;
      const height = Number(formData.height) || 0;
      const thickness = Number(formData.thickness) || 0;
      const stock = Number(formData.stock) || 0;
      const pricePerMeter = Number(formData.pricePerMeter) || 0;
      const totalLinear = Number(formData.totalLinear) || stock; // Total linéaire = stock si non spécifié
      
      const edgingData = {
        description: formData.description,
        code: formData.code,
        type: formData.type,
        length,
        height,
        thickness,
        dressing: formData.dressing,
        stock,
        pricePerMeter,
        totalLinear,
        updatedAt: serverTimestamp(),
        createdBy: currentUser ? currentUser.uid : 'anonymous',
        lastUsed: formData.lastUsed || null
      };
      
      if (selectedEdging) {
        // Édition d'un chant existant
        await updateDoc(doc(db, 'edgings', selectedEdging.id), edgingData);
        
        // Mettre à jour l'état local
        setEdgings(edgings.map(edg => 
          edg.id === selectedEdging.id ? { ...edgingData, id: edg.id } : edg
        ));
        
        showNotification("Chant modifié avec succès");
      } else {
        // Ajout d'un nouveau chant
        edgingData.createdAt = serverTimestamp();
        
        const docRef = await addDoc(collection(db, 'edgings'), edgingData);
        const newEdging = { id: docRef.id, ...edgingData };
        
        setEdgings([newEdging, ...edgings]);
        showNotification("Chant ajouté avec succès");
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du chant:", error);
      showNotification("Erreur lors de la sauvegarde du chant", "error");
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir le dialogue de confirmation de suppression
  const handleOpenDeleteDialog = (edging) => {
    setSelectedEdging(edging);
    setDeleteDialogOpen(true);
  };

  // Gérer la suppression d'un chant
  const handleDeleteEdging = async () => {
    try {
      setLoading(true);
      
      await deleteDoc(doc(db, 'edgings', selectedEdging.id));
      
      // Mettre à jour l'état local
      setEdgings(edgings.filter(edg => edg.id !== selectedEdging.id));
      
      setDeleteDialogOpen(false);
      showNotification("Chant supprimé avec succès");
    } catch (error) {
      console.error("Erreur lors de la suppression du chant:", error);
      showNotification("Erreur lors de la suppression du chant", "error");
    } finally {
      setLoading(false);
    }
  };

  // Formater la date
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    
    // Gérer les timestamps Firestore
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Gestion des chants</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={loading}
        >
          Ajouter un chant
        </Button>
      </Box>
      
      {loading && edgings.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Hauteur</TableCell>
                <TableCell>Épaisseur</TableCell>
                <TableCell>Dressage</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Prix €/m</TableCell>
                <TableCell>Linéaire total</TableCell>
                <TableCell>Dernière util.</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {edgings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    Aucun chant trouvé. Ajoutez votre premier chant en cliquant sur le bouton ci-dessus.
                  </TableCell>
                </TableRow>
              ) : (
                edgings.map((edging) => (
                  <TableRow key={edging.id}>
                    <TableCell>{edging.description}</TableCell>
                    <TableCell>{edging.code}</TableCell>
                    <TableCell>
                      {edging.type === 'abs' ? 'ABS' : 
                       edging.type === 'pvc' ? 'PVC' : 
                       edging.type === 'wood' ? 'Bois' : 
                       edging.type === 'laminate' ? 'Stratifié' : 
                       edging.type}
                    </TableCell>
                    <TableCell>{edging.height} mm</TableCell>
                    <TableCell>{edging.thickness} mm</TableCell>
                    <TableCell>{edging.dressing ? 'Oui' : 'Non'}</TableCell>
                    <TableCell>{edging.stock} m</TableCell>
                    <TableCell>{typeof edging.pricePerMeter === 'number' 
                      ? edging.pricePerMeter.toFixed(2) 
                      : Number(edging.pricePerMeter || 0).toFixed(2)} €</TableCell>
                    <TableCell>{typeof edging.totalLinear === 'number' 
                      ? edging.totalLinear.toFixed(2) 
                      : Number(edging.totalLinear || 0).toFixed(2)} m</TableCell>
                    <TableCell>{formatDate(edging.lastUsed)}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenDialog(edging)} disabled={loading}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDeleteDialog(edging)} disabled={loading}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Formulaire d'ajout/édition de chant */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedEdging ? 'Modifier le chant' : 'Ajouter un chant'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                name="description"
                label="Description"
                fullWidth
                value={formData.description}
                onChange={handleFormChange}
                margin="dense"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="code"
                label="Code"
                fullWidth
                value={formData.code}
                onChange={handleFormChange}
                margin="dense"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleFormChange}
                  label="Type"
                >
                  <MenuItem value="abs">ABS</MenuItem>
                  <MenuItem value="pvc">PVC</MenuItem>
                  <MenuItem value="wood">Bois</MenuItem>
                  <MenuItem value="laminate">Stratifié</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="dressing"
                    checked={formData.dressing}
                    onChange={handleFormChange}
                  />
                }
                label="Dressage"
                sx={{ mt: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="length"
                label="Longueur (mm)"
                type="number"
                fullWidth
                value={formData.length}
                onChange={handleFormChange}
                margin="dense"
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="height"
                label="Hauteur (mm)"
                type="number"
                fullWidth
                value={formData.height}
                onChange={handleFormChange}
                margin="dense"
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="thickness"
                label="Épaisseur (mm)"
                type="number"
                fullWidth
                value={formData.thickness}
                onChange={handleFormChange}
                margin="dense"
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="stock"
                label="Stock (m)"
                type="number"
                fullWidth
                value={formData.stock}
                onChange={handleFormChange}
                margin="dense"
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="pricePerMeter"
                label="Prix (€/m)"
                type="number"
                fullWidth
                value={formData.pricePerMeter}
                onChange={handleFormChange}
                margin="dense"
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="totalLinear"
                label="Linéaire total (m)"
                type="number"
                fullWidth
                value={formData.totalLinear}
                onChange={handleFormChange}
                margin="dense"
                helperText="Laissez vide pour utiliser la valeur du stock"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>Annuler</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : selectedEdging ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialogue de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Supprimer le chant</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer ce chant ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>Annuler</Button>
          <Button 
            onClick={handleDeleteEdging} 
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// Composant d'onglet pour la quincaillerie
function HardwareTab() {
  const [hardware, setHardware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedHardware, setSelectedHardware] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const { currentUser } = useAuth();

  // État pour le formulaire d'ajout/édition
  const [formData, setFormData] = useState({
    description: '',
    reference: '',
    category: 'hinges', // hinges, slides, screws, handles, etc.
    manufacturer: '',
    stock: '',
    unitPrice: '',
    lastUsed: null
  });

  useEffect(() => {
    fetchHardware();
  }, []);

  // Récupérer la quincaillerie depuis Firestore
  const fetchHardware = async () => {
    try {
      setLoading(true);
      const hardwareRef = collection(db, 'hardware');
      const hardwareQuery = query(
        hardwareRef,
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(hardwareQuery);
      const hardwareList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // S'assurer que les champs numériques sont bien des nombres
        stock: Number(doc.data().stock || 0),
        unitPrice: Number(doc.data().unitPrice || 0)
      }));
      setHardware(hardwareList);
    } catch (error) {
      console.error("Erreur lors de la récupération de la quincaillerie:", error);
      showNotification("Erreur lors du chargement de la quincaillerie", "error");
    } finally {
      setLoading(false);
    }
  };

  // Afficher une notification
  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  // Fermer la notification
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  // Gérer l'ouverture du formulaire (ajout/édition)
  const handleOpenDialog = (item = null) => {
    if (item) {
      setSelectedHardware(item);
      setFormData({ ...item });
    } else {
      setSelectedHardware(null);
      setFormData({
        description: '',
        reference: '',
        category: 'hinges',
        manufacturer: '',
        stock: '',
        unitPrice: '',
        lastUsed: null
      });
    }
    setOpenDialog(true);
  };

  // Gérer la fermeture du formulaire
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Gérer les changements de champs dans le formulaire
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Convertir les valeurs numériques
      const stock = Number(formData.stock) || 0;
      const unitPrice = Number(formData.unitPrice) || 0;
      
      const hardwareData = {
        description: formData.description,
        reference: formData.reference,
        category: formData.category,
        manufacturer: formData.manufacturer,
        stock,
        unitPrice,
        updatedAt: serverTimestamp(),
        createdBy: currentUser ? currentUser.uid : 'anonymous',
        lastUsed: formData.lastUsed || null
      };
      
      if (selectedHardware) {
        // Édition d'un article existant
        await updateDoc(doc(db, 'hardware', selectedHardware.id), hardwareData);
        
        // Mettre à jour l'état local
        setHardware(hardware.map(item => 
          item.id === selectedHardware.id ? { ...hardwareData, id: item.id } : item
        ));
        
        showNotification("Article modifié avec succès");
      } else {
        // Ajout d'un nouvel article
        hardwareData.createdAt = serverTimestamp();
        
        const docRef = await addDoc(collection(db, 'hardware'), hardwareData);
        const newHardware = { id: docRef.id, ...hardwareData };
        
        setHardware([newHardware, ...hardware]);
        showNotification("Article ajouté avec succès");
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'article:", error);
      showNotification("Erreur lors de la sauvegarde de l'article", "error");
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir le dialogue de confirmation de suppression
  const handleOpenDeleteDialog = (item) => {
    setSelectedHardware(item);
    setDeleteDialogOpen(true);
  };

  // Gérer la suppression d'un article
  const handleDeleteHardware = async () => {
    try {
      setLoading(true);
      
      await deleteDoc(doc(db, 'hardware', selectedHardware.id));
      
      // Mettre à jour l'état local
      setHardware(hardware.filter(item => item.id !== selectedHardware.id));
      
      setDeleteDialogOpen(false);
      showNotification("Article supprimé avec succès");
    } catch (error) {
      console.error("Erreur lors de la suppression de l'article:", error);
      showNotification("Erreur lors de la suppression de l'article", "error");
    } finally {
      setLoading(false);
    }
  };

  // Formater la date
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    
    // Gérer les timestamps Firestore
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  // Obtenir le libellé de la catégorie
  const getCategoryLabel = (category) => {
    switch (category) {
      case 'hinges': return 'Charnières';
      case 'slides': return 'Coulisses';
      case 'screws': return 'Visserie';
      case 'handles': return 'Poignées';
      case 'connectors': return 'Connecteurs';
      case 'brackets': return 'Équerres';
      default: return category;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Gestion de la quincaillerie</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={loading}
        >
          Ajouter un article
        </Button>
      </Box>
      
      {loading && hardware.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell>Référence</TableCell>
                <TableCell>Catégorie</TableCell>
                <TableCell>Fabricant</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Prix unitaire €</TableCell>
                <TableCell>Dernière util.</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {hardware.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Aucun article trouvé. Ajoutez votre premier article en cliquant sur le bouton ci-dessus.
                  </TableCell>
                </TableRow>
              ) : (
                hardware.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.reference}</TableCell>
                    <TableCell>{getCategoryLabel(item.category)}</TableCell>
                    <TableCell>{item.manufacturer}</TableCell>
                    <TableCell>{item.stock}</TableCell>
                    <TableCell>{typeof item.unitPrice === 'number' 
                      ? item.unitPrice.toFixed(2) 
                      : Number(item.unitPrice || 0).toFixed(2)} €</TableCell>
                    <TableCell>{formatDate(item.lastUsed)}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenDialog(item)} disabled={loading}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDeleteDialog(item)} disabled={loading}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Formulaire d'ajout/édition de quincaillerie */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedHardware ? 'Modifier l\'article' : 'Ajouter un article'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                name="description"
                label="Description"
                fullWidth
                value={formData.description}
                onChange={handleFormChange}
                margin="dense"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="reference"
                label="Référence"
                fullWidth
                value={formData.reference}
                onChange={handleFormChange}
                margin="dense"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel>Catégorie</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  label="Catégorie"
                >
                  <MenuItem value="hinges">Charnières</MenuItem>
                  <MenuItem value="slides">Coulisses</MenuItem>
                  <MenuItem value="screws">Visserie</MenuItem>
                  <MenuItem value="handles">Poignées</MenuItem>
                  <MenuItem value="connectors">Connecteurs</MenuItem>
                  <MenuItem value="brackets">Équerres</MenuItem>
                  <MenuItem value="other">Autre</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="manufacturer"
                label="Fabricant"
                fullWidth
                value={formData.manufacturer}
                onChange={handleFormChange}
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="stock"
                label="Stock"
                type="number"
                fullWidth
                value={formData.stock}
                onChange={handleFormChange}
                margin="dense"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="unitPrice"
                label="Prix unitaire (€)"
                type="number"
                fullWidth
                value={formData.unitPrice}
                onChange={handleFormChange}
                margin="dense"
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>Annuler</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : selectedHardware ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialogue de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Supprimer l'article</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>Annuler</Button>
          <Button 
            onClick={handleDeleteHardware} 
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default function Materials() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Gestion des matériaux</Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} aria-label="material tabs">
          <Tab label="Panneaux" />
          <Tab label="Chants" />
          <Tab label="Quincaillerie" />
        </Tabs>
      </Box>
      
      {currentTab === 0 && <PanelsTab />}
      {currentTab === 1 && <EdgingsTab />}
      {currentTab === 2 && <HardwareTab />}
    </Box>
  );
}