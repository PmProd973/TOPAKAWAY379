// src/components/furniture3d/FurnitureDesigner/components/dialogs/RoomDialog.js
import React from 'react';
import { Box } from '@mui/material';
import ConfigDialog from './ConfigDialog';
import HomeIcon from '@mui/icons-material/Home';
import RoomTab from '../tabs/RoomTab';
import { useFurnitureStore } from '../../store/index';

const RoomDialog = ({ open, onClose }) => {
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
      title="Configuration de la pièce"
      icon={HomeIcon}
      actions={{
        apply: handleApply,
        cancel: onClose
      }}
    >
      <Box sx={{ height: '100%', overflow: 'auto' }}>
        <RoomTab regenerateScene={regenerateScene} />
      </Box>
    </ConfigDialog>
  );
};

export default RoomDialog;