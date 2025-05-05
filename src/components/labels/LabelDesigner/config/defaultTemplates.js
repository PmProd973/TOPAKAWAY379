// defaultTemplates.js
export const defaultTemplates = [
    {
      id: 'standard',
      name: 'Standard',
      description: 'Modèle classique avec toutes les informations',
      thumbnail: '/assets/templates/standard.png', // Chemin à ajuster selon votre structure de dossiers
      config: {
        layout: {
          width: 90,
          height: 50,
          orientation: 'landscape',
          pageSize: 'a4',
          labelsPerRow: 2,
          marginTop: 10,
          marginLeft: 10,
          marginRight: 10,
          marginBottom: 10,
          spacing: 5
        },
        content: {
          showPieceId: true,
          showDescription: true,
          showDimensions: true,
          showMaterial: true,
          showPanelNumber: true,
          showEdges: true,
          showDate: true,
          showQuantity: true,
          showClientName: true
        },
        style: {
          mainColor: '#1976d2',
          secondaryColor: '#f5f5f5',
          textColor: '#000000',
          fontFamily: 'Arial, sans-serif',
          fontSize: 10,
          headerFontSize: 12,
          borderWidth: 1,
          borderColor: '#000000',
          borderRadius: 0
        },
        logo: {
          enabled: true,
          position: 'topRight',
          width: 20,
          height: 10,
          maxSize: 30
        }
      }
    },
    {
      id: 'compact',
      name: 'Compact',
      description: 'Modèle simplifié pour petites étiquettes',
      thumbnail: '/assets/templates/compact.png', // Chemin à ajuster selon votre structure de dossiers
      config: {
        layout: {
          width: 70,
          height: 40,
          orientation: 'landscape',
          pageSize: 'a4',
          labelsPerRow: 3,
          marginTop: 10,
          marginLeft: 10,
          marginRight: 10,
          marginBottom: 10,
          spacing: 5
        },
        content: {
          showPieceId: true,
          showDescription: true,
          showDimensions: true,
          showMaterial: false,
          showPanelNumber: true,
          showEdges: true,
          showDate: false,
          showQuantity: true,
          showClientName: false
        },
        style: {
          mainColor: '#2e7d32',
          secondaryColor: '#f5f5f5',
          textColor: '#000000',
          fontFamily: 'Arial, sans-serif',
          fontSize: 9,
          headerFontSize: 11,
          borderWidth: 1,
          borderColor: '#000000',
          borderRadius: 0
        },
        logo: {
          enabled: false,
          position: 'none',
          width: 0,
          height: 0,
          maxSize: 20
        }
      }
    },
    {
      id: 'detailed',
      name: 'Détaillé',
      description: 'Modèle avec informations détaillées et mise en page professionnelle',
      thumbnail: '/assets/templates/detailed.png', // Chemin à ajuster selon votre structure de dossiers
      config: {
        layout: {
          width: 100,
          height: 60,
          orientation: 'landscape',
          pageSize: 'a4',
          labelsPerRow: 2,
          marginTop: 15,
          marginLeft: 15,
          marginRight: 15,
          marginBottom: 15,
          spacing: 8
        },
        content: {
          showPieceId: true,
          showDescription: true,
          showDimensions: true,
          showMaterial: true,
          showPanelNumber: true,
          showEdges: true,
          showDate: true,
          showQuantity: true,
          showClientName: true,
          showBarcode: true,
          showProjectName: true
        },
        style: {
          mainColor: '#3f51b5',
          secondaryColor: '#f0f4ff',
          textColor: '#263238',
          fontFamily: 'Roboto, Arial, sans-serif',
          fontSize: 10,
          headerFontSize: 14,
          borderWidth: 1,
          borderColor: '#3f51b5',
          borderRadius: 3
        },
        logo: {
          enabled: true,
          position: 'topRight',
          width: 25,
          height: 15,
          maxSize: 40
        }
      }
    }
  ];
  
  // Fonction utilitaire pour récupérer un template par son ID
  export function getTemplateById(templateId) {
    return defaultTemplates.find(template => template.id === templateId) || defaultTemplates[0];
  }
  
  // Fonction utilitaire pour obtenir une copie profonde d'un template
  export function getTemplateConfigCopy(templateId) {
    const template = getTemplateById(templateId);
    return JSON.parse(JSON.stringify(template.config));
  }