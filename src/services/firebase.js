// 2. Configuration Firebase
// Fichier src/services/firebase.js
/*
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Configuration Firebase (à remplacer par vos propres informations)
const firebaseConfig = {
  apiKey: "AIzaSyDRRJpZFYOaT6Mml2o5TI3UzbEVCgzJjJM",
  authDomain: "optimizer-4287b.firebaseapp.com",
  projectId: "optimizer-4287b",
  storageBucket: "optimizer-4287b.firebasestorage.app",
  messagingSenderId: "773501391198",
  appId: "1:773501391198:web:e37d59d25e1a70cdb0ffcf",
  measurementId: "G-PN0ENQPKBR"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

export { app, auth, db, storage, functions };

*/
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Remplacez cette configuration par celle de votre projet Firebase
/*
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_AUTH_DOMAIN",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_STORAGE_BUCKET",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID"
};
*/
const firebaseConfig = {
  apiKey: "AIzaSyDRRJpZFYOaT6Mml2o5TI3UzbEVCgzJjJM",
  authDomain: "optimizer-4287b.firebaseapp.com",
  projectId: "optimizer-4287b",
  storageBucket: "optimizer-4287b.firebasestorage.app",
  messagingSenderId: "773501391198",
  appId: "1:773501391198:web:e37d59d25e1a70cdb0ffcf",
  measurementId: "G-PN0ENQPKBR"
};
// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Services Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Par défaut, utiliser la persistance locale (l'utilisateur reste connecté même après fermeture du navigateur)
setPersistence(auth, browserLocalPersistence);

// Fonctions utilitaires pour l'authentification
export const setRememberMe = async (remember) => {
  try {
    await setPersistence(
      auth,
      remember ? browserLocalPersistence : browserSessionPersistence
    );
  } catch (error) {
    console.error('Error setting auth persistence:', error);
    throw error;
  }
};

// Mettre à jour les données de dernière connexion de l'utilisateur
export const updateUserLastLogin = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      lastLogin: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user last login:', error);
  }
};

// Observer les changements d'état d'authentification et mettre à jour les informations utilisateur
export const setupAuthObserver = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        // Mettre à jour la date de dernière connexion
        await updateUserLastLogin(user.uid);
        
        // Récupérer les données utilisateur supplémentaires depuis Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          // Combiner les données Auth et Firestore
          const userData = {
            ...user,
            ...userDoc.data(),
          };
          callback(userData);
        } else {
          // Si le document utilisateur n'existe pas encore, le créer
          const newUserData = {
            email: user.email,
            displayName: user.displayName || '',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          };
          
          await setDoc(doc(db, 'users', user.uid), newUserData);
          callback({...user, ...newUserData});
        }
      } catch (error) {
        console.error('Error in auth observer:', error);
        callback(user);
      }
    } else {
      callback(null);
    }
  });
};

// Règles de sécurité Firestore recommandées
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Fonction pour vérifier si l'utilisateur est authentifié
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Fonction pour vérifier si l'utilisateur est le propriétaire du document
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Règles pour la collection users
    match /users/{userId} {
      allow read: if isAuthenticated() && (isOwner(userId) || request.auth.token.admin == true);
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && isOwner(userId);
      allow delete: if request.auth.token.admin == true;
    }
    
    // Règles pour la collection projects
    match /projects/{projectId} {
      allow read: if isAuthenticated() && (
        resource.data.userId == request.auth.uid || 
        resource.data.sharedWith[request.auth.uid] == true
      );
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    
    // Règles pour les pièces d'un projet
    match /project_pieces/{projectId}/pieces/{pieceId} {
      allow read, write: if isAuthenticated() && (
        get(/databases/$(database)/documents/projects/$(projectId)).data.userId == request.auth.uid ||
        get(/databases/$(database)/documents/projects/$(projectId)).data.sharedWith[request.auth.uid] == true
      );
    }
    
    // Règles pour les matériaux
    match /materials/{materialId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
  }
}
*/

export default app;