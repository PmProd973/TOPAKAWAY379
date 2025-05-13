// src/components/furniture3d/FurnitureDesigner/components/dialogs/FurnitureListDialog.js
import React from 'react';
import { Box } from '@mui/material';
import ConfigDialog from './ConfigDialog';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FurnitureListTab from '../tabs/FurnitureListTab';

const FurnitureListDialog = ({ open, onClose }) => {
  return (
    <ConfigDialog
      open={open}
      onClose={onClose}
      title="Liste des meubles"
      icon={FormatListBulletedIcon}
      disableActions={true} // Pas besoin de boutons d'action pour la liste
    >
      <Box sx={{ height: '100%', overflow: 'auto' }}>
        <FurnitureListTab />
      </Box>
    </ConfigDialog>
  );
};

export default FurnitureListDialog;