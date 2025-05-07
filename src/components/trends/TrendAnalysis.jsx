import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend,
    ResponsiveContainer 
} from 'recharts';
import { 
    Box, 
    TextField, 
    Button, 
    Switch, 
    FormControlLabel,
    Typography,
    Paper,
    CircularProgress,
    Grid,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Pagination
} from '@mui/material';
import { analyzeTrends, getTopWords, getTopWordsByYear, getArticlesWithWord, getFullArticle } from '../../services/trendService';
import { useAuth } from '../../contexts/AuthContext';
import ArticleModal from './ArticleModal';
import WordResultsList from './WordResultsList';
import WordResultsModal from './WordResultsModal';

const TrendAnalysis = () => {
    const { user } = useAuth();
    const [word1, setWord1] = useState('');
    const [word2, setWord2] = useState('');
    const [word3, setWord3] = useState('');
    const [word4, setWord4] = useState('');
    const [word5, setWord5] = useState('');
    const [isYearly, setIsYearly] = useState(false);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [topWords, setTopWords] = useState([]);
    const [loadingTopWords, setLoadingTopWords] = useState(true);
    const [yearlyTopWords, setYearlyTopWords] = useState({});
    const [loadingYearlyWords, setLoadingYearlyWords] = useState(true);
    const [selectedArticles, setSelectedArticles] = useState([]);
    const [loadingArticles, setLoadingArticles] = useState(false);
    const [selectedYear, setSelectedYear] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [articleContent, setArticleContent] = useState('');
    const [loadingArticleContent, setLoadingArticleContent] = useState(false);
    const [selectedWord, setSelectedWord] = useState(null);
    const [totalArticlesInfo, setTotalArticlesInfo] = useState(null);
    const [wordResultsModalOpen, setWordResultsModalOpen] = useState(false);
    
    // Year filter and pagination state
    const [selectedYearFilter, setSelectedYearFilter] = useState('all');
    const [yearsPage, setYearsPage] = useState(1);
    const YEARS_PER_PAGE = 5;

    const formatDate = (dateStr) => {
        if (isYearly) return dateStr;
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric'
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [topWordsResult, yearlyWordsResult] = await Promise.all([
                    getTopWords(),
                    getTopWordsByYear()
                ]);
                setTopWords(topWordsResult.top_words);
                setYearlyTopWords(yearlyWordsResult.yearly_top_words);
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoadingTopWords(false);
                setLoadingYearlyWords(false);
            }
        };

        fetchData();
    }, []);

    // Redirect admins to their dashboard
    if (user?.role === 'admin') {
        return <Navigate to="/admin" replace />;
    }

    const handleAnalyze = async () => {
        if (!word1) {
            setError('Please enter at least one word');
            return;
        }

        const words = [word1];
        if (word2) words.push(word2);
        if (word3) words.push(word3);
        if (word4) words.push(word4);
        if (word5) words.push(word5);

        try {
            setLoading(true);
            setError('');
            const result = await analyzeTrends(words, isYearly ? 'yearly' : 'monthly');
            
            // Transform data for Recharts
            const transformedData = Object.keys(result.data[word1]).map(date => {
                const dataPoint = {
                    originalDate: date,
                    date: formatDate(date),
                    [word1]: result.data[word1][date],
                    [`${word1}_total`]: result.total_articles[word1]
                };
                
                // Add data for additional words if they exist
                if (word2) {
                    dataPoint[word2] = result.data[word2][date];
                    dataPoint[`${word2}_total`] = result.total_articles[word2];
                }
                if (word3) {
                    dataPoint[word3] = result.data[word3][date];
                    dataPoint[`${word3}_total`] = result.total_articles[word3];
                }
                if (word4) {
                    dataPoint[word4] = result.data[word4][date];
                    dataPoint[`${word4}_total`] = result.total_articles[word4];
                }
                if (word5) {
                    dataPoint[word5] = result.data[word5][date];
                    dataPoint[`${word5}_total`] = result.total_articles[word5];
                }
                return dataPoint;
            });

            setData(transformedData);
            
            // Display total articles info
            const totalArticlesInfo = (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="h6" gutterBottom>Total Articles Found:</Typography>
                    <Typography>
                        "{word1}": Found in {result.total_articles[word1]} articles
                    </Typography>
                    {word2 && (
                        <Typography>
                            "{word2}": Found in {result.total_articles[word2]} articles
                        </Typography>
                    )}
                    {word3 && (
                        <Typography>
                            "{word3}": Found in {result.total_articles[word3]} articles
                        </Typography>
                    )}
                    {word4 && (
                        <Typography>
                            "{word4}": Found in {result.total_articles[word4]} articles
                        </Typography>
                    )}
                    {word5 && (
                        <Typography>
                            "{word5}": Found in {result.total_articles[word5]} articles
                        </Typography>
                    )}
                </Box>
            );
            setTotalArticlesInfo(totalArticlesInfo);
        } catch (err) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleTopWordClick = (word) => {
        if (!word1) {
            setWord1(word);
        } else if (!word2) {
            setWord2(word);
        } else if (!word3) {
            setWord3(word);
        } else if (!word4) {
            setWord4(word);
        } else if (!word5) {
            setWord5(word);
        }
    };

    const handleWordClick = async (word, year = null) => {
        setSelectedWord(word);
        setSelectedYear(year);
        setWordResultsModalOpen(true);
    };

    const handleArticleClick = async (article) => {
        try {
            setLoadingArticleContent(true);
            setSelectedArticle(article);
            setModalOpen(true);
            
            const result = await getFullArticle(article.file);
            setArticleContent(result.content);
        } catch (err) {
            console.error('Error fetching article content:', err);
        } finally {
            setLoadingArticleContent(false);
        }
    };

    const colors = ['#8884d8', '#82ca9d', '#FF8042', '#00C49F', '#FFBB28'];

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Trend Analysis
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                    <TextField
                        label="Word/Phrase 1"
                        value={word1}
                        onChange={(e) => setWord1(e.target.value)}
                        sx={{ flexGrow: 1 }}
                    />
                    <TextField
                        label="Word/Phrase 2 (Optional)"
                        value={word2}
                        onChange={(e) => setWord2(e.target.value)}
                        sx={{ flexGrow: 1 }}
                    />
                    <TextField
                        label="Word/Phrase 3 (Optional)"
                        value={word3}
                        onChange={(e) => setWord3(e.target.value)}
                        sx={{ flexGrow: 1 }}
                    />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                    <TextField
                        label="Word/Phrase 4 (Optional)"
                        value={word4}
                        onChange={(e) => setWord4(e.target.value)}
                        sx={{ flexGrow: 1 }}
                    />
                    <TextField
                        label="Word/Phrase 5 (Optional)"
                        value={word5}
                        onChange={(e) => setWord5(e.target.value)}
                        sx={{ flexGrow: 1 }}
                    />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={isYearly}
                                onChange={(e) => setIsYearly(e.target.checked)}
                            />
                        }
                        label={isYearly ? "Yearly View" : "Monthly View"}
                    />
                    <Button 
                        variant="contained" 
                        onClick={handleAnalyze}
                        disabled={loading}
                        sx={{ minWidth: 120 }}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Analyze'}
                    </Button>
                </Box>

                {error && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}

                {data && (
                    <>
                        <Box sx={{ height: 400, mt: 4 }}>
                            <ResponsiveContainer>
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="date"
                                        tickFormatter={(value) => value}
                                    />
                                    <YAxis 
                                        label={{ 
                                            value: 'Number of Articles per Day', 
                                            angle: -90, 
                                            position: 'insideLeft',
                                            style: { textAnchor: 'middle' }
                                        }}
                                    />
                                    <Tooltip 
                                        labelFormatter={(value) => value}
                                        formatter={(value, name) => {
                                            if (name.includes('_total')) return null;
                                            return [`${value} articles`, name];
                                        }}
                                    />
                                    <Legend 
                                        formatter={(value) => {
                                            if (value.includes('_total')) return null;
                                            return value;
                                        }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey={word1} 
                                        name={word1}
                                        stroke={colors[0]} 
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                    />
                                    {word2 && (
                                        <Line 
                                            type="monotone" 
                                            dataKey={word2}
                                            name={word2} 
                                            stroke={colors[1]} 
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                        />
                                    )}
                                    {word3 && (
                                        <Line 
                                            type="monotone" 
                                            dataKey={word3}
                                            name={word3} 
                                            stroke={colors[2]} 
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                        />
                                    )}
                                    {word4 && (
                                        <Line 
                                            type="monotone" 
                                            dataKey={word4}
                                            name={word4} 
                                            stroke={colors[3]} 
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                        />
                                    )}
                                    {word5 && (
                                        <Line 
                                            type="monotone" 
                                            dataKey={word5}
                                            name={word5} 
                                            stroke={colors[4]} 
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                        />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                        {totalArticlesInfo}
                    </>
                )}

                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                        Most Frequent Words
                    </Typography>
                    {loadingTopWords ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Grid container spacing={1}>
                            {topWords.map((item, index) => (
                                <Grid item key={index}>
                                    <Chip
                                        label={
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <Typography sx={{ fontSize: '1.2rem' }}>{item.word}</Typography>
                                                <Typography sx={{ fontSize: '0.8rem', opacity: 0.8 }}></Typography>
                                            </Box>
                                        }
                                        onClick={() => handleTopWordClick(item.word)}
                                        sx={{ 
                                            p: 2,
                                            height: 'auto',
                                            cursor: 'pointer',
                                            backgroundColor: (word1 === item.word || word2 === item.word || word3 === item.word || word4 === item.word || word5 === item.word) ? 'grey' : '#f5f5f5',
                                            color: (word1 === item.word || word2 === item.word || word3 === item.word || word4 === item.word || word5 === item.word) ? '#ffffff' : '#000000',
                                            '&:hover': {
                                                backgroundColor: (word1 === item.word || word2 === item.word || word3 === item.word || word4 === item.word || word5 === item.word) ? '#1565c0' : '#e0e0e0',
                                                color: (word1 === item.word || word2 === item.word || word3 === item.word || word4 === item.word || word5 === item.word) ? '#ffffff' : '#000000'
                                            }
                                        }}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Box>

                {/* Year Filter Dropdown */}
                <Box id="years-section" sx={{ mt: 4, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6" sx={{ mr: 2 }}>
                        Top Words by Year:
                    </Typography>
                    <FormControl sx={{ minWidth: 150 }}>
                        <InputLabel id="year-filter-label">Year</InputLabel>
                        <Select
                            labelId="year-filter-label"
                            value={selectedYearFilter}
                            label="Year"
                            onChange={(e) => {
                                setSelectedYearFilter(e.target.value);
                                setYearsPage(1); // Reset to first page when changing filter
                            }}
                        >
                            <MenuItem value="all">All Years</MenuItem>
                            {Object.keys(yearlyTopWords).sort().reverse().map((year) => (
                                <MenuItem key={year} value={year}>{year}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
                
                {/* Filtered and Paginated Years */}
                {Object.entries(yearlyTopWords)
                    .filter(([year]) => selectedYearFilter === 'all' || year === selectedYearFilter)
                    .sort((a, b) => b[0] - a[0]) // Sort years in descending order
                    .slice((yearsPage - 1) * YEARS_PER_PAGE, yearsPage * YEARS_PER_PAGE)
                    .map(([year, words]) => (
                    <Paper key={year} elevation={2} sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Top Words in {year}
                        </Typography>
                        <Grid container spacing={1}>
                            {words.map((item, index) => (
                                <Grid item key={index}>
                                    <Chip
                                        label={
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <Typography sx={{ fontSize: '1.2rem' }}>{item.word}</Typography>
                                                <Typography sx={{ fontSize: '0.8rem', opacity: 0.8 }}></Typography>
                                            </Box>
                                        }
                                        onClick={() => handleWordClick(item.word, year)}
                                        sx={{ 
                                            p: 2,
                                            height: 'auto',
                                            cursor: 'pointer',
                                            backgroundColor: (selectedWord === item.word && selectedYear === year) ? 'grey' : '#f5f5f5',
                                            color: (selectedWord === item.word && selectedYear === year) ? '#ffffff' : '#000000',
                                            '&:hover': {
                                                backgroundColor: (selectedWord === item.word && selectedYear === year) ? '#1565c0' : '#e0e0e0',
                                                color: (selectedWord === item.word && selectedYear === year) ? '#ffffff' : '#000000'
                                            }
                                        }}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                ))}
                
                {/* Pagination Controls for Years */}
                {selectedYearFilter === 'all' && Object.keys(yearlyTopWords).length > YEARS_PER_PAGE && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 3 }}>
                        <Pagination
                            count={Math.ceil(Object.keys(yearlyTopWords).length / YEARS_PER_PAGE)}
                            page={yearsPage}
                            onChange={(event, newPage) => {
                                setYearsPage(newPage);
                                // Scroll to the top of the years section
                                window.scrollTo({ top: document.getElementById('years-section').offsetTop - 20, behavior: 'smooth' });
                            }}
                            color="primary"
                            size="large"
                            showFirstButton
                            showLastButton
                        />
                    </Box>
                )}
            </Paper>

            <WordResultsModal
                open={wordResultsModalOpen}
                onClose={() => setWordResultsModalOpen(false)}
                selectedWord={selectedWord}
                selectedYear={selectedYear}
            />

            <ArticleModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setSelectedArticle(null);
                    setArticleContent('');
                }}
                article={selectedArticle}
                articleContent={articleContent}
                searchWord={word1 || word2}
            />
        </Box>
    );
};

export default TrendAnalysis;