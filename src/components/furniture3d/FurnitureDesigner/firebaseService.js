// src/components/furniture3d/FurnitureDesigner/firebaseService.js
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';

// Configuration Firebase (à remplacer par vos propres valeurs)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Service d'authentification
const authService = {
  getCurrentUser: () => auth.currentUser,
  
  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, callback);
  },
  
  signIn: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error("Erreur de connexion:", error);
      throw error;
    }
  },
  
  signOut: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
      throw error;
    }
  }
};

// Service de gestion des projets de meubles
const furnitureProjectService = {
  // Récupérer tous les projets d'un utilisateur
  getUserProjects: async (userId) => {
    try {
      const projectsRef = collection(db, "furnitureProjects");
      const q = query(projectsRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      
      const projects = [];
      querySnapshot.forEach((doc) => {
        projects.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return projects;
    } catch (error) {
      console.error("Erreur lors de la récupération des projets:", error);
      throw error;
    }
  },
  
  // Récupérer un projet spécifique
  getProject: async (projectId) => {
    try {
      const docRef = doc(db, "furnitureProjects", projectId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error("Projet non trouvé");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du projet:", error);
      throw error;
    }
  },
  
  // Créer un nouveau projet
  createProject: async (projectData) => {
    try {
      const newProjectRef = doc(collection(db, "furnitureProjects"));
      await setDoc(newProjectRef, {
        ...projectData,
        createdAt: new Date(),
        lastModified: new Date()
      });
      
      return newProjectRef.id;
    } catch (error) {
      console.error("Erreur lors de la création du projet:", error);
      throw error;
    }
  },
  
  // Mettre à jour un projet existant
  updateProject: async (projectId, projectData) => {
    try {
      const projectRef = doc(db, "furnitureProjects", projectId);
      await updateDoc(projectRef, {
        ...projectData,
        lastModified: new Date()
      });
      
      return projectId;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du projet:", error);
      throw error;
    }
  },
  
  // Supprimer un projet
  deleteProject: async (projectId) => {
    try {
      await deleteDoc(doc(db, "furnitureProjects", projectId));
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression du projet:", error);
      throw error;
    }
  }
};

// Service de gestion des abonnements
const subscriptionService = {
  // Vérifier si un utilisateur a un abonnement actif
  checkSubscription: async (userId) => {
    try {
      const subscriptionRef = doc(db, "subscriptions", userId);
      const docSnap = await getDoc(subscriptionRef);
      
      if (docSnap.exists()) {
        const subscription = docSnap.data();
        
        // Vérifier si l'abonnement est actif
        const now = new Date();
        const expiryDate = subscription.expiryDate.toDate();
        
        if (expiryDate > now) {
          return {
            active: true,
            plan: subscription.plan,
            expiryDate
          };
        } else {
          return { active: false };
        }
      } else {
        return { active: false };
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de l'abonnement:", error);
      throw error;
    }
  },
};

export { authService, furnitureProjectService, subscriptionService };