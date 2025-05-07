import React from 'react';
import { Box, Container, Typography, Link, Divider } from '@mui/material';
import { GitHub } from '@mui/icons-material';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              ذخیرہ خبر
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your Digital Archive of Urdu Newspapers
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: { xs: 'center', sm: 'flex-end' },
            }}
          >
            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
              <Link
                href="https://github.com/sikander-nawaz/FYP"
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
              >
                <GitHub />
              </Link>
            </Box>
            <Typography variant="body2" color="text.secondary">
              © {currentYear} Zakheerah-e-Khabar. All rights reserved.
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 1 }} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 3,
            flexWrap: 'wrap',
          }}
        >
          <Link href="/" color="inherit" underline="hover">
            Home
          </Link>
          <Link href="/newspapers" color="inherit" underline="hover">
            Newspapers
          </Link>
          <Link href="/search" color="inherit" underline="hover">
            Search
          </Link>
          <Link href="/trends" color="inherit" underline="hover">
            Trends
          </Link>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;