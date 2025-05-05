// index.js
import React from 'react';
import { Box, Typography, Paper, Alert, Button } from '@mui/material';
import LabelDesignerPanel from './LabelDesignerPanel';

// Version simplifiée sans vérification d'abonnement pour commencer
const LabelDesigner = ({ projectId, pieces, materials, panels }) => {
  // Pour l'instant, considérons que l'utilisateur a un abonnement de base
  const subscriptionLevel = 'basic';
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Concepteur d'étiquettes
      </Typography>
      
      <LabelDesignerPanel
        projectId={projectId}
        pieces={pieces}
        materials={materials}
        panels={panels}
        subscriptionLevel={subscriptionLevel}
      />
    </Box>
  );
};

export default LabelDesigner;