// src/components/furniture3d/FurnitureDesigner/index.js
import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import MainToolbar from './MainToolbar';
import Scene3D from './Scene3D';
import { useFurnitureStore } from './store';

// Nous recevons les services Firebase en props
const FurnitureDesigner = ({ 
  currentUser, 
  firestore, 
  userSubscription,
  onSaveProject
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { 
    setUser,
    setSubscription,
    initialize
  } = useFurnitureStore();
  
  // Utiliser les props fournies pour initialiser le store
  useEffect(() => {
    const initializeDesigner = async () => {
      try {
        setLoading(true);
        
        // Vérifier l'authentification
        if (!currentUser) {
          setError("Vous devez être connecté pour accéder à ce module");
          setLoading(false);
          return;
        }
        
        // Définir l'utilisateur dans le store
        setUser(currentUser);
        
        // Vérifier l'abonnement
        if (!userSubscription || !userSubscription.active) {
          setError("Vous devez disposer d'un abonnement actif pour accéder à ce module");
          setLoading(false);
          return;
        }
        
        // Définir l'abonnement dans le store
        setSubscription(userSubscription);
        
        // Initialiser le designer
        initialize();
        
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors de l'initialisation:", err);
        setError("Une erreur s'est produite lors de l'initialisation du module");
        setLoading(false);
      }
    };
    
    initializeDesigner();
  }, [currentUser, userSubscription, setUser, setSubscription, initialize]);
  
  // Affichage pendant le chargement
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }
  
  // Affichage en cas d'erreur
  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
        p={3}
      >
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  // Affichage principal du designer
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <MainToolbar onSaveProject={onSaveProject} />
      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <Scene3D />
      </Box>
    </Box>
  );
};

export default FurnitureDesigner;