import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';

// Contexte et fournisseurs
import { ProjectProvider } from './contexts/ProjectContext';
import { CompanyProvider } from './contexts/CompanyContext';

// Composants communs
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Notifications from './components/common/Notifications';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Materials from './pages/Materials';
import NotFound from './pages/NotFound';
import Settings from './pages/Settings';
import FurnitureDesignerPage from './pages/FurnitureDesignerPage';

// Firebase
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Thème de l'application
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

// Composant pour encapsuler l'application authentifiée
const AuthenticatedApp = ({ user }) => {
  return (
    <ProjectProvider>
      <CompanyProvider>
        <Box sx={{ display: 'flex' }}>
          <Navbar user={user} />
          <Sidebar />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 0,
              mt: '64px', // Hauteur de la barre de navigation
              minHeight: 'calc(100vh - 64px)',
              background: '#f5f5f5',
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:projectId" element={<ProjectDetail />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="/settings" element={<Settings />} /> {/* Nouvelle route */}
              <Route path="/conception-3d" element={<FurnitureDesignerPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Box>
          <Notifications />
        </Box>
      </CompanyProvider>
    </ProjectProvider>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {user ? (
        <AuthenticatedApp user={user} />
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      )}
    </ThemeProvider>
  );
}

export default App;