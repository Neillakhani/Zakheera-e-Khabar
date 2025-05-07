import { useState, useEffect } from 'react';
import { bookmarkService } from '../../services/bookmarkService';
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Grid,
  Button,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
} from '@mui/material';
import { Delete as DeleteIcon, Summarize as SummarizeIcon } from '@mui/icons-material';

export default function BookmarkedArticles() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [summaryDialog, setSummaryDialog] = useState({ 
    open: false, 
    loading: false, 
    data: null, 
    previousData: null, 
    showingPrevious: false, 
    hasRegenerated: false, // Track whether we've regenerated a summary in this session
    error: null 
  });
  const [articleSummaryDialog, setArticleSummaryDialog] = useState({ 
    open: false, 
    loading: false, 
    data: null, 
    error: null,
    article: null 
  });
  
  // Pagination state
  const [page, setPage] = useState(1);
  const BOOKMARKS_PER_PAGE = 4;

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const data = await bookmarkService.getBookmarks();
      setBookmarks(data.bookmarks || []);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch bookmarks');
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (bookmarkId) => {
    try {
      await bookmarkService.removeBookmark(bookmarkId);
      setBookmarks(bookmarks.filter(bookmark => bookmark.id !== bookmarkId));
      setSnackbar({ open: true, message: 'Bookmark removed successfully' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to remove bookmark' });
    }
  };

  const handleGenerateSummary = async () => {
    // Save the current summary as previous before generating a new one
    setSummaryDialog(prev => ({ 
      ...prev, 
      open: true, 
      loading: true, 
      error: null,
      // Only save as previous if there's existing data
      previousData: prev.data ? prev.data : prev.previousData,
      showingPrevious: false
    }));
    
    try {
      const data = await bookmarkService.generateSummary();
      
      // Check if we got a cached summary from the backend
      const isCached = data.is_cached === true;
      
      setSummaryDialog(prev => ({ 
        ...prev, 
        loading: false, 
        data: {
          ...data,
          // If we receive a cached summary and there's no previous data,
          // don't mark as regenerated since we didn't actually regenerate
          is_cached: isCached
        },
        // Only mark as regenerated if we got a fresh summary or already have previous data
        hasRegenerated: !isCached || prev.data ? true : false
      }));
      
      if (isCached) {
        setSnackbar({ 
          open: true, 
          message: 'Retrieved existing summary for your current bookmarks' 
        });
      }
    } catch (err) {
      setSummaryDialog(prev => ({ 
        ...prev, 
        loading: false, 
        error: err.message || 'Failed to generate summary'
      }));
    }
  };

  const handleToggleSummary = () => {
    setSummaryDialog(prev => ({ 
      ...prev, 
      showingPrevious: !prev.showingPrevious 
    }));
  };

  const handleCloseSummaryDialog = () => {
    setSummaryDialog({
      open: false,
      loading: false,
      data: null,
      previousData: null,
      showingPrevious: false,
      hasRegenerated: false,
      error: null
    });
  };

  const handleGetArticleSummary = async (bookmark) => {
    setArticleSummaryDialog(prev => ({ 
      ...prev, 
      open: true, 
      loading: true, 
      error: null,
      article: bookmark 
    }));
    try {
      const data = await bookmarkService.getArticleSummary(
        bookmark.filename,
        bookmark.article_index
      );
      setArticleSummaryDialog(prev => ({ 
        ...prev, 
        loading: false, 
        data: data 
      }));
    } catch (err) {
      setArticleSummaryDialog(prev => ({ 
        ...prev, 
        loading: false, 
        error: err.message || 'Failed to get article summary'
      }));
    }
  };

  const handleCloseArticleSummaryDialog = () => {
    setArticleSummaryDialog({ 
      open: false, 
      loading: false, 
      data: null, 
      error: null,
      article: null 
    });
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          My Bookmarked Articles
        </Typography>
        {bookmarks.length > 0 && (
          <Button
            variant="contained"
            startIcon={<SummarizeIcon />}
            onClick={handleGenerateSummary}
          >
            Collection Summary
          </Button>
        )}
      </Box>

      {bookmarks.length === 0 ? (
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No bookmarked articles yet
          </Typography>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {/* Apply pagination to display only the current page's bookmarks */}
            {bookmarks
              .slice((page - 1) * BOOKMARKS_PER_PAGE, page * BOOKMARKS_PER_PAGE)
              .map((bookmark) => (
                <Grid item xs={12} key={bookmark.id}>
                  <Paper elevation={3} sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          onClick={() => handleGetArticleSummary(bookmark)}
                          color="primary"
                          size="small"
                        >
                          <SummarizeIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleRemoveBookmark(bookmark.id)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h5"
                          gutterBottom
                          sx={{
                            fontFamily: 'Noto Nastaliq Urdu, serif',
                            textAlign: 'right',
                            direction: 'rtl',
                            fontSize: '1.8rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {bookmark.headline}
                        </Typography>
                      </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: 'Noto Nastaliq Urdu, serif',
                    textAlign: 'right',
                    direction: 'rtl',
                    fontSize: '1.2rem',
                    lineHeight: 2
                  }}
                >
                  {bookmark.content}
                </Typography>
                <Box sx={{ mt: 2, textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">
                    From newspaper: {bookmark.filename}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
          </Grid>
          
          {/* Pagination Controls */}
          {bookmarks.length > BOOKMARKS_PER_PAGE && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
              <Pagination
                count={Math.ceil(bookmarks.length / BOOKMARKS_PER_PAGE)}
                page={page}
                onChange={(event, newPage) => {
                  setPage(newPage);
                  // Scroll to top of the bookmarks section
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}

      <Dialog
        open={summaryDialog.open}
        onClose={handleCloseSummaryDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Summary of Bookmarked Articles</DialogTitle>
        <DialogContent>
          {summaryDialog.loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : summaryDialog.error ? (
            <Alert severity="error">{summaryDialog.error}</Alert>
          ) : summaryDialog.data && (
            <>
              {summaryDialog.previousData && summaryDialog.hasRegenerated && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  {summaryDialog.showingPrevious ? (
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={handleToggleSummary}
                      sx={{ ml: 1 }}
                    >
                      Show Latest Summary
                    </Button>
                  ) : (
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={handleToggleSummary}
                    >
                      Show Previous Summary
                    </Button>
                  )}
                </Box>
              )}
              {summaryDialog.showingPrevious && summaryDialog.previousData ? (
                // Show previous summary
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" color="primary">
                      Viewing Previous Summary
                    </Typography>
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{
                      fontFamily: 'Noto Nastaliq Urdu, serif',
                      textAlign: 'right',
                      direction: 'rtl',
                      fontSize: '1.2rem',
                      lineHeight: 2,
                      mt: 2
                    }}
                  >
                    {summaryDialog.previousData.summary}
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Generated from {summaryDialog.showingPrevious ? summaryDialog.previousData.total_articles : summaryDialog.data.total_articles} articles at {new Date(summaryDialog.showingPrevious ? summaryDialog.previousData.generated_at : summaryDialog.data.generated_at).toLocaleString()}
                      {!summaryDialog.showingPrevious && summaryDialog.data.is_cached && 
                        " (cached summary)"
                      }
                    </Typography>
                  </Box>
                </>
              ) : (
                // Show current summary
                <>
                  {summaryDialog.data.is_cached && (
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      {/* <Typography variant="subtitle2" color="info.main">
                        Using saved summary for current bookmarks
                      </Typography> */}
                    </Box>
                  )}
                  <Typography
                    variant="body1"
                    sx={{
                      fontFamily: 'Noto Nastaliq Urdu, serif',
                      textAlign: 'right',
                      direction: 'rtl',
                      fontSize: '1.2rem',
                      lineHeight: 2,
                      mt: 2
                    }}
                  >
                    {summaryDialog.data.summary}
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Generated from {summaryDialog.data.total_articles} articles at {new Date(summaryDialog.data.generated_at).toLocaleString()}
                      {summaryDialog.data.is_cached && ' (cached)'}
                    </Typography>
                  </Box>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          {!summaryDialog.loading && (
            <Button 
              onClick={handleGenerateSummary} 
              color="primary" 
              variant={summaryDialog.data?.is_cached ? "contained" : "outlined"}
              startIcon={<SummarizeIcon />}
              disabled={bookmarks.length === 0}
            >
              {summaryDialog.data?.is_cached ? 'Regenerate Summary' : 'Regenerate Summary'}
            </Button>
          )}
          <Button onClick={handleCloseSummaryDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={articleSummaryDialog.open}
        onClose={handleCloseArticleSummaryDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography 
            sx={{
              fontFamily: 'Noto Nastaliq Urdu, serif',
              textAlign: 'right',
              direction: 'rtl'
            }}
          >
            خلاصہ
          </Typography>
        </DialogTitle>
        <DialogContent>
          {articleSummaryDialog.loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : articleSummaryDialog.error ? (
            <Alert severity="error">{articleSummaryDialog.error}</Alert>
          ) : articleSummaryDialog.data && (
            <Typography
              variant="body1"
              sx={{
                fontFamily: 'Noto Nastaliq Urdu, serif',
                textAlign: 'right',
                direction: 'rtl',
                fontSize: '1.2rem',
                lineHeight: 2,
                mt: 2,
                whiteSpace: 'pre-wrap'
              }}
            >
              {articleSummaryDialog.data.summary}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseArticleSummaryDialog}>بند کریں</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  );
} 