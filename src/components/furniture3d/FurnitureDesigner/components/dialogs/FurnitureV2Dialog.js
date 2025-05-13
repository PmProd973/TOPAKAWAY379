// src/components/furniture3d/FurnitureDesigner/components/dialogs/FurnitureV2Dialog.js
import React from 'react';
import { Box } from '@mui/material';
import ConfigDialog from './ConfigDialog';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import FurnitureTabV2 from '../tabs/FurnitureTabV2';
import { useFurnitureStore } from '../../store/index';

const FurnitureV2Dialog = ({ open, onClose }) => {
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
      title="Configuration du meuble"
      icon={ViewInArIcon}
      actions={{
        apply: handleApply,
        cancel: onClose
      }}
    >
      <Box sx={{ height: '100%', overflow: 'auto' }}>
        <FurnitureTabV2 regenerateScene={regenerateScene} />
      </Box>
    </ConfigDialog>
  );
};

export default FurnitureV2Dialog;