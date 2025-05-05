import React from 'react';
import { Snackbar, Alert, Stack } from '@mui/material';
import { useProjects } from '../../contexts/ProjectContext';

const Notifications = () => {
  const { notifications, removeNotification } = useProjects();

  const handleClose = (id) => () => {
    removeNotification(id);
  };

  return (
    <Stack spacing={2} sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1400 }}>
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={6000}
          onClose={handleClose(notification.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ position: 'relative', transform: 'none', maxWidth: '100%' }}
        >
          <Alert
            onClose={handleClose(notification.id)}
            severity={notification.type}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </Stack>
  );
};

export default Notifications;