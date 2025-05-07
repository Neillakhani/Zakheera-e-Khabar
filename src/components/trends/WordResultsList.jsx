import React, { useState, useEffect } from 'react';
import { 
    Typography, 
    Box, 
    CircularProgress, 
    Paper, 
    List, 
    ListItem, 
    ListItemText,
    Divider,
    Chip
} from '@mui/material';
import { getArticlesWithWord, getFullArticle } from '../../services/trendService';
import ArticleModal from './ArticleModal';

const WordResultsList = ({ selectedWord, year }) => {
    const [loading, setLoading] = useState(false);
    const [articles, setArticles] = useState([]);
    const [totalMatches, setTotalMatches] = useState(0);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [articleContent, setArticleContent] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        if (!selectedWord) return;
        
        const fetchArticles = async () => {
            setLoading(true);
            try {
                console.log(`Fetching articles with word: "${selectedWord}"${year ? `, year: ${year}` : ''}`);
                const data = await getArticlesWithWord(selectedWord, year);
                console.log('Backend response:', data);
                
                if (data && data.matching_articles) {
                    setArticles(data.matching_articles);
                    setTotalMatches(data.total_matches || 0);
                    console.log(`Found ${data.matching_articles.length} articles with ${data.total_matches || 0} total matches`);
                } else {
                    console.warn('No matching_articles in response:', data);
                    setArticles([]);
                    setTotalMatches(0);
                }
            } catch (error) {
                console.error('Error fetching articles:', error);
                setArticles([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchArticles();
    }, [selectedWord, year]);

    const handleArticleClick = async (article) => {
        setSelectedArticle(article);
        
        try {
            // Get full article content
            const data = await getFullArticle(article.file);
            console.log('Article content data:', data);
            
            // Additional debugging
            if (data.content && data.content.articles) {
                const articleData = data.content.articles[article.article_index || 0];
                console.log('Article text length:', articleData?.article_text?.length || 0);
                console.log('Article content length:', articleData?.content?.length || 0);
                console.log('Summary length:', articleData?.summary?.length || 0);
            }
            
            // Store the full data object
            setArticleContent(data);
            setModalOpen(true);
        } catch (error) {
            console.error('Error fetching article content:', error);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!selectedWord) {
        return (
            <Typography variant="body1" sx={{ textAlign: 'center', my: 4 }}>
                Please select a word to see matching articles
            </Typography>
        );
    }

    if (articles.length === 0) {
        return (
            <Typography variant="body1" sx={{ textAlign: 'center', my: 4 }}>
                No articles found containing "{selectedWord}"{year ? ` in ${year}` : ''}
                <Box sx={{ mt: 2, fontSize: '0.9rem', color: 'text.secondary' }}>
                    Try clicking a different word or checking a different year
                </Box>
            </Typography>
        );
    }

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Found {totalMatches} matches for "{selectedWord}" in {articles.length} articles
            </Typography>
            
            <Paper elevation={2} sx={{ mb: 4 }}>
                <List>
                    {articles.map((article, index) => (
                        <React.Fragment key={`${article.file}-${article.article_index || index}`}>
                            {index > 0 && <Divider />}
                            <ListItem 
                                button 
                                onClick={() => handleArticleClick(article)}
                                sx={{ flexDirection: 'column', alignItems: 'flex-start' }}
                            >
                                <ListItemText 
                                    primary={
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                            <Typography 
                                                variant="subtitle1" 
                                                sx={{ 
                                                    fontWeight: 'bold',
                                                    fontFamily: 'Noto Nastaliq Urdu, serif',
                                                    textAlign: 'right',
                                                    width: '100%'
                                                }}
                                            >
                                                {article.headline || `Article from ${article.date}`}
                                            </Typography>
                                        </Box>
                                    }
                                    secondary={
                                        <Box sx={{ mt: 1 }}>
                                            <Typography 
                                                variant="body2" 
                                                color="text.secondary"
                                                sx={{ 
                                                    textAlign: 'right',
                                                    fontFamily: 'Noto Nastaliq Urdu, serif',
                                                    direction: 'rtl'
                                                }}
                                            >
                                                {article.matches[0]?.context}
                                            </Typography>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                                <Chip 
                                                    label={`${article.total_matches} matches`} 
                                                    size="small" 
                                                    color="primary" 
                                                    variant="outlined"
                                                />
                                                <Typography variant="caption" color="text.secondary">
                                                    {article.date}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        </React.Fragment>
                    ))}
                </List>
            </Paper>
            
            <ArticleModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                article={selectedArticle}
                articleContent={articleContent}
                searchWord={selectedWord}
            />
        </Box>
    );
};

export default WordResultsList; 