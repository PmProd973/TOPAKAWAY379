import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  FolderOpen as ProjectsIcon,
  Layers as MaterialsIcon,
  Speed as EfficiencyIcon,
  Extension as PiecesIcon,
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useProjects } from '../contexts/ProjectContext';

const Dashboard = () => {
  const { projects, loading, getRecentProjects, getStarredProjects } = useProjects();
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalMaterials: 0,
    totalPieces: 0,
    avgEfficiency: 0,
    projectsInProgress: 0,
    projectsOptimized: 0
  });

  useEffect(() => {
    if (!loading && projects.length > 0) {
      // Calculer les statistiques de base
      const totalPieces = projects.reduce((sum, p) => sum + (p.totalPieces || 0), 0);
      
      // Projets avec efficacité calculée
      const projectsWithEfficiency = projects.filter(p => p.efficiency > 0);
      const avgEfficiency = projectsWithEfficiency.length > 0
        ? Math.round(projectsWithEfficiency.reduce((sum, p) => sum + p.efficiency, 0) / projectsWithEfficiency.length)
        : 0;
      
      // Comptage des statuts
      const projectsInProgress = projects.filter(p => p.status === 'in_progress').length;
      const projectsOptimized = projects.filter(p => p.status === 'optimized').length;
      
      setStats({
        totalProjects: projects.length,
        totalMaterials: 0, // À compléter avec la récupération des matériaux depuis Firebase
        totalPieces,
        avgEfficiency,
        projectsInProgress,
        projectsOptimized
      });
    }
  }, [projects, loading]);

  const recentProjects = getRecentProjects(7).slice(0, 5);
  const starredProjects = getStarredProjects().slice(0, 5);

  // Fonction pour formater la date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    // Convertir le timestamp Firestore en Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Style pour les cartes
  const cardStyle = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  };

  // Fonction pour obtenir la couleur selon le statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'default';
      case 'in_progress': return 'primary';
      case 'optimized': return 'success';
      case 'issue': return 'error';
      default: return 'default';
    }
  };

  // Fonction pour obtenir le libellé du statut
  const getStatusLabel = (status) => {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'in_progress': return 'En cours';
      case 'optimized': return 'Optimisé';
      case 'issue': return 'Problème';
      default: return 'Inconnu';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Tableau de bord
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Cartes de statistiques */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <ProjectsIcon />
                  </Avatar>
                  <Typography variant="h6" component="div">
                    Projets
                  </Typography>
                </Box>
                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {stats.totalProjects}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    {stats.projectsInProgress} en cours
                  </Typography>
                  <Chip
                    size="small"
                    label={`${stats.projectsOptimized} optimisés`}
                    color="success"
                  />
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                    <PiecesIcon />
                  </Avatar>
                  <Typography variant="h6" component="div">
                    Pièces
                  </Typography>
                </Box>
                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {stats.totalPieces}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Nombre total de pièces
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                    <MaterialsIcon />
                  </Avatar>
                  <Typography variant="h6" component="div">
                    Matériaux
                  </Typography>
                </Box>
                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {stats.totalMaterials}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total en bibliothèque
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                    <EfficiencyIcon />
                  </Avatar>
                  <Typography variant="h6" component="div">
                    Efficacité
                  </Typography>
                </Box>
                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {stats.avgEfficiency}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Moyenne de tous les projets
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Contenu principal */}
          <Grid container spacing={3}>
            {/* Liste des projets récents */}
            <Grid item xs={12} md={6}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Typography variant="h6" component="h2" gutterBottom>
                    Projets récents
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {recentProjects.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      Aucun projet récent à afficher
                    </Typography>
                  ) : (
                    <List sx={{ p: 0 }}>
                      {recentProjects.map((project) => (
                        <ListItem
                          key={project.id}
                          component={Link}
                          to={`/projects/${project.id}`}
                          sx={{
                            borderRadius: 1,
                            mb: 1,
                            '&:hover': { bgcolor: 'action.hover' },
                            textDecoration: 'none',
                            color: 'inherit'
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar>
                              <ProjectsIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={project.name}
                            secondary={`Modifié le ${formatDate(project.updatedAt)}`}
                          />
                          <Chip
                            size="small"
                            label={getStatusLabel(project.status)}
                            color={getStatusColor(project.status)}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
                <CardActions sx={{ mt: 'auto', p: 2, pt: 0 }}>
                  <Button
                    component={Link}
                    to="/projects"
                    endIcon={<ArrowForwardIcon />}
                    size="small"
                  >
                    Voir tous les projets
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            {/* Liste des projets favoris */}
            <Grid item xs={12} md={6}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Typography variant="h6" component="h2" gutterBottom>
                    Projets favoris
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {starredProjects.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      Aucun projet favori à afficher
                    </Typography>
                  ) : (
                    <List sx={{ p: 0 }}>
                      {starredProjects.map((project) => (
                        <ListItem
                          key={project.id}
                          component={Link}
                          to={`/projects/${project.id}`}
                          sx={{
                            borderRadius: 1,
                            mb: 1,
                            '&:hover': { bgcolor: 'action.hover' },
                            textDecoration: 'none',
                            color: 'inherit'
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar>
                              <ProjectsIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={project.name}
                            secondary={
                              <>
                                {project.client && `Client: ${project.client}`}
                                {project.client && project.deadline && ' | '}
                                {project.deadline && `Échéance: ${formatDate(project.deadline)}`}
                              </>
                            }
                          />
                          {project.efficiency > 0 && (
                            <Box sx={{ minWidth: 80, textAlign: 'right' }}>
                              <Typography variant="body2" color="text.secondary">
                                {project.efficiency}%
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={project.efficiency}
                                sx={{ height: 4, borderRadius: 1 }}
                                color={project.efficiency > 80 ? "success" : "primary"}
                              />
                            </Box>
                          )}
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
                <CardActions sx={{ mt: 'auto', p: 2, pt: 0 }}>
                  <Button
                    component={Link}
                    to="/projects?tab=starred"
                    endIcon={<ArrowForwardIcon />}
                    size="small"
                  >
                    Voir tous les favoris
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            {/* Actions rapides */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  Actions rapides
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      component={Link}
                      to="/projects"
                      state={{ openCreateDialog: true }}
                      startIcon={<AddIcon />}
                      fullWidth
                      sx={{ py: 1 }}
                    >
                      Nouveau projet
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      component={Link}
                      to="/materials?tab=panels"
                      startIcon={<AddIcon />}
                      fullWidth
                      sx={{ py: 1 }}
                    >
                      Nouveau matériau
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      component={Link}
                      to="/materials?tab=edgings"
                      startIcon={<AddIcon />}
                      fullWidth
                      sx={{ py: 1 }}
                    >
                      Nouveau chant
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      component={Link}
                      to="/materials?tab=hardware"
                      startIcon={<AddIcon />}
                      fullWidth
                      sx={{ py: 1 }}
                    >
                      Nouvelle quincaillerie
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Dashboard;