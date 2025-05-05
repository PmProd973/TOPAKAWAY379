// TemplateSelector.js
import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  CardActionArea,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import { Star as StarIcon, Delete as DeleteIcon } from '@mui/icons-material';

/**
 * Composant pour sélectionner un modèle d'étiquette parmi les modèles disponibles
 */
const TemplateSelector = ({ 
  templates, 
  selectedTemplateId, 
  onSelect,
  onDelete = null, // Fonction optionnelle pour supprimer un modèle
  onSetDefault = null // Fonction optionnelle pour définir un modèle par défaut
}) => {
  // État pour suivre le survol des cartes (pour afficher les boutons d'action)
  const [hoveredCard, setHoveredCard] = React.useState(null);
  
  // Filtrer les modèles par défaut et personnalisés
  const defaultTemplates = templates.filter(t => !t.isCustom);
  const customTemplates = templates.filter(t => t.isCustom);
  
  // Fonction pour gérer la suppression d'un modèle
  const handleDelete = (event, templateId) => {
    event.stopPropagation(); // Empêcher la sélection du modèle
    if (onDelete) {
      onDelete(templateId);
    }
  };
  
  // Fonction pour définir un modèle par défaut
  const handleSetDefault = (event, templateId) => {
    event.stopPropagation(); // Empêcher la sélection du modèle
    if (onSetDefault) {
      onSetDefault(templateId);
    }
  };
  
  // Rendu d'une carte de modèle
  const renderTemplateCard = (template) => {
    const isSelected = selectedTemplateId === template.id;
    const isHovered = hoveredCard === template.id;
    const isCustom = template.isCustom;
    const isDefault = template.isDefault;
    
    return (
      <Grid item xs={6} sm={4} md={3} key={template.id}>
        <Card 
          variant={isSelected ? "outlined" : "elevation"}
          sx={{ 
            borderColor: isSelected ? 'primary.main' : 'transparent',
            borderWidth: 2,
            position: 'relative',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
          onMouseEnter={() => setHoveredCard(template.id)}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardActionArea 
            onClick={() => onSelect(template.id)}
            sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
          >
            <CardMedia
              component="img"
              height="140"
              image={template.thumbnail || '/templates/placeholder.png'}
              alt={template.name}
              sx={{ bgcolor: '#f5f5f5' }}
            />
            <CardContent sx={{ flexGrow: 1, pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="subtitle1" component="div" noWrap sx={{ flexGrow: 1 }}>
                  {template.name}
                </Typography>
                {isDefault && (
                  <Tooltip title="Modèle par défaut">
                    <StarIcon fontSize="small" color="primary" sx={{ ml: 0.5 }} />
                  </Tooltip>
                )}
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ 
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                height: '40px'
              }}>
                {template.description || (isCustom ? "Modèle personnalisé" : "Modèle standard")}
              </Typography>
              
              {isCustom && (
                <Chip
                  label="Personnalisé"
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ mt: 1 }}
                />
              )}
            </CardContent>
          </CardActionArea>
          
          {/* Actions sur les modèles personnalisés */}
          {isCustom && isHovered && onDelete && onSetDefault && (
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 5, 
                right: 5, 
                bgcolor: 'rgba(255,255,255,0.8)',
                borderRadius: '4px',
                display: 'flex'
              }}
            >
              {!isDefault && (
                <Tooltip title="Définir comme modèle par défaut">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={(e) => handleSetDefault(e, template.id)}
                  >
                    <StarIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Supprimer ce modèle">
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => handleDelete(e, template.id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Card>
      </Grid>
    );
  };
  
  return (
    <Box>
      {/* Modèles par défaut */}
      <Grid container spacing={2} sx={{ mb: customTemplates.length > 0 ? 3 : 0 }}>
        {defaultTemplates.map(renderTemplateCard)}
      </Grid>
      
      {/* Modèles personnalisés */}
      {customTemplates.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
            Vos modèles personnalisés
          </Typography>
          <Grid container spacing={2}>
            {customTemplates.map(renderTemplateCard)}
          </Grid>
        </>
      )}
      
      {/* Message si aucun modèle */}
      {templates.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Aucun modèle d'étiquette disponible
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TemplateSelector;