import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    IconButton,
    Divider
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const ArticleModal = ({ open, onClose, article, articleContent, searchWord }) => {
    // Function to highlight the search word in text
    const highlightText = (text) => {
        if (!text) return '';
        if (!searchWord && !article?.selectedWord) return text;
        
        // Create regex pattern for both searchWord and selectedWord
        const words = [searchWord, article?.selectedWord].filter(Boolean);
        const pattern = words.join('|');
        const regex = new RegExp(`(${pattern})`, 'gi');
        
        const parts = text.split(regex);
        
        return parts.map((part, index) => 
            regex.test(part) ? (
                <span key={index} style={{ backgroundColor: '#fff3cd', padding: '0 2px' }}>
                    {part}
                </span>
            ) : part
        );
    };

    // Determine if we have JSON or text content
    const isJsonContent = typeof articleContent === 'object' && articleContent !== null;

    // Render article from JSON content
    const renderJsonContent = () => {
        if (!articleContent || !article) return null;
        
        try {
            console.log("Full article content:", articleContent);
            
            // If we have a content object with articles property
            if (articleContent.content && Array.isArray(articleContent.content.articles)) {
                const articleIndex = article.article_index || 0;
                const articleData = articleContent.content.articles[articleIndex];
                
                console.log("Article data for rendering:", articleData);
                
                if (!articleData) return <Typography>Article not found</Typography>;
                
                // Check all possible content fields - add original_text
                const fullText = articleData.article_text || 
                                 articleData.original_text ||
                                 articleData.content || 
                                 articleData.text || 
                                 articleData.body || 
                                 "";
                                 
                console.log("Full text length:", fullText.length);
                console.log("Fields available:", Object.keys(articleData));
                
                // If we have original_text, log its length
                if (articleData.original_text) {
                    console.log("Original text length:", articleData.original_text.length);
                }
                
                return (
                    <Box>
                        {/* Article Headline */}
                        {/* <Typography 
                            variant="h5" 
                            sx={{ 
                                mb: 3,
                                fontFamily: 'Noto Nastaliq Urdu, serif',
                                fontWeight: 'bold',
                                borderBottom: '2px solid #1976d2',
                                paddingBottom: 1
                            }}
                        >
                            {highlightText(articleData.headline || "No headline available")}
                        </Typography> */}
                        
                        {/* FULL ARTICLE TEXT */}
                        <Typography
                            variant="h6"
                            sx={{
                                mb: 1,
                                fontFamily: 'Noto Nastaliq Urdu, serif',
                                fontWeight: 'bold',
                                color: '#1976d2'
                            }}
                        >
                            مکمل مضمون
                        </Typography>
                        
                        {fullText ? (
                            <Typography 
                                variant="body1" 
                                sx={{ 
                                    whiteSpace: 'pre-wrap',
                                    fontFamily: 'Noto Nastaliq Urdu, serif',
                                    fontSize: '1.1rem',
                                    lineHeight: 2,
                                    mb: 4
                                }}
                            >
                                {highlightText(fullText)}
                            </Typography>
                        ) : (
                            <Typography color="error">
                                Full article text not available. Available fields: {Object.keys(articleData).join(", ")}
                            </Typography>
                        )}
                        
                        {/* Summary section, only if available */}
                        {articleData.summary && (
                            <>
                                <Divider sx={{ my: 3 }} />
                                <Typography 
                                    variant="h6" 
                                    sx={{ 
                                        mb: 1,
                                        fontFamily: 'Noto Nastaliq Urdu, serif',
                                        fontWeight: 'bold',
                                        color: '#1976d2'
                                    }}
                                >
                                    خلاصہ
                                </Typography>
                                <Typography 
                                    variant="body1" 
                                    sx={{ 
                                        whiteSpace: 'pre-wrap',
                                        fontFamily: 'Noto Nastaliq Urdu, serif',
                                        fontSize: '1.1rem',
                                        lineHeight: 2,
                                        backgroundColor: '#f5f5f5',
                                        p: 2,
                                        borderRadius: 1
                                    }}
                                >
                                    {highlightText(articleData.summary)}
                                </Typography>
                            </>
                        )}
                    </Box>
                );
            } else {
                // Fallback - display raw JSON for debugging
                return (
                    <Box>
                        <Typography variant="h6" color="error">
                            Data structure doesn't match expected format. Raw data:
                        </Typography>
                        <Box sx={{ 
                            bgcolor: '#f5f5f5', 
                            p: 2, 
                            borderRadius: 1,
                            direction: 'ltr',
                            overflow: 'auto',
                            maxHeight: '400px'
                        }}>
                            <pre>{JSON.stringify(articleContent, null, 2)}</pre>
                        </Box>
                    </Box>
                );
            }
        } catch (error) {
            console.error('Error rendering JSON content:', error);
            return (
                <Box>
                    <Typography color="error">Error loading article: {error.message}</Typography>
                    <Box sx={{ 
                        bgcolor: '#f5f5f5', 
                        p: 2, 
                        borderRadius: 1,
                        direction: 'ltr',
                        overflow: 'auto',
                        maxHeight: '400px'
                    }}>
                        <pre>{JSON.stringify(articleContent, null, 2)}</pre>
                    </Box>
                </Box>
            );
        }
    };

    // Split content into articles based on headlines
    const renderTextContent = () => {
        if (!articleContent || typeof articleContent !== 'string') return null;

        // Split by double newlines to separate articles
        const articles = articleContent.split(/\n\s*\n/);

        return articles.map((article, index) => {
            // Assume the first line is the headline
            const lines = article.trim().split('\n');
            const headline = lines[0];
            const content = lines.slice(1).join('\n');

            return (
                <Box key={index} sx={{ mb: 4 }}>
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            mb: 2,
                            fontFamily: 'Noto Nastaliq Urdu, serif',
                            fontWeight: 'bold',
                            fontSize: '1.4rem'
                        }}
                    >
                        {highlightText(headline)}
                    </Typography>
                    <Typography 
                        component="div" 
                        sx={{ 
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'Noto Nastaliq Urdu, serif',
                            fontSize: '1.1rem',
                            lineHeight: 2
                        }}
                    >
                        {highlightText(content)}
                    </Typography>
                    {index < articles.length - 1 && (
                        <Divider sx={{ my: 3 }} />
                    )}
                </Box>
            );
        });
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            scroll="paper"
        >
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                    {article?.date}
                </Typography>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{ color: 'grey.500' }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Box sx={{ 
                    p: 2, 
                    direction: 'rtl'
                }}>
                    {isJsonContent ? renderJsonContent() : renderTextContent()}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ArticleModal;