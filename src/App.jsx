import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { OCRProvider } from './contexts/OCRContext';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import HomePage from './components/layout/HomePage';
import AdminPage from './components/layout/AdminPage';
import MemberPage from './components/layout/MemberPage';
import NewspaperDetail from './components/newspapers/NewspaperDetail';
import MongoNewspaperDetail from './components/newspapers/MongoNewspaperDetail';
import ArticleSummary from './components/newspapers/ArticleSummary';
import BookmarkedArticles from './components/bookmarks/BookmarkedArticles';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { CssBaseline, ThemeProvider, createTheme, Box } from '@mui/material';
import SearchArticles from './components/search/SearchArticles';
import AddNewspaper from './components/newspapers/AddNewspaper';
import AdminDashboard from './components/admin/AdminDashboard';
import EditNewspaper from './components/newspapers/EditNewspaper';
import TrendAnalysis from './components/trends/TrendAnalysis';
// import Footer from './components/layout/Footer';
import ChangePassword from './components/auth/ChangePassword';
import Navigation from './components/layout/Navigation';
import FloatingKeyboard from './components/common/FloatingKeyboard';

// Import Urdu font CSS
import '@fontsource/noto-nastaliq-urdu';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#483C32', // Taupe color for nav bar
      contrastText: '#fff',
    },
    secondary: {
      main: '#483c32',
      contrastText: '#fff',
    },
    text: {
      primary: '#483c32',
      secondary: '#483c32',
    },
    background: {
      default: '#fff',
      paper: '#fff', // Reset card background to white
    },
  },
  typography: {
    fontFamily: 'Noto Nastaliq Urdu, Arial',
    allVariants: {
      color: '#483c32',
    },
  },
  // Add custom border radius to the theme
  shape: {
    borderRadius: 16, // Increased border radius
  },
  direction: 'rtl',
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <OCRProvider>
          <Router>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh',
            }}
          >
            <Navigation />
            <Box sx={{ flex: '1 0 auto' }}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/newspaper/:filename" element={<NewspaperDetail />} />
                <Route path="/newspaper/mongo/:newspaperId" element={<MongoNewspaperDetail />} />
                <Route path="/newspaper/:filename/article/:articleIndex/summary" element={<ArticleSummary />} />
                <Route path="/search" element={<SearchArticles />} />
                <Route path="/trends" element={<TrendAnalysis />} />
                <Route
                  path="/bookmarks"
                  element={
                    <ProtectedRoute allowedRoles={['member']}>
                      <BookmarkedArticles />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminPage />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="add-newspaper" element={<AddNewspaper />} />
                  <Route path="edit-newspaper/:filename" element={<EditNewspaper />} />
                </Route>
                <Route
                  path="/member"
                  element={
                    <ProtectedRoute allowedRoles={['member']}>
                      <MemberPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Box>
            {/* <Footer /> */}
            <FloatingKeyboard />
          </Box>
          </Router>
        </OCRProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
