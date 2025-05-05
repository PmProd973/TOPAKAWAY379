// contexts/CompanyContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { useAuth } from './AuthContext';

const CompanyContext = createContext();

export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setCompanyInfo(null);
      setLoading(false);
      return;
    }

    const fetchCompanyInfo = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setCompanyInfo(docSnap.data().companyInfo || {});
        } else {
          // Initialiser avec un objet vide si aucune donnée n'existe
          const defaultCompanyInfo = {
            name: '',
            logo: null,
            address: '',
            phone: '',
            email: '',
            website: '',
            updatedAt: new Date().toISOString()
          };
          
          // Créer le document utilisateur avec les infos par défaut
          await setDoc(docRef, { companyInfo: defaultCompanyInfo }, { merge: true });
          setCompanyInfo(defaultCompanyInfo);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des infos entreprise:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyInfo();
  }, [currentUser]);

  // Ajouter la fonction updateCompanyInfo
  const updateCompanyInfo = async (updatedInfo) => {
    if (!currentUser) return false;
    
    try {
      setLoading(true);
      
      // Fusionner les nouvelles informations avec les existantes
      const newCompanyInfo = {
        ...companyInfo,
        ...updatedInfo,
        updatedAt: new Date().toISOString()
      };
      
      // Mettre à jour dans Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { companyInfo: newCompanyInfo });
      
      // Mettre à jour l'état local
      setCompanyInfo(newCompanyInfo);
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la mise à jour des informations d'entreprise:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const uploadLogo = async (file) => {
    if (!currentUser || !file) return null;
    
    try {
      setLoading(true);
      // Créer une référence pour le fichier
      const storageRef = ref(storage, `users/${currentUser.uid}/company/logo`);
      
      // Télécharger le fichier
      await uploadBytes(storageRef, file);
      
      // Obtenir l'URL de téléchargement
      const downloadURL = await getDownloadURL(storageRef);
      
      // Mettre à jour les infos de l'entreprise
      const userRef = doc(db, 'users', currentUser.uid);
      const updatedCompanyInfo = {
        ...companyInfo,
        logo: {
          url: downloadURL,
          updatedAt: new Date().toISOString()
        }
      };
      
      await updateDoc(userRef, { companyInfo: updatedCompanyInfo });
      
      // Mettre à jour l'état local
      setCompanyInfo(updatedCompanyInfo);
      
      return downloadURL;
    } catch (error) {
      console.error('Erreur lors du téléchargement du logo:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Ajouter updateCompanyInfo à l'objet value
  return (
    <CompanyContext.Provider value={{ companyInfo, loading, uploadLogo, updateCompanyInfo }}>
      {children}
    </CompanyContext.Provider>
  );
};