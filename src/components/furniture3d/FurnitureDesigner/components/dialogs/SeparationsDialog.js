// src/components/furniture3d/FurnitureDesigner/components/dialogs/SeparationsDialog.js
import React from 'react';
import { Box } from '@mui/material';
import ConfigDialog from './ConfigDialog';
import GridOnIcon from '@mui/icons-material/GridOn';
import SeparationsTab from '../tabs/SeparationsTab';
import { useFurnitureStore } from '../../store/index';

const SeparationsDialog = ({ open, onClose }) => {
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
      title="Séparations"
      icon={GridOnIcon}
      actions={{
        apply: handleApply,
        cancel: onClose
      }}
    >
      <Box sx={{ height: '100%', overflow: 'auto' }}>
        <SeparationsTab />
      </Box>
    </ConfigDialog>
  );
};

export default SeparationsDialog;