// src/components/furniture3d/FurnitureDesigner/components/ToolsSidebar.js
import React from 'react';
import { 
  Box, 
  IconButton, 
  Tooltip, 
  Divider, 
  Typography 
} from '@mui/material';

// Icons
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import StraightenIcon from '@mui/icons-material/Straighten';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import GridOnIcon from '@mui/icons-material/GridOn';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HomeIcon from '@mui/icons-material/Home';
import HelpIcon from '@mui/icons-material/Help';
import SettingsIcon from '@mui/icons-material/Settings';

const ToolsSidebar = ({ 
  onOpenFurnitureV2,
  onOpenFurnitureList,
  onOpenSeparations,
  onOpenRoom,
  onOpenDisplay,
  onOpenHelp,
  onOpenSettings,
  collapsed = false
}) => {
  // Définir les outils disponibles
  const tools = [
    { 
      icon: <ViewInArIcon />, 
      label: 'Meuble V2', 
      action: onOpenFurnitureV2,
      primary: true
    },
    { 
      icon: <FormatListBulletedIcon />, 
      label: 'Liste des meubles', 
      action: onOpenFurnitureList 
    },
    { 
      icon: <GridOnIcon />, 
      label: 'Séparations', 
      action: onOpenSeparations 
    },
    { 
      icon: <HomeIcon />, 
      label: 'Pièce', 
      action: onOpenRoom 
    },
    { 
      icon: <VisibilityIcon />, 
      label: 'Affichage', 
      action: onOpenDisplay 
    }
  ];
  
  // Outils d'aide et de configuration
  const secondaryTools = [
    { 
      icon: <HelpIcon />, 
      label: 'Aide', 
      action: onOpenHelp 
    },
    { 
      icon: <SettingsIcon />, 
      label: 'Paramètres', 
      action: onOpenSettings 
    }
  ];
  
  return (
    <Box 
      sx={{ 
        width: collapsed ? 60 : 70, 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#1e2433', // Fond sombre
        color: 'rgba(255, 255, 255, 0.7)', // Texte gris clair
        borderRight: '1px solid rgba(0, 0, 0, 0.12)',
        pt: 1
      }}
    >
      {/* Outils principaux */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexGrow: 1 }}>
        {tools.map((tool, index) => (
          <Tooltip key={index} title={tool.label} placement="right">
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 0.5,
              mb: 1,
              width: '100%',
              '&:hover': {
                bgcolor: '#233044', // Plus clair au survol
                color: 'white',
                cursor: 'pointer'
              }
            }}>
              <IconButton 
                onClick={tool.action}
                sx={{ 
                  color: tool.primary ? '#4fc3f7' : 'inherit',
                  '&:hover': { color: tool.primary ? '#4fc3f7' : 'white' }
                }}
              >
                {tool.icon}
              </IconButton>
              {!collapsed && (
                <Typography variant="caption" align="center" sx={{ mt: 0.5 }}>
                  {tool.label}
                </Typography>
              )}
            </Box>
          </Tooltip>
        ))}
      </Box>
      
      <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.12)' }} />
      
      {/* Outils secondaires */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1 }}>
        {secondaryTools.map((tool, index) => (
          <Tooltip key={index} title={tool.label} placement="right">
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 0.5,
              mb: 1,
              width: '100%',
              '&:hover': {
                bgcolor: '#233044',
                color: 'white',
                cursor: 'pointer'
              }
            }}>
              <IconButton 
                onClick={tool.action}
                sx={{ color: 'inherit' }}
              >
                {tool.icon}
              </IconButton>
              {!collapsed && (
                <Typography variant="caption" align="center" sx={{ mt: 0.5 }}>
                  {tool.label}
                </Typography>
              )}
            </Box>
          </Tooltip>
        ))}
      </Box>
    </Box>
  );
};

export default ToolsSidebar;