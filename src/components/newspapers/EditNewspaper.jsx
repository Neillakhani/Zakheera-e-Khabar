import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { ArrowBack, Save as SaveIcon } from '@mui/icons-material';

export default function EditNewspaper() {
  const [newspaper, setNewspaper] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null });
  const { filename } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNewspaper();
  }, [filename]);

  const fetchNewspaper = async () => {
    try {
      const data = await newspaperService.getNewspaperDetail(filename);
      setNewspaper(data);
      setArticles(data.articles);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch newspaper');
      setLoading(false);
    }
  };

  const handleArticleChange = (index, field, value) => {
    const updatedArticles = [...articles];
    updatedArticles[index] = {
      ...updatedArticles[index],
      [field]: value
    };
    setArticles(updatedArticles);
    setUnsavedChanges(true);
  };

  const validateArticles = () => {
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      if (!article.headline?.trim()) {
        setError(`Article ${i + 1} must have a headline`);
        return false;
      }
      if (!article.content?.trim()) {
        setError(`Article ${i + 1} must have content`);
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateArticles()) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await newspaperService.updateNewspaper(filename, articles);
      setSuccess('Newspaper updated successfully');
      setUnsavedChanges(false);
    } catch (err) {
      setError(err.message || 'Failed to update newspaper');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (unsavedChanges) {
      setConfirmDialog({
        open: true,
        action: () => navigate(`/admin`)
      });
    } else {
      navigate(`/admin`);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBack}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1">
            Edit Newspaper
          </Typography>
          <Button
            startIcon={<SaveIcon />}
            variant="contained"
            onClick={handleSave}
            disabled={saving || !unsavedChanges}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>

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

        {articles.map((article, index) => (
          <Paper key={index} elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Article {index + 1}
            </Typography>
            
            <TextField
              fullWidth
              label="Headline"
              value={article.headline}
              onChange={(e) => handleArticleChange(index, 'headline', e.target.value)}
              sx={{
                mb: 2,
                '& .MuiInputBase-input': {
                  fontFamily: 'Noto Nastaliq Urdu, serif',
                  direction: 'rtl',
                  textAlign: 'right'
                }
              }}
            />

            <TextField
              fullWidth
              label="Content"
              value={article.content}
              onChange={(e) => handleArticleChange(index, 'content', e.target.value)}
              multiline
              rows={8}
              sx={{
                '& .MuiInputBase-input': {
                  fontFamily: 'Noto Nastaliq Urdu, serif',
                  direction: 'rtl',
                  textAlign: 'right'
                }
              }}
            />
          </Paper>
        ))}
      </Paper>

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      >
        <DialogTitle>Unsaved Changes</DialogTitle>
        <DialogContent>
          <Typography>
            You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setConfirmDialog({ ...confirmDialog, open: false });
              confirmDialog.action();
            }}
            color="error"
          >
            Leave
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 