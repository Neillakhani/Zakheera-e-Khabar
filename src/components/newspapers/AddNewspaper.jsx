import { useState } from 'react';
import { newspaperService } from '../../services/newspaperService';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';

export default function AddNewspaper() {
  const [date, setDate] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateForm = () => {
    if (!date) {
      setError('Please select a date');
      return false;
    }

    if (!content.trim()) {
      setError('Please enter the newspaper content');
      return false;
    }

    // Additional validation for date format
    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      setError('Invalid date format');
      return false;
    }

    // Split content into paragraphs (articles)
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    
    if (paragraphs.length === 0) {
      setError('Please enter at least one article');
      return false;
    }

    // Validate each article
    for (let i = 0; i < paragraphs.length; i++) {
      const lines = paragraphs[i].trim().split('\n');
      if (lines.length < 2) {
        setError(`Article ${i + 1} must have both a headline and content`);
        return false;
      }
      if (lines[0].length < 3) {
        setError(`Article ${i + 1} has too short headline`);
        return false;
      }
      if (lines.slice(1).join('\n').trim().length < 10) {
        setError(`Article ${i + 1} has too short content`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const paragraphs = content.split('\n\n').filter(p => p.trim());
      console.log('Submitting newspaper with:', {
        date,
        contentLength: content.length,
        numberOfArticles: paragraphs.length,
        articles: paragraphs.map((p, i) => ({
          articleNumber: i + 1,
          preview: p.substring(0, 100) + '...'
        }))
      });

      const response = await newspaperService.createNewspaper(date, content);
      console.log('Newspaper creation successful:', response);
      
      setSuccess(`Newspaper created successfully with ${paragraphs.length} articles! Filename: ${response.filename}`);
      // Reset form
      setDate('');
      setContent('');
    } catch (err) {
      console.error('Error in handleSubmit:', {
        error: err,
        message: err.message,
        response: err.response
      });
      
      // More detailed error message
      const errorMessage = err.error || err.message || 'Failed to create newspaper';
      setError(`Error: ${errorMessage}. ${err.response?.data?.error || ''}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Add New Newspaper
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Enter the newspaper date and articles in Urdu
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Format: Separate each article with a blank line. For each article:
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, pl: 2 }}>
          • First line: Article headline<br />
          • Following lines: Article content<br />
          • Add a blank line between articles
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            type="date"
            label="Newspaper Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ mb: 3 }}
            required
          />

          <TextField
            fullWidth
            label="Newspaper Articles"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            multiline
            rows={20}
            required
            placeholder="Article 1 Headline in Urdu
Article 1 content in Urdu...

Article 2 Headline in Urdu
Article 2 content in Urdu...

(Add more articles in the same format)"
            sx={{
              mb: 3,
              '& .MuiInputBase-input': {
                fontFamily: 'Noto Nastaliq Urdu, serif',
                direction: 'rtl',
                textAlign: 'right'
              }
            }}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Newspaper'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
} 