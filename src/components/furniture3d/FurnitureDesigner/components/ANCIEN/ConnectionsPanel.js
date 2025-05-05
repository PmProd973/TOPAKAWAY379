// src/components/furniture3d/FurnitureDesigner/components/ConnectionsPanel.js
import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useAssemblyStore } from '../store/assemblyStore';
import { useFurnitureStore } from '../store';

const ConnectionsPanel = () => {
  const { connections } = useAssemblyStore();
  const { sceneObjects, selectedObjectId, setEditMode } = useFurnitureStore();
  
  const handleStartConnecting = () => {
    setEditMode('connect');
  };
  
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Connexions
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Créez des connexions entre les pièces pour assembler votre meuble.
      </Typography>
      
      <Button 
        fullWidth 
        variant="contained" 
        sx={{ mb: 2 }}
        onClick={handleStartConnecting}
      >
        Créer une connexion
      </Button>
      
      {connections.length === 0 ? (
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Aucune connexion créée pour le moment.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Sélectionnez deux pièces et cliquez sur "Créer une connexion".
          </Typography>
        </Paper>
      ) : (
        <Box>
          {/* Liste des connexions existantes */}
          {connections.map(connection => (
            <Paper key={connection.id} sx={{ p: 1, mb: 1 }}>
              <Typography variant="body2">
                Connexion {connection.type}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Entre les pièces {connection.piece1} et {connection.piece2}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ConnectionsPanel;