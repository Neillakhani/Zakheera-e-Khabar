import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { newspaperService } from '../../services/newspaperService';
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';

export default function ArticleSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { filename, articleIndex } = useParams();

  useEffect(() => {
    fetchSummary();
  }, [filename, articleIndex]);

  const fetchSummary = async () => {
    try {
      const data = await newspaperService.getArticleSummary(filename, articleIndex);
      setSummary(data);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch summary');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
          Article Summary
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ 
            fontFamily: 'Noto Nastaliq Urdu, serif',
            textAlign: 'right',
            direction: 'rtl',
            fontSize: '1.8rem',
            fontWeight: 'bold'
          }}>
            {summary?.article?.headline}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body1" sx={{ 
            fontFamily: 'Noto Nastaliq Urdu, serif',
            textAlign: 'right',
            direction: 'rtl',
            fontSize: '1.2rem',
            lineHeight: 2
          }}>
            {summary?.summary}
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Original Article Date: {summary?.article?.newspaper_date}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
} 