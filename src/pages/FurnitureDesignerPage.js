import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import { getFirestore, getDoc, doc, setDoc } from 'firebase/firestore';
import { auth } from '../services/firebase';

// Importer notre module de conception 3D
import { FurnitureDesigner } from '../components/furniture3d';

const FurnitureDesignerPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  const firestore = getFirestore();
  
  useEffect(() => {
    // Vérifier l'utilisateur et son abonnement
    const checkUserAndSubscription = async () => {
      try {
        setLoading(true);
        
        // Obtenir l'utilisateur actuel
        const user = auth.currentUser;
        if (!user) {
          setError("Vous devez être connecté pour accéder à ce module");
          setLoading(false);
          return;
        }
        
        setCurrentUser(user);
        
        // Vérifier l'abonnement dans Firestore
        const subscriptionRef = doc(firestore, "subscriptions", user.uid);
        const subscriptionSnap = await getDoc(subscriptionRef);
        
        if (subscriptionSnap.exists()) {
          const subscriptionData = subscriptionSnap.data();
          
          // Vérifier si l'abonnement est actif
          const now = new Date();
          const expiryDate = subscriptionData.expiryDate?.toDate();
          
          if (expiryDate && expiryDate > now) {
            setSubscription({
              active: true,
              plan: subscriptionData.plan,
              expiryDate
            });
          } else {
            setSubscription({ active: false });
          }
        } else {
          setSubscription({ active: false });
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors de la vérification:", error);
        setError("Une erreur s'est produite lors de la vérification de votre abonnement");
        setLoading(false);
      }
    };
    
    checkUserAndSubscription();
  }, [firestore]);
  
  // Fonction pour sauvegarder le projet
  const handleSaveProject = async (projectData) => {
    // Logique de sauvegarde du projet dans Firebase
    try {
      const projectRef = doc(firestore, "furnitureProjects", projectData.projectInfo.id);
      
      await setDoc(projectRef, {
        ...projectData,
        userId: currentUser.uid,
        updatedAt: new Date()
      });
      
      return projectRef.id;
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      return null;
    }
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  if (!subscription?.active) {
    return (
      <Box p={3}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Abonnement requis
          </Typography>
          <Typography paragraph>
            Pour accéder au module de conception de meubles 3D, vous devez disposer d'un abonnement actif.
          </Typography>
          <Typography variant="body2">
            Rendez-vous dans la section Paramètres pour souscrire à un abonnement.
          </Typography>
        </Paper>
      </Box>
    );
  }

 
  return (
    <Box sx={{ height: 'calc(100vh - 64px)', width: '100%' }}>
      <FurnitureDesigner
        currentUser={currentUser}
        firestore={firestore}
        userSubscription={subscription}
        onSaveProject={handleSaveProject}
      />
    </Box>
  );
};

export default FurnitureDesignerPage;