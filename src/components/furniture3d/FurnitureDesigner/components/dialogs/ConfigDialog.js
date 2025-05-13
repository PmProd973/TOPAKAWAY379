// src/components/furniture3d/FurnitureDesigner/components/dialogs/ConfigDialog.js
import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  IconButton, 
  Tabs, 
  Tab, 
  Box, 
  Typography 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Composant de dialogue configurable pour l'interface.
 * Utilisé comme base pour tous les dialogues de configuration.
 * 
 * @param {Object} props - Les propriétés du composant
 * @param {boolean} props.open - État d'ouverture du dialogue
 * @param {Function} props.onClose - Fonction appelée lors de la fermeture
 * @param {string} props.title - Titre du dialogue
 * @param {Component} props.icon - Composant d'icône à afficher
 * @param {Array} props.tabs - Liste des onglets (optionnel)
 * @param {number} props.activeTab - Index de l'onglet actif
 * @param {Function} props.onTabChange - Fonction appelée lors du changement d'onglet
 * @param {Object} props.actions - Actions pour les boutons (appliquer, annuler)
 * @param {boolean} props.fullWidth - Si le dialogue doit prendre toute la largeur
 * @param {string} props.maxWidth - Largeur maximale du dialogue (xs, sm, md, lg, xl)
 * @param {boolean} props.disableActions - Désactive les boutons d'action
 */
const ConfigDialog = ({ 
  open, 
  onClose, 
  title, 
  icon: Icon,
  tabs = [], 
  activeTab = 0,
  onTabChange,
  children, 
  actions = {
    apply: () => {},
    cancel: () => {}
  },
  fullWidth = true,
  maxWidth = "md",
  disableActions = false
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={maxWidth} 
      fullWidth={fullWidth}
      PaperProps={{
        sx: { 
          height: '80vh', 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: '4px',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          p: 2, 
          bgcolor: '#f5f5f5',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {Icon && <Icon sx={{ mr: 1, color: '#1976d2' }} />}
            <Typography variant="h6" sx={{ fontWeight: 500 }}>{title}</Typography>
          </Box>
          <IconButton 
            edge="end" 
            onClick={onClose} 
            aria-label="close"
            sx={{ 
              color: 'rgba(0, 0, 0, 0.54)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)'
              } 
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      {tabs.length > 0 && (
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => onTabChange(newValue)}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider', 
            px: 2,
            bgcolor: '#fafafa'
          }}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {tabs.map((tab, index) => (
            <Tab 
              key={index} 
              label={tab.label} 
              icon={tab.icon} 
              sx={{ 
                minHeight: 48,
                textTransform: 'none',
                fontWeight: activeTab === index ? 500 : 400
              }}
            />
          ))}
        </Tabs>
      )}
      
      <DialogContent 
        dividers 
        sx={{ 
          p: 2, 
          overflowY: 'auto', 
          flexGrow: 1,
          bgcolor: 'white'
        }}
      >
        {children}
      </DialogContent>
      
      {!disableActions && (
        <DialogActions 
          sx={{ 
            p: 2, 
            borderTop: '1px solid rgba(0, 0, 0, 0.12)',
            bgcolor: '#fafafa'
          }}
        >
          <Button 
            onClick={actions.cancel || onClose} 
            color="inherit"
            sx={{ 
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Annuler
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={actions.apply}
            sx={{ 
              textTransform: 'none',
              fontWeight: 500,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.2)'
              }
            }}
          >
            Appliquer
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ConfigDialog;