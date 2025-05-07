import { useState, useEffect } from 'react';
import { searchService } from '../../services/searchService';
import { bookmarkService } from '../../services/bookmarkService';
import { useAuth } from '../../contexts/AuthContext';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Pagination,
} from '@mui/material';
import { Search as SearchIcon, TravelExplore, Close, Bookmark, BookmarkBorder, Summarize } from '@mui/icons-material';

export default function SearchArticles() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [numResults, setNumResults] = useState(15);
  
  // Pagination state
  const [searchPage, setSearchPage] = useState(1);
  const SEARCH_RESULTS_PER_PAGE = 5;
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState({});
  const [summaryDialog, setSummaryDialog] = useState(null);
  
  // Track bookmarked articles separately in a dedicated state object
  // This matches the approach used in MongoNewspaperDetail
  const [bookmarkedArticles, setBookmarkedArticles] = useState({});
  
  // Helper to parse bookmark composite ID into filename and index
  const parseBookmarkId = (id) => {
    const lastUnderscore = id.lastIndexOf('_');
    if (lastUnderscore === -1) return { filename: id, article_index: -1 };
    return {
      filename: id.substring(0, lastUnderscore),
      article_index: parseInt(id.substring(lastUnderscore + 1), 10)
    };
  };

  // Effect to check bookmark status when results load or user changes
  useEffect(() => {
    if (results?.articles && user && user.role === 'member') {
      // Only run the basic bookmark check
      console.log('Checking bookmark status for search results');
      checkBookmarkStatus();
    }
  }, [results, user]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const data = await searchService.semanticSearch(query, numResults);
      setResults(data);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (article, index) => {
    if (!user || user.role !== 'member') {
      setError('You must be logged in as a member to bookmark articles');
      return;
    }

    // Create articleId for the bookmark service
    const articleId = `${article.newspaper_filename}_${article.article_index}`;
    console.log(`Toggling bookmark for article at index ${index}: ${articleId}`);
    
    // Store original bookmark state to revert if operation fails
    const wasBookmarked = bookmarkedArticles[index] || false;
    setBookmarkLoading(true);
    
    // Optimistically update UI first for better UX
    setBookmarkedArticles(prev => ({
      ...prev,
      [index]: !wasBookmarked
    }));
    
    console.log(`Bookmark status updated: index ${index} = ${!wasBookmarked}`);


    try {
      if (wasBookmarked) {
        // Remove bookmark
        await bookmarkService.removeBookmark(articleId);
      } else {
        // Add bookmark
        await bookmarkService.addBookmark({
          filename: article.newspaper_filename,
          article_index: article.article_index,
          headline: article.headline || `Article ${article.article_index}`,
          content: article.content
        });
      }
      
      // Clear any previous errors
      setError(''); 
      
      // Don't re-check all bookmark statuses after toggling - this would reset our UI
      // Instead, just log success and leave our optimistic UI update in place
      console.log('Bookmark operation successful - keeping optimistic UI update');

      
    } catch (err) {
      // If operation fails, revert the UI state back to original
      console.log(`Error toggling bookmark at index ${index}, reverting to ${wasBookmarked}`);
      
      // Revert to the original state
      setBookmarkedArticles(prev => ({
        ...prev,
        [index]: wasBookmarked
      }));
      
      setError(err.message || 'Failed to update bookmark');
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleGetSummary = async (article, index) => {
    // Create a unique articleId for tracking loading state that matches what renderArticle uses
    const articleId = `${article.newspaper_filename}_${article.article_index}_${index}`;
    
    // Set loading state for this specific article
    setSummaryLoading(prev => ({
      ...prev,
      [articleId]: true
    }));

    try {
      console.log('Getting summary for article:', article);
      console.log('Article index from search results:', article.article_index);
      console.log('Array index in results list:', index);
      console.log('ArticleId for loading state:', articleId);
      
      // For MongoDB articles, we'll use article_number as the primary identifier
      console.log('Using article_number for MongoDB article identification');
      
      // Check for MongoDB article by looking at the filename
      const isMongoArticle = article.newspaper_filename && article.newspaper_filename.startsWith('mongodb:');
      
      // For MongoDB articles, we need to use article_number which is in the MongoDB schema
      // If article.article_number isn't available, fall back to the article_index 
      const articleNumber = article.article_number || article.article_index;
      
      // Create a payload with proper identifiers
      const articlePayload = {
        // Primary identifier: article_number matches the MongoDB schema directly
        article_number: articleNumber,
        // Backup content for matching if needed
        content: article.content || article.article_text || ''
      };
      
      console.log('Is MongoDB article:', isMongoArticle);
      console.log('Using article_number:', articleNumber);
      console.log('Content length for fallback matching:', articlePayload.content.length);
      
      // Pass the article payload with article_number to identify the exact article
      const summaryData = await searchService.getArticleSummary(
        article.newspaper_filename,
        article.article_index,
        articlePayload  // Pass article_number and content as payload
      );
      
      setSummaryDialog({
        article: article,
        summary: summaryData.summary
      });
    } catch (err) {
      setError(err.message || 'Failed to get article summary');
    } finally {
      setSummaryLoading(prev => ({
        ...prev,
        [articleId]: false
      }));
    }
  };

  const handleCloseSummaryDialog = () => {
    setSummaryDialog(null);
  };

  const handleArticleClick = (article) => {
    setSelectedArticle(article);
  };

  const handleCloseDialog = () => {
    setSelectedArticle(null);
  };
  
  // Function to check bookmark status for all articles in search results
  // This directly checks against MongoDB using individual article IDs
  const checkBookmarkStatus = async () => {
    if (!results?.articles || !user || user.role !== 'member') return;
    
    try {
      console.log('Checking bookmarks for each article individually');
      
      // Clear all bookmarks first
      const bookmarkStatus = {};
      results.articles.forEach((_, index) => {
        bookmarkStatus[index] = false;
      });
      
      // Set all states to false first
      setBookmarkedArticles(bookmarkStatus);
      
      // Check each article individually to avoid any issues with shared state
      // This is more network requests but ensures accuracy
      for (let i = 0; i < results.articles.length; i++) {
        const article = results.articles[i];
        
        // Get unique article identifiers
        const filename = article.newspaper_filename;
        const articleIndex = article.article_index;
        
        // Call the backend directly for this specific article
        try {
          const isBookmarked = await bookmarkService.checkIfBookmarked(filename, articleIndex);
          console.log(`Article ${i} (${filename}_${articleIndex}) bookmarked status: ${isBookmarked}`);
          
          // Update state only for this specific article
          setBookmarkedArticles(prev => ({
            ...prev,
            [i]: isBookmarked
          }));
        } catch (e) {
          console.error(`Error checking bookmark for article ${i}:`, e);
        }
      }
    } catch (err) {
      console.error('Error in main bookmark check:', err);
    }
  };

  // Keep track of individual bookmarks using separate flags
  const [individualBookmarkStates, setIndividualBookmarkStates] = useState({});
  
  // Simple bookmark toggle handler that directly updates MongoDB
  const toggleBookmark = async (article, index) => {
    if (!user || user.role !== 'member') {
      setError('You must be logged in as a member to bookmark articles');
      return;
    }
    
    try {
      // Get current bookmark state
      const isCurrentlyBookmarked = bookmarkedArticles[index] || false;
      console.log(`Toggling bookmark for article ${index}, current state: ${isCurrentlyBookmarked}`);
      
      // Optimistically update UI
      setBookmarkedArticles(prev => ({
        ...prev,
        [index]: !isCurrentlyBookmarked
      }));
      
      // Create articleId for the API
      const articleId = `${article.newspaper_filename}_${article.article_index}`;
      
      // Perform the action with the server
      if (isCurrentlyBookmarked) {
        // Remove bookmark
        await bookmarkService.removeBookmark(articleId);
        console.log(`Removed bookmark for article ${index}`);
      } else {
        // Add bookmark
        await bookmarkService.addBookmark({
          filename: article.newspaper_filename,
          article_index: article.article_index,
          headline: article.headline || `Article ${article.article_index}`,
          content: article.content
        });
        console.log(`Added bookmark for article ${index}`);
      }
    } catch (err) {
      // On error, revert the UI change
      const originalState = bookmarkedArticles[index] || false;
      setBookmarkedArticles(prev => ({
        ...prev,
        [index]: originalState
      }));
      
      console.error('Error toggling bookmark:', err);
      setError(err.message || 'Failed to update bookmark');
    }
  };
  
  const renderArticle = (article, index) => {
    // Create a more unique ID by combining the filename, index, and a random suffix if needed
    const articleId = `${article.newspaper_filename}_${article.article_index}_${index}`;
    const isLoadingSummary = summaryLoading[articleId];
    
    // Use the bookmark state directly from our main bookmarkedArticles state
    const isBookmarked = bookmarkedArticles[index] || false;

    return (
      <Paper 
        key={articleId} 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 2, 
          position: 'relative',
          direction: 'rtl'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          mb: 2,
          flexDirection: 'row-reverse'
        }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Get Summary">
              <IconButton
                onClick={() => handleGetSummary(article, index)}
                disabled={isLoadingSummary}
                color="primary"
              >
                {isLoadingSummary ? <CircularProgress size={24} /> : <Summarize />}
              </IconButton>
            </Tooltip>
          </Box>
          {/* <Typography 
            variant="h6" 
            gutterBottom
            sx={{
              fontFamily: 'Noto Nastaliq Urdu, serif',
              textAlign: 'right',
              width: '100%',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}
          >
            {article.headline || 'عنوان موجود نہیں'}
          </Typography> */}
        </Box>
        
        <Typography 
          variant="body1" 
          paragraph
          sx={{
            fontFamily: 'Noto Nastaliq Urdu, serif',
            textAlign: 'right',
            lineHeight: 2,
            fontSize: '1.1rem',
            mb: 3
          }}
        >
          {article.content}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ 
          mt: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              fontFamily: 'Noto Nastaliq Urdu, serif',
              textAlign: 'right'
            }}
          >
            تاریخ: {article.newspaper_date}
          </Typography>
          {/* <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              fontFamily: 'Noto Nastaliq Urdu, serif',
              textAlign: 'right'
            }}
          >
            مطابقت: {(article.relevance_score * 100).toFixed(1)}%
          </Typography> */}
        </Box>
      </Paper>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Search Articles
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Enter your search query in Urdu
        </Typography>

        <Box component="form" onSubmit={handleSearch} sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              fullWidth
              label="Search Query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{
                '& .MuiInputBase-input': {
                  fontFamily: 'Noto Nastaliq Urdu, serif',
                  direction: 'rtl',
                  textAlign: 'right'
                }
              }}
            />
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Results</InputLabel>
              <Select
                value={numResults}
                label="Results"
                onChange={(e) => setNumResults(e.target.value)}
              >
                {/* <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem> */}
                <MenuItem value={15}>15</MenuItem>
                <MenuItem value={20}>20</MenuItem>
              </Select>
            </FormControl>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SearchIcon />}
              disabled={loading}
              sx={{ height: '56px' }}
            >
              Search
            </Button>
          </Box>
        </Box>
      </Paper>

      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {results && results.articles && (
        <Box sx={{ mt: 3 }}>
          {results.articles
            .slice((searchPage - 1) * SEARCH_RESULTS_PER_PAGE, searchPage * SEARCH_RESULTS_PER_PAGE)
            .map((article, index) => renderArticle(article, index))
          }
          
          {/* Pagination Controls */}
          {results.articles.length > SEARCH_RESULTS_PER_PAGE && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
              <Pagination
                count={Math.ceil(results.articles.length / SEARCH_RESULTS_PER_PAGE)}
                page={searchPage}
                onChange={(event, newPage) => {
                  setSearchPage(newPage);
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
        </Box>
      )}

      <Dialog
        open={Boolean(summaryDialog)}
        onClose={handleCloseSummaryDialog}
        maxWidth="md"
        fullWidth
      >
        {summaryDialog && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography 
                  variant="h6"
                  sx={{
                    fontFamily: 'Noto Nastaliq Urdu, serif',
                    direction: 'rtl',
                    textAlign: 'right',
                    width: '100%'
                  }}
                >
                  خلاصہ
                </Typography>
                <IconButton onClick={handleCloseSummaryDialog} sx={{ ml: 2 }}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Typography
                variant="body1"
                sx={{
                  fontFamily: 'Noto Nastaliq Urdu, serif',
                  direction: 'rtl',
                  textAlign: 'right',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 2,
                  fontSize: '1.1rem'
                }}
              >
                {summaryDialog.summary}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseSummaryDialog}>بند کریں</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={Boolean(selectedArticle)}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedArticle && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography 
                  variant="h6"
                  sx={{
                    fontFamily: 'Noto Nastaliq Urdu, serif',
                    direction: 'rtl',
                    textAlign: 'right',
                    width: '100%'
                  }}
                >
                  تفصیلات
                </Typography>
                <IconButton onClick={handleCloseDialog} sx={{ ml: 2 }}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Typography
                variant="body1"
                sx={{
                  fontFamily: 'Noto Nastaliq Urdu, serif',
                  direction: 'rtl',
                  textAlign: 'right',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 2,
                  fontSize: '1.1rem'
                }}
              >
                {selectedArticle.article_text}
              </Typography>
              <Box sx={{ 
                mt: 2,
                direction: 'rtl',
                textAlign: 'right'
              }}>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{
                    fontFamily: 'Noto Nastaliq Urdu, serif',
                    mb: 1
                  }}
                >
                  تاریخ: {selectedArticle.newspaper_date}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    fontFamily: 'Noto Nastaliq Urdu, serif',
                    mb: 1
                  }}
                >
                  ذریعہ: {selectedArticle.source_file}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    direction: 'ltr',
                    textAlign: 'left'
                  }}
                >
                  مطابقت: {(selectedArticle.relevance_score * 100).toFixed(1)}%
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>بند کریں</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
} 