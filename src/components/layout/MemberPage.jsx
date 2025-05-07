import React from 'react';
import { Container, Typography, Grid, Card, CardContent, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NewspaperList from '../newspapers/NewspaperList';

const MemberPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom
        sx={{
          fontFamily: 'Noto Nastaliq Urdu, serif',
          textAlign: 'right',
          mb: 4
        }}
      >
        {`خوش آمدید، ${user?.name || 'رکن'}`}
      </Typography>

      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%', 
              cursor: 'pointer',
              '&:hover': { boxShadow: 6 }
            }}
            onClick={() => navigate('/search')}
          >
            <CardContent>
              <Typography 
                variant="h5" 
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
              cursor: 'pointer',
              '&:hover': { boxShadow: 6 }
            }}
            onClick={() => navigate('/bookmarks')}
          >
            <CardContent>
              <Typography 
                variant="h5" 
                gutterBottom
                sx={{
                  fontFamily: 'Noto Nastaliq Urdu, serif',
                  textAlign: 'right'
                }}
              >
                محفوظ خبریں
              </Typography>
              <Typography 
                sx={{
                  fontFamily: 'Noto Nastaliq Urdu, serif',
                  textAlign: 'right'
                }}
              >
                اپنی محفوظ کردہ خبریں دیکھیں
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%', 
              cursor: 'pointer',
              '&:hover': { boxShadow: 6 }
            }}
            onClick={() => navigate('/trends')}
          >
            <CardContent>
              <Typography 
                variant="h5" 
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
      </Grid>

      <Box sx={{ mt: 4 }}>
        {/* <Typography 
          variant="h5" 
          component="h2" 
          gutterBottom
          sx={{
            fontFamily: 'Noto Nastaliq Urdu, serif',
            textAlign: 'right',
            mb: 3
          }}
        >
          دستیاب اخبارات
        </Typography> */}
        <NewspaperList />
      </Box>
    </Container>
  );
};

export default MemberPage; 