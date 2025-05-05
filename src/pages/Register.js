import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Link,
  Grid,
  Paper,
  Avatar,
  CssBaseline,
  FormControlLabel,
  Checkbox,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  LockOutlined as LockOutlinedIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const Register = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Étapes du processus d'inscription
  const steps = ['Informations personnelles', 'Sécurité', 'Confirmation'];

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: newValue,
    });
    
    // Nettoyer l'erreur du champ modifié
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: '',
      });
    }
    
    setError('');
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validateStep = (step) => {
    const errors = {};
    let isValid = true;

    if (step === 0) {
      // Validation des informations personnelles
      if (!formData.firstName.trim()) {
        errors.firstName = 'Le prénom est requis';
        isValid = false;
      }

      if (!formData.lastName.trim()) {
        errors.lastName = 'Le nom est requis';
        isValid = false;
      }

      if (!formData.email.trim()) {
        errors.email = 'L\'adresse e-mail est requise';
        isValid = false;
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'L\'adresse e-mail est invalide';
        isValid = false;
      }
    } else if (step === 1) {
      // Validation du mot de passe
      if (!formData.password) {
        errors.password = 'Le mot de passe est requis';
        isValid = false;
      } else if (formData.password.length < 6) {
        errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
        isValid = false;
      }

      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Veuillez confirmer votre mot de passe';
        isValid = false;
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Les mots de passe ne correspondent pas';
        isValid = false;
      }
    } else if (step === 2) {
      // Validation des conditions d'utilisation
      if (!formData.acceptTerms) {
        errors.acceptTerms = 'Vous devez accepter les conditions d\'utilisation';
        isValid = false;
      }
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(activeStep)) return;
    
    setLoading(true);
    try {
      // Créer le compte utilisateur dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      
      const user = userCredential.user;
      
      // Mettre à jour le profil utilisateur
      await updateProfile(user, {
        displayName: `${formData.firstName} ${formData.lastName}`,
      });
      
      // Créer un document utilisateur dans Firestore
      await setDoc(doc(db, 'users', user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        company: formData.company || '',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
      
      // La redirection sera gérée automatiquement par l'écouteur dans App.js
    } catch (error) {
      console.error('Error registering user:', error);
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('Cette adresse e-mail est déjà utilisée par un autre compte.');
          break;
        case 'auth/invalid-email':
          setError('Adresse e-mail invalide.');
          break;
        case 'auth/weak-password':
          setError('Le mot de passe est trop faible.');
          break;
        default:
          setError(`Erreur lors de l'inscription: ${error.message}`);
      }
      
      setActiveStep(error.code === 'auth/email-already-in-use' ? 0 : 1);
    } finally {
      setLoading(false);
    }
  };

  // Rendu des étapes du formulaire
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="firstName"
                  required
                  fullWidth
                  id="firstName"
                  label="Prénom"
                  autoFocus
                  value={formData.firstName}
                  onChange={handleChange}
                  error={!!fieldErrors.firstName}
                  helperText={fieldErrors.firstName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="lastName"
                  label="Nom"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={!!fieldErrors.lastName}
                  helperText={fieldErrors.lastName}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Adresse e-mail"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!fieldErrors.email}
                  helperText={fieldErrors.email}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="company"
                  label="Entreprise (facultatif)"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleNext}
                sx={{ mt: 3, ml: 1 }}
              >
                Suivant
              </Button>
            </Box>
          </>
        );
      case 1:
        return (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Mot de passe"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  error={!!fieldErrors.password}
                  helperText={fieldErrors.password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirmer le mot de passe"
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={!!fieldErrors.confirmPassword}
                  helperText={fieldErrors.confirmPassword}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={handleToggleConfirmPasswordVisibility}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button onClick={handleBack}>Retour</Button>
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Suivant
              </Button>
            </Box>
          </>
        );
      case 2:
        return (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Vérifiez vos informations :</Typography>
                <Box sx={{ mt: 2, mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="body1">
                    <strong>Nom complet :</strong> {formData.firstName} {formData.lastName}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Email :</strong> {formData.email}
                  </Typography>
                  {formData.company && (
                    <Typography variant="body1">
                      <strong>Entreprise :</strong> {formData.company}
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleChange}
                      color="primary"
                    />
                  }
                  label="J'accepte les conditions d'utilisation et la politique de confidentialité"
                />
                {fieldErrors.acceptTerms && (
                  <Typography color="error" variant="caption">
                    {fieldErrors.acceptTerms}
                  </Typography>
                )}
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button onClick={handleBack}>Retour</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading ? <CircularProgress size={24} /> : 'S\'inscrire'}
              </Button>
            </Box>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            Inscription à OptiCoupe
          </Typography>
          
          <Stepper activeStep={activeStep} sx={{ width: '100%', mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" noValidate sx={{ mt: 1, width: '100%' }}>
            {renderStepContent(activeStep)}
          </Box>
        </Paper>
        
        <Grid container justifyContent="flex-end" sx={{ mt: 3 }}>
          <Grid item>
            <Link component={RouterLink} to="/login" variant="body2">
              Vous avez déjà un compte ? Connectez-vous
            </Link>
          </Grid>
        </Grid>
      </Box>
      <Box sx={{ mt: 8, mb: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {'© '}
          {new Date().getFullYear()}
          {' OptiCoupe - Tous droits réservés'}
        </Typography>
      </Box>
    </Container>
  );
};

export default Register;