// src/components/furniture3d/FurnitureDesigner/components/tabs/FurnitureListTab/index.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Button,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Menu,
  MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useFurnitureStore } from '../../../store/index';

const FurnitureListTab = () => {
  // États locaux pour la gestion des dialogues et éditions
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editingName, setEditingName] = useState(null);
  const [newName, setNewName] = useState('');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  
  // Récupérer la liste des meubles et les fonctions du store
  const {
    furnitureList = [],
    activeFurnitureId,
    initializeFurnitureList,
    addFurniture,
    removeFurniture,
    selectFurniture,
    updateFurniture
  } = useFurnitureStore();

  // S'assurer que la liste des meubles est initialisée
  React.useEffect(() => {
    if (initializeFurnitureList && (!furnitureList || furnitureList.length === 0)) {
      console.log("Initialisation de la liste des meubles depuis FurnitureListTab");
      initializeFurnitureList();
    }
  }, [initializeFurnitureList, furnitureList]);

  // Gérer l'ajout d'un nouveau meuble
  const handleAddFurniture = () => {
    addFurniture();
  };

  // Gérer la duplication d'un meuble
  const handleDuplicateFurniture = (furniture) => {
    // Fermer le menu si ouvert
    handleCloseMenu();
    
    // Créer une copie avec un nouveau nom
    const newName = `${furniture.name} (copie)`;
    
    // Modifier légèrement la position pour éviter la superposition
    const newPosition = {
      x: furniture.position.x + 100, // Décaler de 100mm
      y: furniture.position.y,
      z: furniture.position.z + 100
    };
    
    // Ajouter le meuble dupliqué avec des propriétés personnalisées
    addFurniture({
      name: newName,
      position: newPosition
    });
  };

  // Gérer la suppression d'un meuble
  const handleDeleteFurniture = (id) => {
    // Fermer le menu si ouvert
    handleCloseMenu();
    
    setConfirmDeleteId(id);
    setDeleteDialogOpen(true);
  };

  // Confirmation de suppression
  const confirmDelete = () => {
    if (confirmDeleteId) {
      removeFurniture(confirmDeleteId);
    }
    setDeleteDialogOpen(false);
    setConfirmDeleteId(null);
  };

  // Annuler la suppression
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setConfirmDeleteId(null);
  };

  // Sélection d'un meuble pour édition
  const handleSelectFurniture = (id) => {
    selectFurniture(id);
  };

  // Commencer l'édition du nom
  const handleStartEditName = (id, currentName) => {
    // Fermer le menu si ouvert
    handleCloseMenu();
    
    setEditingName(id);
    setNewName(currentName);
  };

  // Sauvegarder le nouveau nom
  const handleSaveName = (id) => {
    if (newName.trim()) {
      updateFurniture(id, { name: newName.trim() }, false);
    }
    setEditingName(null);
  };
  
  // Ouvrir le menu contextuel
  const handleOpenMenu = (event, id) => {
    setMenuAnchor(event.currentTarget);
    setActiveMenuId(id);
  };
  
  // Fermer le menu contextuel
  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setActiveMenuId(null);
  };

  return (
    <Paper elevation={0} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Liste des meubles ({furnitureList.length})</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddFurniture}
        >
          Ajouter un meuble
        </Button>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {furnitureList.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            Aucun meuble disponible. Utilisez le bouton "Ajouter un meuble" pour commencer.
          </Typography>
        ) : (
          <List>
            {furnitureList.map((furniture, index) => (
              <React.Fragment key={furniture.id}>
                {index > 0 && <Divider />}
                <ListItem
                  button
                  selected={furniture.id === activeFurnitureId}
                  onClick={() => handleSelectFurniture(furniture.id)}
                  sx={{
                    bgcolor: furniture.id === activeFurnitureId ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                    '&:hover': {
                      bgcolor: furniture.id === activeFurnitureId ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  {editingName === furniture.id ? (
                    <TextField
                      fullWidth
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onBlur={() => handleSaveName(furniture.id)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveName(furniture.id);
                        }
                      }}
                      autoFocus
                      variant="standard"
                      sx={{ mr: 6 }}
                    />
                  ) : (
                    <ListItemText
                      primary={furniture.name}
                      secondary={`${furniture.type} - ${furniture.dimensions.width}×${furniture.dimensions.height}×${furniture.dimensions.depth} mm`}
                    />
                  )}

                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      aria-label="more options" 
                      onClick={(e) => handleOpenMenu(e, furniture.id)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
      
      {/* Menu contextuel */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
      >
        {activeMenuId && (
          <>
            <MenuItem 
              onClick={() => {
                const furniture = furnitureList.find(f => f.id === activeMenuId);
                if (furniture) {
                  handleStartEditName(activeMenuId, furniture.name);
                }
              }}
            >
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Renommer
            </MenuItem>
            <MenuItem 
              onClick={() => {
                const furniture = furnitureList.find(f => f.id === activeMenuId);
                if (furniture) {
                  handleDuplicateFurniture(furniture);
                }
              }}
            >
              <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
              Dupliquer
            </MenuItem>
            <Divider />
            <MenuItem 
              onClick={() => handleDeleteFurniture(activeMenuId)}
              disabled={furnitureList.length <= 1}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Supprimer
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Dialogue de confirmation de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDelete}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer ce meuble ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} color="primary">
            Annuler
          </Button>
          <Button onClick={confirmDelete} color="error" autoFocus>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default FurnitureListTab;