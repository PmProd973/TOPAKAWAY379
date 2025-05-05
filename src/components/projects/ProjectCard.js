import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Box,
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  IconButton, 
  Button, 
  Chip,
  LinearProgress,
  Tooltip
} from '@mui/material';
import { 
  MoreVert as MoreVertIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const ProjectCard = ({ project, onMenuOpen }) => {
  const handleToggleStar = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, {
        starred: !project.starred
      });
    } catch (error) {
      console.error('Error toggling project star:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return { color: 'default', icon: null };
      case 'in_progress':
        return { color: 'primary', icon: null };
      case 'optimized':
        return { color: 'success', icon: <CheckCircleIcon /> };
      case 'issue':
        return { color: 'error', icon: <WarningIcon /> };
      default:
        return { color: 'default', icon: null };
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'in_progress':
        return 'En cours';
      case 'optimized':
        return 'Optimisé';
      case 'issue':
        return 'Problème';
      default:
        return 'Inconnu';
    }
  };

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

  const isDeadlineSoon = () => {
    if (!project.deadline) return false;
    
    const deadlineDate = new Date(project.deadline);
    const today = new Date();
    
    // Calcul de la différence en jours
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 && diffDays <= 7;
  };

  const deadlinePassed = () => {
    if (!project.deadline) return false;
    
    const deadlineDate = new Date(project.deadline);
    const today = new Date();
    
    return deadlineDate < today;
  };

  const progressPercentage = 
    project.totalPieces > 0 
      ? Math.round((project.completedPieces / project.totalPieces) * 100) 
      : 0;

  const statusInfo = getStatusColor(project.status);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* En-tête avec nom et actions */}
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: 'calc(100% - 80px)' }}>
            <IconButton 
              size="small" 
              onClick={handleToggleStar}
              sx={{ mr: 1, color: project.starred ? 'warning.main' : 'action.disabled' }}
            >
              {project.starred ? <StarIcon /> : <StarBorderIcon />}
            </IconButton>
            <Typography variant="h6" component="h2" noWrap>
              {project.name}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={(e) => onMenuOpen(e, project)}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
        
        {/* Description du projet */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mt: 1, 
            mb: 2, 
            height: 40, 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {project.description || 'Aucune description'}
        </Typography>
        
        {/* Statut et badges */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip 
            label={getStatusLabel(project.status)} 
            color={statusInfo.color} 
            size="small"
            icon={statusInfo.icon}
          />
          
          {project.deadline && (
            <Tooltip title={deadlinePassed() ? "Échéance dépassée" : isDeadlineSoon() ? "Échéance proche" : "Échéance"}>
              <Chip 
                icon={<AccessTimeIcon />}
                label={formatDate(project.deadline)}
                size="small"
                color={deadlinePassed() ? "error" : isDeadlineSoon() ? "warning" : "default"}
              />
            </Tooltip>
          )}
        </Box>
        
        {/* Informations du projet */}
        <Box sx={{ mb: 2 }}>
          {project.client && (
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Client:</strong> {project.client}
            </Typography>
          )}
          
          {project.totalPieces > 0 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2">
                  <strong>Pièces:</strong> {project.completedPieces || 0}/{project.totalPieces}
                </Typography>
                <Typography variant="body2">
                  {progressPercentage}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progressPercentage} 
                sx={{ height: 6, borderRadius: 1, mb: 1 }}
                color={progressPercentage === 100 ? "success" : "primary"}
              />
            </>
          )}
          
          {project.efficiency > 0 && (
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Efficacité:</strong> {project.efficiency}%
            </Typography>
          )}
        </Box>
        
        {/* Date de dernière modification */}
        <Typography variant="caption" color="text.secondary" display="block">
          Modifié le {formatDate(project.updatedAt)}
        </Typography>
      </CardContent>
      
      {/* Actions du bas de carte */}
      <CardActions>
        <Button 
          size="small" 
          component={Link} 
          to={`/projects/${project.id}`}
        >
          Ouvrir
        </Button>
      </CardActions>
    </Card>
  );
};

export default ProjectCard;