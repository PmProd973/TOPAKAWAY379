import React, { createContext, useState, useContext, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../services/firebase';

// Créer le contexte
const ProjectContext = createContext();

// Hook personnalisé pour utiliser le contexte
export function useProjects() {
  return useContext(ProjectContext);
}

// Fournisseur du contexte
export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Effet pour écouter les changements dans la collection des projets
  useEffect(() => {
    setLoading(true);
    
    // Créer une requête pour obtenir tous les projets, triés par date de mise à jour
    const projectsQuery = query(
      collection(db, 'projects'),
      orderBy('updatedAt', 'desc')
    );
    
    // S'abonner aux changements
    const unsubscribe = onSnapshot(
      projectsQuery,
      (snapshot) => {
        const projectsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setProjects(projectsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching projects:', err);
        setError('Impossible de charger les projets. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    );
    
    // Nettoyer l'abonnement lors du démontage du composant
    return () => unsubscribe();
  }, []);

  // Fonction pour ajouter une notification
  const addNotification = (message, type = 'info', timeout = 6000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Supprimer automatiquement la notification après le délai spécifié
    if (timeout) {
      setTimeout(() => {
        removeNotification(id);
      }, timeout);
    }
    
    return id;
  };

  // Fonction pour supprimer une notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Fonctions pour rechercher des projets
  const getStarredProjects = () => {
    return projects.filter(project => project.starred);
  };

  const getRecentProjects = (days = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return projects.filter(project => {
      if (!project.updatedAt) return false;
      const updateDate = project.updatedAt.toDate ? project.updatedAt.toDate() : new Date(project.updatedAt);
      return updateDate > cutoffDate;
    });
  };

  const getProjectsByStatus = (status) => {
    return projects.filter(project => project.status === status);
  };

  const getProjectById = (id) => {
    return projects.find(project => project.id === id);
  };

  // Exposer les valeurs et fonctions dans le contexte
  const value = {
    projects,
    loading,
    error,
    notifications,
    addNotification,
    removeNotification,
    getStarredProjects,
    getRecentProjects,
    getProjectsByStatus,
    getProjectById
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}