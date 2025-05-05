// utils/furnitureStorage.js
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../services/firebase';

// Sauvegarder une conception de meuble
export const saveFurnitureDesign = async (userId, projectId, designData) => {
  try {
    const designRef = doc(db, 'furniture_designs', `${projectId}_${Date.now()}`);
    
    await setDoc(designRef, {
      userId,
      projectId,
      name: designData.name,
      description: designData.description,
      sceneObjects: designData.sceneObjects,
      connections: designData.connections,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return designRef.id;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la conception:', error);
    throw error;
  }
};

// Charger une conception de meuble
export const loadFurnitureDesign = async (designId) => {
  try {
    const designDoc = await getDoc(doc(db, 'furniture_designs', designId));
    
    if (designDoc.exists()) {
      return {
        id: designDoc.id,
        ...designDoc.data()
      };
    }
    
    throw new Error('Conception introuvable');
  } catch (error) {
    console.error('Erreur lors du chargement de la conception:', error);
    throw error;
  }
};

// Charger toutes les conceptions d'un projet
export const loadProjectDesigns = async (projectId) => {
  try {
    const designsQuery = query(
      collection(db, 'furniture_designs'),
      where('projectId', '==', projectId)
    );
    
    const snapshot = await getDocs(designsQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erreur lors du chargement des conceptions:', error);
    throw error;
  }
};