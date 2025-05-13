// src/components/furniture3d/FurnitureDesigner/components/dialogs/HelpDialog.js
import React from 'react';
import { Box, Paper, Typography, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import ConfigDialog from './ConfigDialog';
import HelpIcon from '@mui/icons-material/Help';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import HomeIcon from '@mui/icons-material/Home';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import GridOnIcon from '@mui/icons-material/GridOn';
import MouseIcon from '@mui/icons-material/Mouse';
import KeyboardIcon from '@mui/icons-material/Keyboard';

const HelpDialog = ({ open, onClose }) => {
  return (
    <ConfigDialog
      open={open}
      onClose={onClose}
      title="Aide et documentation"
      icon={HelpIcon}
      disableActions={true}
    >
      <Box sx={{ height: '100%', overflow: 'auto', p: 1 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Bienvenue dans OptiCoupe 3D
        </Typography>
        
        <Typography variant="body1" paragraph>
          Cette application vous permet de concevoir et visualiser des meubles en 3D. 
          Utilisez les outils dans la barre latérale pour configurer votre meuble.
        </Typography>
        
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Outils disponibles</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              <ListItem>
                <ListItemIcon><ViewInArIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Meuble V2" 
                  secondary="Configuration des dimensions principales et des options du meuble" 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><FormatListBulletedIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Liste des meubles" 
                  secondary="Gérer plusieurs meubles dans le projet" 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><GridOnIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Séparations" 
                  secondary="Ajouter et configurer les séparations internes du meuble" 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><HomeIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Pièce" 
                  secondary="Configurer les dimensions de la pièce et les murs" 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><VisibilityIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Affichage" 
                  secondary="Personnaliser les options d'affichage (axes, dimensions, etc.)" 
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>
        
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Navigation 3D</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              <ListItem>
                <ListItemIcon><MouseIcon /></ListItemIcon>
                <ListItemText 
                  primary="Rotation" 
                  secondary="Cliquez et faites glisser pour faire pivoter la vue" 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><MouseIcon /></ListItemIcon>
                <ListItemText 
                  primary="Zoom" 
                  secondary="Utilisez la molette de la souris pour zoomer/dézoomer" 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><MouseIcon /></ListItemIcon>
                <ListItemText 
                  primary="Panoramique" 
                  secondary="Maintenez Shift + cliquez et faites glisser pour déplacer la vue" 
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>
        
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Raccourcis clavier</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              <ListItem>
                <ListItemIcon><KeyboardIcon /></ListItemIcon>
                <ListItemText 
                  primary="Ctrl+Z" 
                  secondary="Annuler la dernière action" 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><KeyboardIcon /></ListItemIcon>
                <ListItemText 
                  primary="Ctrl+Y" 
                  secondary="Refaire l'action annulée" 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><KeyboardIcon /></ListItemIcon>
                <ListItemText 
                  primary="Ctrl+S" 
                  secondary="Sauvegarder le projet" 
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>
        
        <Paper elevation={0} sx={{ p: 2, mt: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Besoin d'aide supplémentaire?
          </Typography>
          <Typography variant="body2">
            Pour plus d'informations ou pour signaler un problème, contactez le support technique.
          </Typography>
        </Paper>
      </Box>
    </ConfigDialog>
  );
};

export default HelpDialog;