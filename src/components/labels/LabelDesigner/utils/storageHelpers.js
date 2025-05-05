// utils/storageHelpers.js
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  orderBy,
  where,
  serverTimestamp 
} from 'firebase/firestore';

// Importez correctement votre instance Firebase
// Le chemin peut varier selon votre structure de projet
// Essayez l'un de ces chemins :
import { db } from '../../../../services/firebase';
// OU, si ce n'est pas le bon chemin, essayez :
// import { db } from '../../../services/firebase';
// import { db } from '../../../firebase/config';

// Fonction pour sauvegarder un modèle
export const saveTemplate = async (userId, templateData) => {
  try {
    // Créer un chemin dans Firestore pour les modèles
    const templatesRef = collection(db, 'label_templates');
    
    // Ajouter le timestamp et l'ID utilisateur
    const data = {
      ...templateData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Ajouter le document à Firestore
    const docRef = await addDoc(templatesRef, data);
    
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du modèle:", error);
    throw error;
  }
};

// Fonction pour mettre à jour un modèle existant
export const updateTemplate = async (templateId, templateData) => {
  try {
    const templateRef = doc(db, 'label_templates', templateId);
    
    await updateDoc(templateRef, {
      ...templateData,
      updatedAt: serverTimestamp()
    });
    
    return templateId;
  } catch (error) {
    console.error("Erreur lors de la mise à jour du modèle:", error);
    throw error;
  }
};

// Fonction pour supprimer un modèle
export const deleteTemplate = async (templateId) => {
  try {
    await deleteDoc(doc(db, 'label_templates', templateId));
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression du modèle:", error);
    throw error;
  }
};

// Fonction pour charger tous les modèles
export const loadTemplates = async (userId, projectId = null) => {
  try {
    let templatesQuery;
    
    if (projectId) {
      // Charger les modèles spécifiques au projet
      templatesQuery = query(
        collection(db, 'label_templates'),
        where('userId', '==', userId),
        where('projectId', '==', projectId),
        orderBy('updatedAt', 'desc')
      );
    } else {
      // Charger tous les modèles de l'utilisateur
      templatesQuery = query(
        collection(db, 'label_templates'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
    }
    
    const snapshot = await getDocs(templatesQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Erreur lors du chargement des modèles:", error);
    throw error;
  }
};

// Fonction pour charger un modèle spécifique
export const loadTemplate = async (templateId) => {
  try {
    const templateDoc = await getDoc(doc(db, 'label_templates', templateId));
    
    if (templateDoc.exists()) {
      return {
        id: templateDoc.id,
        ...templateDoc.data()
      };
    }
    
    throw new Error("Modèle introuvable");
  } catch (error) {
    console.error("Erreur lors du chargement du modèle:", error);
    throw error;
  }
};