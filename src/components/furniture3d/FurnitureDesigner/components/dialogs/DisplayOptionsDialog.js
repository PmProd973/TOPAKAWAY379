// src/components/furniture3d/FurnitureDesigner/components/dialogs/DisplayOptionsDialog.js
import React from 'react';
import { Box } from '@mui/material';
import ConfigDialog from './ConfigDialog';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DisplayOptionsTab from '../tabs/DisplayOptionsTab';
import { useFurnitureStore } from '../../store/index';

const DisplayOptionsDialog = ({ open, onClose }) => {
  const { regenerateScene } = useFurnitureStore();
  
  // Actions pour le dialogue
  const handleApply = () => {
    // Régénérer la scène
    regenerateScene();
    // Fermer le dialogue
    onClose();
  };
  
  return (
    <ConfigDialog
      open={open}
      onClose={onClose}
      title="Options d'affichage"
      icon={VisibilityIcon}
      actions={{
        apply: handleApply,
        cancel: onClose
      }}
    >
      <Box sx={{ height: '100%', overflow: 'auto' }}>
        <DisplayOptionsTab regenerateScene={regenerateScene} />
      </Box>
    </ConfigDialog>
  );
};

export default DisplayOptionsDialog;