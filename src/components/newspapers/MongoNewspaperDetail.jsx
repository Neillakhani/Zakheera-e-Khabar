import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookmarkService } from '../../services/bookmarkService';
import { getNewspaperDetails, updateMongoNewspaper, deleteNewspaper } from '../../services/ocrService';
import { useAuth } from '../../contexts/AuthContext';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Button,
  Stack,
  Snackbar,
  Modal,
  Card,
  CardContent,
  CardHeader,
  Pagination,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack,
  Summarize,
  BookmarkBorder,
  Bookmark,
  Edit as EditIcon,
  Close as CloseIcon,
  DateRange as DateIcon,
  Info as InfoIcon,
  Article as ArticleIcon,
  LibraryBooks as LibraryIcon,
} from '@mui/icons-material';

export default function MongoNewspaperDetail() {
  const [newspaper, setNewspaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookmarkedArticles, setBookmarkedArticles] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [summaryModal, setSummaryModal] = useState({ open: false, articleIndex: null, summary: '', loading: false });
  
  // Editing state variables
  const [isEditing, setIsEditing] = useState(false);
  const [editingArticleIndex, setEditingArticleIndex] = useState(null);
  const [editedNewspaper, setEditedNewspaper] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Individual article editing state
  const [articleEditing, setArticleEditing] = useState({});
  const [editedArticleContent, setEditedArticleContent] = useState({});
  const [savingArticle, setSavingArticle] = useState(false);
  
  // Delete newspaper state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Pagination state for articles
  const [articlePage, setArticlePage] = useState(1);
  const ARTICLES_PER_PAGE = 5;

  const { newspaperId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchNewspaperDetail();
  }, [newspaperId]);

  // Only check bookmarks for member users (non-admin logged-in users)
  useEffect(() => {
    // Only run for member users (logged in and not admin)
    if (user && !user.is_admin && newspaper?.articles) {
      checkBookmarkedArticles();
    }
  }, [user, newspaper]);
  
  // Recheck bookmark status when component mounts and after any bookmark action
  useEffect(() => {
    if (user && !user.is_admin && newspaper?.articles) {
      // Set a small delay to ensure the backend has processed any recent bookmark changes
      const timer = setTimeout(() => {
        checkBookmarkedArticles();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  const fetchNewspaperDetail = async () => {
    try {
      setLoading(true);
      const data = await getNewspaperDetails(newspaperId);
      console.log('MongoDB newspaper details:', data);
      setNewspaper(data);
    } catch (err) {
      console.error('Error fetching newspaper:', err);
      setError(err.message || 'Failed to fetch newspaper details');
    } finally {
      setLoading(false);
    }
  };

  const checkBookmarkedArticles = async () => {
    try {
      console.log('Checking bookmarked articles for newspaper:', newspaperId);
      const bookmarks = {};
      if (newspaper?.articles) {
        // First try to get all bookmarks at once to reduce API calls
        try {
          const allBookmarks = await bookmarkService.getBookmarks();
          console.log('Retrieved bookmarks:', allBookmarks);
          
          // Correctly parse bookmark IDs for MongoDB articles
          // Expected format: mongo_[newspaperId]_[articleIndex]
          const bookmarkMap = {};
          
          allBookmarks.bookmarks.forEach(bm => {
            // Extract the article index from the last part
            const parts = bm.id.split('_');
            if (parts.length >= 3 && parts[0] === 'mongo' && parts[1] === newspaperId) {
              const articleIndex = parseInt(parts[2]);
              if (!isNaN(articleIndex)) {
                bookmarkMap[articleIndex] = true;
              }
            }
          });
          
          console.log('Mapped bookmarks:', bookmarkMap);
          
          // Set bookmark status for all articles
          for (let i = 0; i < newspaper.articles.length; i++) {
            bookmarks[i] = !!bookmarkMap[i];
          }
        } catch (err) {
          console.warn('Could not get all bookmarks, falling back to individual checks', err);
          // Fallback to individual checks
          for (let i = 0; i < newspaper.articles.length; i++) {
            const isBookmarked = await bookmarkService.checkIfBookmarked(`mongo_${newspaperId}`, i);
            bookmarks[i] = isBookmarked;
          }
        }
        
        console.log('Final bookmark statuses:', bookmarks);
        setBookmarkedArticles(bookmarks);
      }
    } catch (err) {
      console.error('Error checking bookmarks:', err);
    }
  };

  const handleBookmarkClick = async (articleIndex) => {
    try {
      const article = newspaper.articles[articleIndex];
      // Store current bookmark state before changes
      const wasBookmarked = bookmarkedArticles[articleIndex];
      console.log(`Toggling bookmark for article ${articleIndex}, was bookmarked: ${wasBookmarked}`);
      
      // Update UI optimistically for better user experience
      setBookmarkedArticles(prev => ({ ...prev, [articleIndex]: !wasBookmarked }));
      
      if (wasBookmarked) {
        // Remove bookmark - ensure the bookmark ID format is correct
        const bookmarkId = `mongo_${newspaperId}_${articleIndex}`;
        console.log(`Removing bookmark with ID: ${bookmarkId}`);
        await bookmarkService.removeBookmark(bookmarkId);
        setSnackbar({ open: true, message: 'Article removed from bookmarks', severity: 'success' });
      } else {
        // Add bookmark - For MongoDB newspapers we need different bookmark format
        const bookmarkData = {
          filename: `mongo_${newspaperId}`,  // Special format for MongoDB articles
          article_index: articleIndex,
          headline: article.headline || '',
          content: article.content || ''
        };
        console.log('Adding bookmark with data:', bookmarkData);
        await bookmarkService.addBookmark(bookmarkData);
        setSnackbar({ open: true, message: 'Article added to bookmarks', severity: 'success' });
      }
      
      // Re-check all bookmark statuses after a short delay to ensure UI is in sync with server
      setTimeout(async () => {
        try {
          console.log('Re-checking bookmark statuses after toggle');
          await checkBookmarkedArticles();
        } catch (verifyErr) {
          console.error('Error verifying bookmark status:', verifyErr);
        }
      }, 800);
    } catch (err) {
      // If operation fails, revert the UI state back to original
      const originalState = bookmarkedArticles[articleIndex];
      setBookmarkedArticles(prev => ({ ...prev, [articleIndex]: originalState }));
      console.error('Bookmark update failed:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to update bookmark', severity: 'error' });
    }
  };

  const handleSummaryClick = (articleIndex) => {
    const article = newspaper.articles[articleIndex];
    
    // No need to fetch summary - we already have it from MongoDB
    setSummaryModal({ 
      open: true, 
      articleIndex, 
      summary: article.summary || 'No summary available for this article.', 
      loading: false 
    });
  };
  
  const handleCloseModal = () => {
    setSummaryModal({ ...summaryModal, open: false });
  };

  // Admin editing functions
  const handleEditClick = () => {
    // Create a deep copy of the newspaper for editing and ensure indices are preserved
    const newspaper_copy = JSON.parse(JSON.stringify(newspaper));
    // Make sure each article has its index property set
    newspaper_copy.articles = newspaper_copy.articles.map((article, idx) => ({
      ...article,
      index: idx
    }));
    setEditedNewspaper(newspaper_copy);
    setIsEditing(true);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingArticleIndex(null);
    setEditedNewspaper(null);
  };
  
  // Function for editing individual article (when not in full edit mode)
  const handleEditArticle = (index) => {
    if (isEditing) {
      // If we're in full newspaper edit mode, just select the article
      setEditingArticleIndex(index);
    } else {
      // Initialize individual article editing
      setArticleEditing({...articleEditing, [index]: true});
      setEditedArticleContent({...editedArticleContent, [index]: newspaper.articles[index].content});
    }
  };
  
  // Function to handle content change for individual article
  const handleSingleArticleContentChange = (event, index) => {
    setEditedArticleContent({
      ...editedArticleContent,
      [index]: event.target.value
    });
  };
  
  // Function to save a single article
  const handleSaveArticle = async (index) => {
    try {
      setSavingArticle(true);
      
      // Prepare update data for just this article
      const updateData = {
        articles: [{
          index: index,
          content: editedArticleContent[index]
        }]
      };
      
      // Call API to update just this article
      const result = await updateMongoNewspaper(newspaperId, updateData);
      
      // Update local state
      if (result.newspaper) {
        setNewspaper(result.newspaper);
      }
      
      // Reset editing state for this article
      setArticleEditing({...articleEditing, [index]: false});
      setEditedArticleContent({...editedArticleContent, [index]: ''});
      
      setSnackbar({
        open: true,
        message: 'Article updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to save article:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to save article',
        severity: 'error'
      });
    } finally {
      setSavingArticle(false);
    }
  };
  
  // Function to cancel individual article editing
  const handleCancelArticleEdit = (index) => {
    setArticleEditing({...articleEditing, [index]: false});
    setEditedArticleContent({...editedArticleContent, [index]: ''});
  };
  
  // Delete newspaper handlers
  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };
  
  const handleDeleteNewspaper = async () => {
    try {
      setIsDeleting(true);
      console.log('Deleting newspaper with ID:', newspaperId);
      
      // Call API to delete the newspaper
      const result = await deleteNewspaper(newspaperId);
      console.log('Delete result:', result);
      
      setSnackbar({
        open: true,
        message: result.message || 'Newspaper deleted successfully',
        severity: 'success'
      });
      
      // Close dialog
      setDeleteDialogOpen(false);
      
      // Redirect back to newspaper list
      setTimeout(() => {
        navigate('/newspapers');
      }, 1500);
    } catch (error) {
      console.error('Failed to delete newspaper:', error);
      
      // Extract error message from the error object
      let errorMessage = 'Failed to delete newspaper';
      
      if (error.error) {
        // Our custom error format from the service
        errorMessage = error.error;
        
        // If it's a permission error (403), provide a more helpful message
        if (error.status === 403) {
          errorMessage = 'You do not have permission to delete this newspaper. Admin privileges required.';
        }
      } else if (error.message) {
        // Standard Error object
        errorMessage = error.message;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      // Close dialog on error
      setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleArticleContentChange = (event, index) => {
    const updatedArticles = [...editedNewspaper.articles];
    // Make sure we're updating the correct article by index
    if (index >= 0 && index < updatedArticles.length) {
      updatedArticles[index].content = event.target.value;
      setEditedNewspaper({
        ...editedNewspaper,
        articles: updatedArticles
      });
    }
  };
  
  const handleNewsNameChange = (event) => {
    setEditedNewspaper({
      ...editedNewspaper,
      name: event.target.value
    });
  };
  
  const handleNewsDateChange = (event) => {
    setEditedNewspaper({
      ...editedNewspaper,
      date: event.target.value
    });
  };
  
  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      
      // Prepare update data - only send what's needed
      const updateData = {
        name: editedNewspaper.name,
        date: editedNewspaper.date,
        articles: editedNewspaper.articles.map((article, index) => ({
          index: article.index, // Use index from the article object
          content: article.content
        }))
      };
      
      // Call API to update newspaper
      const result = await updateMongoNewspaper(newspaperId, updateData);
      
      // Update local state with the latest data
      setNewspaper(result.newspaper || editedNewspaper);
      setSnackbar({
        open: true,
        message: 'Newspaper updated successfully',
        severity: 'success'
      });
      
      // Exit editing mode
      setIsEditing(false);
      setEditingArticleIndex(null);
      setEditedNewspaper(null);
    } catch (error) {
      console.error('Failed to save changes:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to save changes',
        severity: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleBackClick = () => {
    if (isEditing) {
      // Show confirmation before navigating away while editing
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate(-1);
      }
    } else {
      navigate(-1); // Go back to previous page
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" my={8}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBackClick}
          sx={{ mt: 2 }}
        >
          Back to Newspapers
        </Button>
      </Container>
    );
  }

  if (!newspaper) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">
          Newspaper not found
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBackClick}
          sx={{ mt: 2 }}
        >
          Back to Newspapers
        </Button>
      </Container>
    );
  }

  // Calculate pagination
  const startIdx = (articlePage - 1) * ARTICLES_PER_PAGE;
  const endIdx = startIdx + ARTICLES_PER_PAGE;
  const displayedArticles = newspaper.articles.slice(startIdx, endIdx);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'space-between' }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBackClick}
          variant="outlined"
        >
          Back to Newspapers
        </Button>
        
        {isEditing ? (
          <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveChanges}
              disabled={isSaving}
              sx={{ minWidth: 120 }}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleCancelEdit}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </Box>
        ) : (
          <>
            <Typography variant="h4" component="h1" sx={{ textAlign: 'center', fontWeight: 'bold', flexGrow: 1 }}>
              {newspaper.date}
            </Typography>
            
            {user?.is_admin && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  startIcon={<EditIcon />}
                  variant="contained"
                  color="primary"
                  onClick={handleEditClick}
                >
                  Edit Newspaper
                </Button>
                
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleOpenDeleteDialog}
                >
                  Delete Newspaper
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>
      
      {/* Newspaper metadata */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2, width: '100%' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1 }}>
            {isEditing ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, width: '100%' }}>
                  <DateIcon color="primary" sx={{ mr: 1 }} />
                  <TextField
                    label="Newspaper Name"
                    value={editedNewspaper.name}
                    onChange={handleNewsNameChange}
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{ maxWidth: 400 }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, width: '100%' }}>
                  <DateIcon color="primary" sx={{ mr: 1 }} />
                  <TextField
                    label="Date"
                    value={editedNewspaper.date}
                    onChange={handleNewsDateChange}
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{ maxWidth: 400 }}
                  />
                </Box>
              </>
            ) : (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <DateIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Date: {newspaper.date}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ArticleIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    Total Articles: {newspaper.articles_count}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              icon={<LibraryIcon />}
              label={newspaper.language}
              color="primary"
              variant="outlined"
            />
            
            <Chip 
              icon={<InfoIcon />}
              label={`${newspaper.page_count} Pages`}
              color="secondary"
              variant="outlined"
            />
            
            <Chip 
              icon={<Summarize />}
              label={newspaper.has_summaries ? "Summaries Available" : "No Summaries"}
              color={newspaper.has_summaries ? "success" : "default"}
              variant="outlined"
            />
          </Box>
        </Box>
      </Paper>

      {/* Article list */}
      <Typography variant="h5" component="h2" sx={{ mb: 3, textAlign: 'center' }}>
        Articles
      </Typography>
      
      {displayedArticles.map((article, index) => {
        const actualIndex = startIdx + index;
        return (
          <Paper 
            key={actualIndex} 
            elevation={3} 
            sx={{ 
              p: 3, 
              mb: 4, 
              borderRadius: 2,
              borderLeft: article.summary ? '4px solid #4caf50' : 'none',
              width: '100%' // Full width container per user's preference
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Chip 
                  label={`Article ${article.article_number || (actualIndex + 1)}`}
                  size="small"
                  color="primary"
                  sx={{ mb: 1 }}
                />
                {article.page_number && (
                  <Tooltip title="Page number in newspaper">
                    <Chip 
                      label={`Page ${article.page_number}`}
                      size="small"
                      sx={{ ml: 1, mb: 1 }}
                    />
                  </Tooltip>
                )}
              </Box>
              
              <Stack direction="row" spacing={1}>
                {/* Bookmark button - only for member users (logged in, non-admin) */}
                {user && !user.is_admin && (
                  <Button
                    variant="outlined"
                    startIcon={bookmarkedArticles[actualIndex] ? <Bookmark /> : <BookmarkBorder />}
                    onClick={() => handleBookmarkClick(actualIndex)}
                    color={bookmarkedArticles[actualIndex] ? "primary" : "inherit"}
                    size="small"
                  >
                    {bookmarkedArticles[actualIndex] ? 'Bookmarked' : 'Bookmark'}
                  </Button>
                )}
                
                {article.summary && (
                  <Button
                    variant="outlined"
                    startIcon={<Summarize />}
                    onClick={() => handleSummaryClick(actualIndex)}
                    size="small"
                    color="success"
                  >
                    View Summary
                  </Button>
                )}
                
                {user?.is_admin && !isEditing && !articleEditing[actualIndex] && (
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditArticle(actualIndex)}
                    size="small"
                    color="primary"
                  >
                    Edit Article
                  </Button>
                )}
              </Stack>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Article content section - Shows edit form or content */}
            {isEditing && editingArticleIndex === actualIndex ? (
              /* Full newspaper edit mode */
              <TextField
                multiline
                fullWidth
                minRows={10}
                value={editedNewspaper.articles[actualIndex].content}
                onChange={(e) => handleArticleContentChange(e, actualIndex)}
                variant="outlined"
                InputProps={{
                  sx: {
                    fontFamily: 'Noto Nastaliq Urdu, serif',
                    fontSize: '1.2rem',
                    lineHeight: 2,
                    textAlign: 'right',
                    direction: 'rtl'
                  }
                }}
              />
            ) : articleEditing[actualIndex] ? (
              /* Independent article edit mode */
              <Box sx={{ width: '100%' }}>
                <TextField
                  multiline
                  fullWidth
                  minRows={10}
                  value={editedArticleContent[actualIndex]}
                  onChange={(e) => handleSingleArticleContentChange(e, actualIndex)}
                  variant="outlined"
                  InputProps={{
                    sx: {
                      fontFamily: 'Noto Nastaliq Urdu, serif',
                      fontSize: '1.2rem',
                      lineHeight: 2,
                      textAlign: 'right',
                      direction: 'rtl'
                    }
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleSaveArticle(actualIndex)}
                    disabled={savingArticle}
                  >
                    {savingArticle ? 'Saving...' : 'Save Article'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => handleCancelArticleEdit(actualIndex)}
                    disabled={savingArticle}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            ) : (
              /* Normal display mode */
              <Typography
                variant="body1"
                sx={{
                  fontSize: '1.2rem',
                  lineHeight: 2,
                  textAlign: 'right',
                  direction: 'rtl',
                  fontFamily: 'Noto Nastaliq Urdu, serif',
                  width: '100%'
                }}
              >
                {article.content}
              </Typography>
            )}
          </Paper>
        );
      })}

      {/* Pagination Controls */}
      {newspaper?.articles && newspaper.articles.length > ARTICLES_PER_PAGE && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
          <Pagination
            count={Math.ceil(newspaper.articles.length / ARTICLES_PER_PAGE)}
            page={articlePage}
            onChange={(event, newPage) => {
              setArticlePage(newPage);
              // Scroll to the top of the page
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

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
      
      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Newspaper
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete the newspaper <strong>{newspaper?.name}</strong> ({newspaper?.date})?
            This action cannot be undone and will permanently remove all articles and summaries.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteNewspaper}
            color="error"
            variant="contained"
            disabled={isDeleting}
            autoFocus
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Summary Modal */}
      <Modal
        open={summaryModal.open}
        onClose={handleCloseModal}
        aria-labelledby="article-summary-modal"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: '70%', md: '60%' },
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 0,
          maxHeight: '80vh',
          overflow: 'auto',
          borderRadius: 2
        }}>
          <Card>
            <CardHeader
              title="Article Summary"
              action={
                <IconButton onClick={handleCloseModal}>
                  <CloseIcon />
                </IconButton>
              }
            />
            <CardContent>
              {summaryModal.loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <Typography
                  sx={{
                    fontFamily: 'Noto Nastaliq Urdu, serif',
                    textAlign: 'right',
                    direction: 'rtl',
                    fontSize: '1.2rem',
                    lineHeight: 2
                  }}
                >
                  {summaryModal.summary}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      </Modal>
    </Container>
  );
}
