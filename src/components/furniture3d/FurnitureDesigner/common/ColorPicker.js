// src/components/furniture3d/FurnitureDesigner/common/ColorPicker.js
import React, { useState } from 'react';
import { 
  TextField, 
  InputAdornment, 
  Popover, 
  Box, 
  Button,
  Grid
} from '@mui/material';
import { SketchPicker } from 'react-color';

export const ColorPicker = ({ value, onChange, label, disabled = false }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [tempColor, setTempColor] = useState(value);
  
  const handleClick = (event) => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
      setTempColor(value);
    }
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleChange = (color) => {
    setTempColor(color.hex);
  };
  
  const handleAccept = () => {
    onChange(tempColor);
    handleClose();
  };
  
  const open = Boolean(anchorEl);
  
  return (
    <>
      <TextField
        fullWidth
        label={label}
        value={value}
        onClick={handleClick}
        InputProps={{
          readOnly: true,
          startAdornment: (
            <InputAdornment position="start">
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  bgcolor: value,
                  borderRadius: 1,
                  border: '1px solid #ccc'
                }}
              />
            </InputAdornment>
          )
        }}
        disabled={disabled}
      />
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2 }}>
          <SketchPicker 
            color={tempColor}
            onChange={handleChange}
          />
          <Grid container spacing={1} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Button 
                fullWidth 
                variant="outlined" 
                onClick={handleClose}
              >
                Annuler
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button 
                fullWidth 
                variant="contained" 
                color="primary"
                onClick={handleAccept}
              >
                Appliquer
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Popover>
    </>
  );
};