import React from 'react';
import { Box, Container, Typography, Card, CardContent, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NewspaperList from '../newspapers/NewspaperList';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {!user && (
        <>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom
              sx={{
                fontFamily: 'Noto Nastaliq Urdu, serif',
                fontWeight: 'bold'
              }}
            >
              ذخیرہ خبر
            </Typography>
            <Typography 
              variant="h5" 
              color="text.secondary"
              sx={{
                fontFamily: 'Noto Nastaliq Urdu, serif',
                mb: 4
              }}
            >
              آپ کی ذاتی خبروں کا ذخیرہ
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 6
                  }
                }}
                onClick={() => navigate('/search')}
              >
                <CardContent>
                  <Typography 
                    variant="h5" 
                    component="h2" 
                    gutterBottom
                    sx={{
                      fontFamily: 'Noto Nastaliq Urdu, serif',
                      textAlign: 'right'
                    }}
                  >
                    تلاش کریں
                  </Typography>
                  <Typography 
                    sx={{
                      fontFamily: 'Noto Nastaliq Urdu, serif',
                      textAlign: 'right'
                    }}
                  >
                    خبروں میں تلاش کریں
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 6
                  }
                }}
                onClick={() => navigate('/trends')}
              >
                <CardContent>
                  <Typography 
                    variant="h5" 
                    component="h2" 
                    gutterBottom
                    sx={{
                      fontFamily: 'Noto Nastaliq Urdu, serif',
                      textAlign: 'right'
                    }}
                  >
                    رجحانات
                  </Typography>
                  <Typography 
                    sx={{
                      fontFamily: 'Noto Nastaliq Urdu, serif',
                      textAlign: 'right'
                    }}
                  >
                    الفاظ کے استعمال کے رجحانات دیکھیں
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 6
                  }
                }}
                onClick={() => navigate('/login')}
              >
                <CardContent>
                  <Typography 
                    variant="h5" 
                    component="h2" 
                    gutterBottom
                    sx={{
                      fontFamily: 'Noto Nastaliq Urdu, serif',
                      textAlign: 'right'
                    }}
                  >
                    لاگ ان کریں
                  </Typography>
                  <Typography 
                    sx={{
                      fontFamily: 'Noto Nastaliq Urdu, serif',
                      textAlign: 'right'
                    }}
                  >
                    اپنے اکاؤنٹ میں لاگ ان کریں
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
      
      <Box sx={{ mt: 4 }}>
        <NewspaperList />
      </Box>
    </Container>
  );
};

export default HomePage; 