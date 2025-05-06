import React, { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Badge,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  FolderOpen as ProjectsIcon,
  Layers as MaterialsIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  ExpandLess,
  ExpandMore,
  Add as AddIcon,
  Star as StarIcon,
  History as RecentIcon,
  Construction as ToolsIcon,
  Build as BuildIcon,
  ViewList as ListIcon,
  Sell as TagIcon,
  LocalPrintshop as PrintIcon,
  Style as StyleIcon,
  ViewInAr as ViewInArIcon
} from '@mui/icons-material';
import { useProjects } from '../../contexts/ProjectContext';

// Largeur de la barre latérale
const drawerWidth = 240;

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getStarredProjects, getRecentProjects } = useProjects();
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  // Vérifier si un chemin est actif
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Basculer l'ouverture/fermeture d'une section
  const toggleSection = (section) => {
    if (section === 'projects') {
      setProjectsOpen(!projectsOpen);
    } else if (section === 'materials') {
      setMaterialsOpen(!materialsOpen);
    } else if (section === 'tools') {
      setToolsOpen(!toolsOpen);
    }
  };

  // Créer un nouveau projet
  const handleCreateProject = () => {
    navigate('/projects');
    // Simuler un clic sur le bouton "Nouveau Projet"
    setTimeout(() => {
      const newProjectButton = document.querySelector('[data-testid="new-project-button"]');
      if (newProjectButton) {
        newProjectButton.click();
      }
    }, 100);
  };

  // Liste des éléments de menu principal
  const mainMenuItems = [
    {
      text: 'Tableau de bord',
      icon: <DashboardIcon />,
      path: '/',
    },
    {
      text: 'Projets',
      icon: <ProjectsIcon />,
      path: '/projects',
      hasSubmenu: true,
      open: projectsOpen,
      onClick: () => toggleSection('projects'),
      submenu: [
        {
          text: 'Tous les projets',
          icon: <ListIcon />,
          path: '/projects',
        },
        {
          text: 'Favoris',
          icon: <StarIcon />,
          path: '/projects?tab=starred',
          badge: getStarredProjects().length,
        },
        {
          text: 'Récents',
          icon: <RecentIcon />,
          path: '/projects?tab=recent',
          badge: getRecentProjects().length,
        },
        {
          text: 'Nouveau projet',
          icon: <AddIcon />,
          onClick: handleCreateProject,
        },
      ],
    },
    {
      text: 'Matériaux',
      icon: <MaterialsIcon />,
      path: '/materials',
      hasSubmenu: true,
      open: materialsOpen,
      onClick: () => toggleSection('materials'),
      submenu: [
        {
          text: 'Panneaux',
          icon: <ListIcon />,
          path: '/materials?tab=panels',
        },
        {
          text: 'Chants',
          icon: <ToolsIcon />,
          path: '/materials?tab=edgings',
        },
        {
          text: 'Quincaillerie',
          icon: <BuildIcon />,
          path: '/materials?tab=hardware',
        },
      ],
    },
    {
      text: 'Outils',
      icon: <BuildIcon />,
      path: '/tools',
      hasSubmenu: true,
      open: toolsOpen,
      onClick: () => toggleSection('tools'),
      submenu: [
        {
          text: 'Concepteur d\'étiquettes',
          icon: <TagIcon />,
          path: '/tools/label-designer',
        },
        {
          text: 'Modèles d\'impression',
          icon: <PrintIcon />,
          path: '/tools/print-templates',
        },
        {
          text: 'Styles personnalisés',
          icon: <StyleIcon />,
          path: '/tools/custom-styles',
        },
        {
          text: 'Conception 3D',
          icon: <ViewInArIcon />,
          path: '/conception-3d', // Chemin corrigé pour la page de conception 3D
        }
      ],
    },
  ];

  // Éléments de menu en bas de la barre latérale
  const bottomMenuItems = [
    {
      text: 'Paramètres',
      icon: <SettingsIcon />,
      path: '/settings',
    },
    {
      text: 'Aide',
      icon: <HelpIcon />,
      path: '/help',
    },
  ];
  
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: drawerWidth, 
          boxSizing: 'border-box',
          top: '64px',
          height: 'calc(100% - 64px)'
        },
      }}
    >
      <Box sx={{ overflow: 'auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <List component="nav" sx={{ py: 2 }}>
          {mainMenuItems.map((item) => (
            <React.Fragment key={item.text}>
              <ListItem disablePadding>
                <ListItemButton
                  component={item.hasSubmenu ? 'div' : RouterLink}
                  to={item.hasSubmenu ? undefined : item.path}
                  onClick={item.onClick}
                  selected={!item.hasSubmenu && isActive(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                  {item.hasSubmenu && (item.open ? <ExpandLess /> : <ExpandMore />)}
                </ListItemButton>
              </ListItem>
              
              {item.hasSubmenu && (
                <Collapse in={item.open} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.submenu.map((subItem) => (
                      <ListItemButton
                        key={subItem.text}
                        sx={{ pl: 4 }}
                        component={subItem.onClick ? 'div' : RouterLink}
                        to={subItem.onClick ? undefined : subItem.path}
                        onClick={subItem.onClick}
                        selected={!subItem.onClick && isActive(subItem.path)}
                      >
                        <ListItemIcon>{subItem.icon}</ListItemIcon>
                        <ListItemText primary={subItem.text} />
                        {subItem.badge > 0 && (
                          <Badge badgeContent={subItem.badge} color="primary" />
                        )}
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          ))}
        </List>
        
        <Divider />
        
        <Box sx={{ mt: 'auto' }}>
          <List>
            {bottomMenuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  component={RouterLink}
                  to={item.path}
                  selected={isActive(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;