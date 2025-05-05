// LabelDesignerPanel.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Grid,
  Button,
  Typography,
  Divider,
  Tab,
  Tabs,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Print as PrintIcon, 
  PictureAsPdf as PdfIcon,
  Save as SaveIcon
} from '@mui/icons-material';

// Composants
import TemplateSelector from './TemplateSelector';
import LabelPreview from './LabelPreview';
import SaveTemplateDialog from './SaveTemplateDialog';

// Panneaux de configuration
import ContentPanel from './panels/ContentPanel';
import LayoutPanel from './panels/LayoutPanel';
import StylePanel from './panels/StylePanel';
import LogoPanel from './panels/LogoPanel';

// Utilitaires et configuration
import { defaultTemplates, getTemplateById } from './config/defaultTemplates';
import { generatePdf, printHtml } from './utils/exportFunctions';
import { saveTemplate, loadTemplates } from './utils/storageHelpers';

// Contextes
import { useAuth } from '../../../contexts/AuthContext';
import { useCompany } from '../../../contexts/CompanyContext';

const LabelDesignerPanel = ({ 
  projectId, 
  pieces = [], 
  materials = [], 
  panels = [],
  subscriptionLevel = 'basic'
}) => {
  // Récupérer l'utilisateur connecté
  const { currentUser } = useAuth();
  // Récupérer les informations de l'entreprise, y compris le logo
  const { companyInfo } = useCompany();
  
  // États pour la gestion des modèles
  const [selectedTemplateId, setSelectedTemplateId] = useState('standard');
  const [labelConfig, setLabelConfig] = useState(null);
  const [savedTemplates, setSavedTemplates] = useState([]);
  
  // États pour l'interface utilisateur
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [notification, setNotification] = useState({ 
    show: false, 
    message: '', 
    type: 'info' 
  });
  
  // Charger les modèles sauvegardés au chargement
  useEffect(() => {
    if (currentUser) {
      const fetchTemplates = async () => {
        try {
          const templates = await loadTemplates(currentUser.uid);
          setSavedTemplates(templates);
          
          // Si un modèle par défaut existe, le sélectionner
          const defaultTemplate = templates.find(t => t.isDefault);
          if (defaultTemplate) {
            setSelectedTemplateId(defaultTemplate.id);
          }
        } catch (error) {
          console.error("Erreur lors du chargement des modèles:", error);
          setNotification({
            show: true,
            message: "Erreur lors du chargement des modèles sauvegardés",
            type: 'error'
          });
        }
      };
      
      fetchTemplates();
    }
  }, [currentUser]);
  
  // Initialiser la configuration avec le template sélectionné
  useEffect(() => {
    // Chercher parmi les modèles sauvegardés d'abord
    const savedTemplate = savedTemplates.find(t => t.id === selectedTemplateId);
    
    if (savedTemplate) {
      // Utiliser la configuration du modèle sauvegardé
      setLabelConfig(JSON.parse(JSON.stringify(savedTemplate.config)));
    } else {
      // Sinon, chercher parmi les modèles par défaut
      const defaultTemplate = getTemplateById(selectedTemplateId);
      if (defaultTemplate) {
        setLabelConfig(JSON.parse(JSON.stringify(defaultTemplate.config)));
      }
    }
  }, [selectedTemplateId, savedTemplates]);
  
  // Fonction pour mettre à jour la configuration
  const handleConfigChange = (path, value) => {
    setLabelConfig(prevConfig => {
      const newConfig = { ...prevConfig };
      
      // Fonction pour mettre à jour une propriété imbriquée
      const setNestedProperty = (obj, path, value) => {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        return obj;
      };
      
      return setNestedProperty(newConfig, path, value);
    });
  };
  
  // Fonctions pour les actions d'export
  const handlePrintHtml = async () => {
    try {
      setLoading(true);
      
      await printHtml({
        pieces,
        materials,
        panels,
        config: labelConfig,
        companyInfo
      });
      
      setNotification({
        show: true,
        message: "Impression lancée avec succès",
        type: 'success'
      });
    } catch (error) {
      console.error("Erreur lors de l'impression:", error);
      setNotification({
        show: true,
        message: `Erreur lors de l'impression: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleGeneratePdf = async () => {
    try {
      setLoading(true);
      
      await generatePdf({
        pieces,
        materials,
        panels,
        config: labelConfig,
        companyInfo
      });
      
      setNotification({
        show: true,
        message: "PDF généré avec succès",
        type: 'success'
      });
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      setNotification({
        show: true,
        message: `Erreur lors de la génération du PDF: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour sauvegarder un modèle
  const handleSaveTemplate = async (templateInfo) => {
    if (!currentUser) {
      setNotification({
        show: true,
        message: "Vous devez être connecté pour sauvegarder un modèle",
        type: 'error'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Données du modèle à sauvegarder
      const templateData = {
        name: templateInfo.name,
        description: templateInfo.description || '',
        isDefault: templateInfo.isDefault,
        config: labelConfig,
        projectId: projectId || null // Associer au projet si nécessaire
      };
      
      // Sauvegarder dans Firestore
      const templateId = await saveTemplate(currentUser.uid, templateData);
      
      // Si défini comme modèle par défaut, mettre à jour les autres modèles
      if (templateInfo.isDefault) {
        // Logique pour mettre à jour les autres modèles (si nécessaire)
      }
      
      // Ajouter le nouveau modèle à la liste locale
      const newTemplate = {
        id: templateId,
        ...templateData
      };
      
      setSavedTemplates([newTemplate, ...savedTemplates]);
      
      // Sélectionner automatiquement le nouveau modèle
      setSelectedTemplateId(templateId);
      
      // Fermer la boîte de dialogue
      setSaveDialogOpen(false);
      
      setNotification({
        show: true,
        message: "Modèle sauvegardé avec succès",
        type: 'success'
      });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du modèle:", error);
      setNotification({
        show: true,
        message: "Erreur lors de la sauvegarde du modèle",
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour supprimer un modèle
  const handleDeleteTemplate = async (templateId) => {
    // Implémenter la suppression ici
  };
  
  // Fonction pour définir un modèle par défaut
  const handleSetDefaultTemplate = async (templateId) => {
    // Implémenter la définition par défaut ici
  };
  
  // Si la configuration n'est pas encore chargée
  if (!labelConfig) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Tous les modèles disponibles
  const allTemplates = [
    ...defaultTemplates,
    ...savedTemplates.map(template => ({
      ...template,
      thumbnail: template.thumbnail || '/templates/custom-template.png',
      isCustom: true
    }))
  ];
  
  return (
    <Box>
      {/* Notification */}
      <Snackbar
        open={notification.show}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, show: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotification(prev => ({ ...prev, show: false }))} 
          severity={notification.type} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
      
      {/* Sélection du modèle */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Sélectionnez un modèle d'étiquette
        </Typography>
        <TemplateSelector 
          templates={allTemplates}
          selectedTemplateId={selectedTemplateId}
          onSelect={setSelectedTemplateId}
          onDelete={handleDeleteTemplate}
          onSetDefault={handleSetDefaultTemplate}
        />
      </Paper>
      
      {/* Interface principale */}
      <Grid container spacing={3}>
        {/* Panneau d'édition */}
        <Grid xs={12} md={5}>
          <Paper sx={{ p: 0 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Disposition" />
              <Tab label="Contenu" />
              <Tab label="Style" />
              <Tab label="Logo" />
            </Tabs>
            
            <Box sx={{ p: 2 }}>
              {activeTab === 0 && (
                <LayoutPanel
                  config={labelConfig}
                  onChange={handleConfigChange}
                  subscriptionLevel={subscriptionLevel}
                />
              )}
              {activeTab === 1 && (
                <ContentPanel
                  config={labelConfig}
                  onChange={handleConfigChange}
                  subscriptionLevel={subscriptionLevel}
                />
              )}
              {activeTab === 2 && (
                <StylePanel
                  config={labelConfig}
                  onChange={handleConfigChange}
                  subscriptionLevel={subscriptionLevel}
                  canUseAdvancedStyling={true} // Pour l'instant, on active tout
                />
              )}
              {activeTab === 3 && (
                <LogoPanel
                  config={labelConfig}
                  onChange={handleConfigChange}
                  companyInfo={companyInfo} // Utiliser les vraies infos d'entreprise
                />
              )}
            </Box>
          </Paper>
          
          <Paper sx={{ p: 2, mt: 2 }}>
            <Button 
              variant="outlined" 
              fullWidth
              onClick={() => setSaveDialogOpen(true)}
              disabled={loading || !currentUser}
              startIcon={<SaveIcon />}
            >
              Enregistrer ce modèle
            </Button>
            
            {!currentUser && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                Vous devez être connecté pour sauvegarder des modèles
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Aperçu et export */}
        <Grid xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Aperçu des étiquettes
            </Typography>
            
            <Box sx={{ mb: 2, height: '500px', overflowY: 'auto' }}>
              <LabelPreview
                pieces={pieces}
                materials={materials}
                panels={panels}
                config={labelConfig}
                companyInfo={companyInfo} // Passer les infos d'entreprise pour afficher le logo
              />
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrintHtml}
                sx={{ mr: 2 }}
                disabled={loading}
              >
                {loading ? 'Chargement...' : 'Imprimer (HTML)'}
              </Button>
              
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PdfIcon />}
                onClick={handleGeneratePdf}
                disabled={loading}
              >
                {loading ? 'Chargement...' : 'Générer PDF'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Boîte de dialogue pour sauvegarder un modèle */}
      <SaveTemplateDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleSaveTemplate}
        loading={loading}
        existingTemplates={savedTemplates}
      />
    </Box>
  );
};

export default LabelDesignerPanel;