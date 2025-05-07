import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { newspaperService } from '../../services/newspaperService';
import { bookmarkService } from '../../services/bookmarkService';
import { useAuth } from '../../contexts/AuthContext';
import {
  Container,
  Typography,
  Box,
  Paper,
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
} from '@mui/material';
import {
  ArrowBack,
  Summarize,
  BookmarkBorder,
  Bookmark,
  Edit as EditIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

export default function NewspaperDetail() {
  const [newspaper, setNewspaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookmarkedArticles, setBookmarkedArticles] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [summaryModal, setSummaryModal] = useState({ open: false, articleIndex: null, summary: '', loading: false });
  
  // Pagination state for articles
  const [articlePage, setArticlePage] = useState(1);
  const ARTICLES_PER_PAGE = 5;
  // Removed state for generating summaries as it's now automatic
  const { filename } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchNewspaperDetail();
  }, [filename]);

  useEffect(() => {
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
      const data = await newspaperService.getNewspaperDetail(filename);
      setNewspaper(data);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch newspaper details');
      setLoading(false);
    }
  };

  const checkBookmarkedArticles = async () => {
    try {
      const bookmarks = {};
      if (newspaper?.articles) {
        // Get all bookmarks at once to reduce API calls
        try {
          const allBookmarks = await bookmarkService.getBookmarks();
          const bookmarkMap = allBookmarks.bookmarks.reduce((map, bm) => {
            // Extract filename and index from bookmark ID
            const [bookmarkFilename, index] = bm.id.split('_');
            if (bookmarkFilename === filename) {
              map[parseInt(index)] = true;
            }
            return map;
          }, {});
          
          // Set bookmark status for all articles
          for (let i = 0; i < newspaper.articles.length; i++) {
            bookmarks[i] = !!bookmarkMap[i];
          }
        } catch (err) {
          console.warn('Could not get all bookmarks, falling back to individual checks', err);
          // Fallback to individual checks
          for (let i = 0; i < newspaper.articles.length; i++) {
            const isBookmarked = await bookmarkService.checkIfBookmarked(filename, i);
            bookmarks[i] = isBookmarked;
          }
        }
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
      
      // Update UI optimistically for better user experience
      setBookmarkedArticles(prev => ({ ...prev, [articleIndex]: !wasBookmarked }));
      
      if (wasBookmarked) {
        // Remove bookmark
        await bookmarkService.removeBookmark(`${filename}_${articleIndex}`);
        setSnackbar({ open: true, message: 'Article removed from bookmarks' });
      } else {
        // Add bookmark
        await bookmarkService.addBookmark({
          filename,
          article_index: articleIndex,
          headline: article.headline,
          content: article.content
        });
        setSnackbar({ open: true, message: 'Article added to bookmarks' });
      }
      
      // Re-check all bookmark statuses after a short delay to ensure UI is in sync with server
      setTimeout(async () => {
        try {
          await checkBookmarkedArticles();
        } catch (verifyErr) {
          console.error('Error verifying bookmark status:', verifyErr);
        }
      }, 800);
    } catch (err) {
      // If operation fails, revert the UI state back to original
      const originalState = bookmarkedArticles[articleIndex];
      setBookmarkedArticles(prev => ({ ...prev, [articleIndex]: originalState }));
      setSnackbar({ open: true, message: err.message || 'Failed to update bookmark' });
    }
  };

  const formatFileName = (name) => {
    return name.replace('.json', '').split('_').join(' ').toUpperCase();
  };

  const handleSummaryClick = async (articleIndex) => {
    // Open modal and fetch summary
    setSummaryModal({ open: true, articleIndex, summary: '', loading: true });
    
    try {
      // Fetch the summary for this article
      const response = await newspaperService.getArticleSummary(filename, articleIndex);
      setSummaryModal(prev => ({ ...prev, summary: response.summary, loading: false }));
    } catch (err) {
      setSummaryModal(prev => ({ ...prev, summary: 'Failed to load summary', loading: false }));
      console.error('Error fetching summary:', err);
    }
  };
  
  const handleCloseModal = () => {
    setSummaryModal({ open: false, articleIndex: null, summary: '', loading: false });
  };

  // Summaries are now generated automatically during OCR processing

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
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            variant="outlined"
          >
            Back
          </Button>
          {user?.role === 'admin' && (
            <Button
              startIcon={<EditIcon />}
              variant="contained"
              onClick={() => navigate(`/admin/edit-newspaper/${filename}`)}
            >
              Edit Newspaper
            </Button>
          )}
        </Box>
        <Typography variant="h4" component="h1" gutterBottom>
          {formatFileName(filename)}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Total Articles: {newspaper?.total_articles || 0}
        </Typography>
      </Box>

      {newspaper?.articles
        .slice((articlePage - 1) * ARTICLES_PER_PAGE, articlePage * ARTICLES_PER_PAGE)
        .map((article, index) => {
          // Calculate the actual index in the full article array
          const actualIndex = index + (articlePage - 1) * ARTICLES_PER_PAGE;
          return (
        <Paper
          key={index}
          elevation={3}
          sx={{
            p: 3,
            mb: 3,
            '& *': {
              fontFamily: 'Noto Nastaliq Urdu, serif',
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                fontSize: '1.8rem',
                fontWeight: 'bold',
                textAlign: 'right',
                direction: 'rtl',
                flex: 1
              }}
            >
              {article.headline}
            </Typography>
            <Stack direction="row" spacing={1}>
              {user && !user.is_admin && (
                <Button
                  variant="outlined"
                  startIcon={bookmarkedArticles[actualIndex] ? <Bookmark /> : <BookmarkBorder />}
                  onClick={() => handleBookmarkClick(actualIndex)}
                  color={bookmarkedArticles[actualIndex] ? "primary" : "inherit"}
                >
                  {bookmarkedArticles[actualIndex] ? 'Bookmarked' : 'Bookmark'}
                </Button>
              )}
              {!user?.is_admin && (
                <Button
                  variant="outlined"
                  startIcon={<Summarize />}
                  onClick={() => handleSummaryClick(actualIndex)}
                  sx={{ minWidth: 120 }}
                >
                  Summary
                </Button>
              )}
            </Stack>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Typography
            variant="body1"
            sx={{
              fontSize: '1.2rem',
              lineHeight: 2,
              textAlign: 'right',
              direction: 'rtl'
            }}
          >
            {article.content}
          </Typography>
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
          severity={snackbar.severity || 'info'}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
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