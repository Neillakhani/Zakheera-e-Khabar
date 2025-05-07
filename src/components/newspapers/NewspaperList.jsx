import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { newspaperService } from '../../services/newspaperService';
import { getProcessedNewspapers, generateNewspaperSummaries, deleteNewspaper as deleteMongoNewspaper } from '../../services/ocrService';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  CardActions,
  CardActionArea,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Pagination,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Article as ArticleIcon,
  CalendarToday,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Summarize as SummarizeIcon,
  LibraryBooks as LibraryIcon,
  NewReleases as NewIcon
} from '@mui/icons-material';

export default function NewspaperList({ refreshTrigger = 0 }) {
  const [newspapers, setNewspapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, newspaper: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(1);
  const [summarizing, setSummarizing] = useState(false);
  const [summarizingId, setSummarizingId] = useState(null);
  
  const ITEMS_PER_PAGE = 6; // Show 6 items per page
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNewspapers();
  }, [refreshTrigger]); // Re-fetch when refreshTrigger changes

  const fetchNewspapers = async () => {
    try {
      setLoading(true);
      
      // Fetch newspapers from MongoDB only
      const mongoNewspapers = await getProcessedNewspapers();
      console.log('MongoDB newspapers:', mongoNewspapers);
      
      // Transform MongoDB newspapers to our display format
      const transformedNewspapers = mongoNewspapers.map(newspaper => ({
        filename: `mongo_${newspaper.id}`,
        title: newspaper.date,
        date: newspaper.date,
        modified_date: newspaper.processing_timestamp || newspaper.date,
        article_count: newspaper.total_articles || 0,
        size: newspaper.page_count ? newspaper.page_count * 2 : 0, // Size now represents page count
        source: 'mongodb',
        mongo_id: newspaper.id,
        has_summaries: newspaper.has_summaries,
        language: newspaper.language || 'Urdu',
        page_count: newspaper.page_count || 1
      }));
      
      // Sort newspapers by date (newest first)
      const sortedNewspapers = transformedNewspapers.sort((a, b) => 
        new Date(b.modified_date) - new Date(a.modified_date)
      );
      
      setNewspapers(sortedNewspapers);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch newspapers:', err);
      setError(err.message || 'Failed to fetch newspapers');
      setLoading(false);
    }
  };

  const handleDeleteClick = (e, newspaper) => {
    e.stopPropagation(); // Prevent card click event
    setDeleteDialog({ open: true, newspaper });
  };

  const handleEditClick = (e, filename) => {
    e.stopPropagation(); // Prevent card click event
    navigate(`/admin/edit-newspaper/${filename}`);
  };

  const handleDeleteConfirm = async () => {
    const { newspaper } = deleteDialog;
    try {
      console.log('Deleting newspaper:', newspaper);
      
      // Check if this is a MongoDB newspaper by checking the source property
      if (newspaper.source === 'mongodb') {
        // This is a MongoDB newspaper - use the ocrService deletion function
        console.log('Deleting MongoDB newspaper with ID:', newspaper.mongo_id);
        await deleteMongoNewspaper(newspaper.mongo_id);
      } else {
        // This is a text newspaper - use the text newspaper service
        console.log('Deleting text newspaper with filename:', newspaper.filename);
        await newspaperService.deleteNewspaper(newspaper.filename);
      }
      
      // Remove the newspaper from the list based on filename
      setNewspapers(newspapers.filter(n => n.filename !== newspaper.filename));
      
      setSnackbar({
        open: true,
        message: 'Newspaper deleted successfully',
        severity: 'success'
      });
      
      // Close dialog after success
      setDeleteDialog({ open: false, newspaper: null });
    } catch (err) {
      console.error('Error deleting newspaper:', err);
      setSnackbar({
        open: true,
        message: err.error || err.message || 'Failed to delete newspaper',
        severity: 'error'
      });
      // Close dialog on error
      setDeleteDialog({ open: false, newspaper: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, newspaper: null });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatFileName = (filename) => {
    return filename.replace('.json', '').split('_').join(' ').toUpperCase();
  };

  const handleCardClick = (newspaper) => {
    // Navigate to the MongoDB newspaper detail page
    navigate(`/newspaper/mongo/${newspaper.mongo_id}`);
  };
  
  // Generate summaries for a newspaper
  const handleGenerateSummaries = async (newspaperId) => {
    if (summarizing) return;
    
    try {
      setSummarizing(true);
      setSummarizingId(newspaperId);
      
      // Call the API to generate summaries
      const result = await generateNewspaperSummaries(newspaperId);
      
      // Show success message
      setSnackbar({
        open: true,
        message: result.message || 'Summaries generated successfully',
        severity: 'success'
      });
      
      // Refresh the newspaper list to show updated summary status
      fetchNewspapers();
    } catch (error) {
      console.error('Failed to generate summaries:', error);
      setSnackbar({
        open: true,
        message: error.error || 'Failed to generate summaries',
        severity: 'error'
      });
    } finally {
      setSummarizing(false);
      setSummarizingId(null);
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
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography 
        variant="h2" 
        gutterBottom 
        component="div" 
        color="text.primary"
        sx={{ 
          textAlign: 'right',
          mt: -2,
          mb: 5,
          fontSize: '1.5rem',
        }}
      >
        دستیاب اخبارات
      </Typography>
      <Grid container spacing={3}>
        {newspapers
          .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
          .map((newspaper) => (
          <Grid item xs={12} sm={6} md={4} key={newspaper.filename}>
            <Card 
  elevation={4} // Slightly higher elevation for a soft shadow
  sx={{
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
    borderRadius: '16px', // Increased border-radius for a softer look
    overflow: 'hidden', // Ensures rounded corners apply properly
    backgroundColor: '#fff', // Ensures a clean background
    '&:hover': {
      transform: 'scale(1.03)', // Slightly more noticeable hover effect
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)', // Enhanced shadow on hover
    },
  }}
>
  <CardActionArea 
    sx={{ flexGrow: 1 }}
    onClick={() => handleCardClick(newspaper)}
  >
    <CardContent sx={{ padding: '20px' }}> {/* Added padding for breathing space */}
      <Typography 
        variant="h3" 
        component="h2" 
        color="primary"
        gutterBottom
        sx={{
          fontFamily: 'Georgia',
          textAlign: 'right',
          fontSize: '1.5rem',
        }}
      >
        {newspaper.title}
        <Tooltip title="OCR Processed & Stored in MongoDB">
          <NewIcon fontSize="small" color="primary" sx={{ ml: 1, verticalAlign: 'middle' }} />
        </Tooltip>
      </Typography>
      
      {/* Date Information */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <CalendarToday sx={{ fontSize: 'medium', mr: 1, color: "text.secondary" }} />
        <Typography variant="body1" color="text.secondary" sx={{ fontFamily: "Georgia" }}>
          {formatDate(newspaper.modified_date)}
        </Typography>
      </Box>

      {/* Article Count */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <ArticleIcon sx={{ fontSize: 'medium', mr: 1, color: "text.secondary" }} />
        <Typography variant="body1" color="text.secondary" sx={{ fontFamily: "Georgia" }}>
          {newspaper.article_count} Articles
        </Typography>
      </Box>
      
      {/* Summary Status - Only for MongoDB newspapers */}
      {newspaper.source === 'mongodb' && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <SummarizeIcon sx={{ fontSize: 'medium', mr: 1, color: newspaper.has_summaries ? "success.main" : "text.secondary" }} />
          <Typography 
            variant="body1" 
            color={newspaper.has_summaries ? "success.main" : "text.secondary"} 
            sx={{ fontFamily: "Georgia" }}
          >
            {newspaper.has_summaries ? "Summaries Available" : "No Summaries"}
          </Typography>
        </Box>
      )}
    </CardContent>
  </CardActionArea>

  {/* Footer - Actions */}
  <CardActions sx={{ justifyContent: 'space-between', p: 2, borderTop: '1px solid #ddd' }}>
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Chip 
        label={newspaper.language || 'Urdu'}
        size="small"
        color="primary"
        variant="outlined"
        icon={<LibraryIcon fontSize="small" />}
        sx={{ paddingBottom: "6px", fontWeight: 'bold', borderRadius: '8px' }}
      />
      <Chip 
        label={`${newspaper.page_count} Pages`}
        size="small"
        color="secondary"
        variant="outlined"
        sx={{ paddingBottom: "6px", fontWeight: 'bold', borderRadius: '8px' }}
      />
    </Box>
                {user?.role === 'admin' && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {/* Generate Summaries button for MongoDB newspapers without summaries */}
                    {!newspaper.has_summaries && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        startIcon={<SummarizeIcon />}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          handleGenerateSummaries(newspaper.mongo_id);
                        }}
                        sx={{ mr: 1 }}
                      >
                        Generate Summaries
                      </Button>
                    )}
                    
                    {/* No Edit button since we're only using MongoDB newspapers */}
                    
                    {/* Delete button */}
                    <IconButton
                      color="error"
                      onClick={(e) => handleDeleteClick(e, newspaper)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
        <Pagination
          count={Math.ceil(newspapers.length / ITEMS_PER_PAGE)}
          page={page}
          onChange={(event, newPage) => {
            setPage(newPage);
            // Scroll to the top of the page
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          color="primary"
          size="large"
          showFirstButton
          showLastButton
        />
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Newspaper</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the newspaper from {formatFileName(deleteDialog.newspaper?.filename || '')}?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 