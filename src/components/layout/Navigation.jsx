import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Container,
  Avatar,
  Button,
  Tooltip,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Lock as LockIcon,
  Logout as LogoutIcon,
  Bookmark as BookmarkIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';

const Navigation = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleCloseUserMenu();
  };

  // Determine which navigation items to show based on user role
  const getNavigationItems = () => {
    if (user?.role === 'admin') {
      return [
        {
          text: 'ایڈمن پینل',
          icon: <AdminIcon />,
          onClick: () => navigate('/admin')
        }
      ];
    }

    // For members and non-logged in users, show search and trends
    return [
      {
        text: 'تلاش',
        icon: <SearchIcon />,
        sx: {
          color: '#fff',
        },
        onClick: () => navigate('/search')
      },
      {
        text: 'رجحانات',
        icon: <TrendingUpIcon />,
        onClick: () => navigate('/trends')
      }
    ];
  };

  const navigationItems = getNavigationItems();

  // Determine if logo should be clickable and where it should navigate
  const LogoComponent = user?.role === 'admin' ? Typography : Link;
  const logoProps = user?.role === 'admin' 
    ? {
        sx: {
          mr: 2,
          display: { xs: 'none', md: 'flex' },
          fontWeight: 700,
          color: 'inherit',
          fontFamily: 'Noto Nastaliq Urdu, serif',
        }
      }
    : {
        to: user?.role === 'member' ? "/member" : "/",
        sx: {
          mr: 2,
          display: { xs: 'none', md: 'flex' },
          fontWeight: 700,
          color: 'inherit',
          textDecoration: 'none',
          fontFamily: 'Noto Nastaliq Urdu, serif',
        }
      };

  return (
    <AppBar position="static" sx={{ bgcolor: '#483C32', color: '#fff' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'center'}}>
          {/* User menu or Login/Register buttons */}
          {user ? (
            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title={user.role === 'admin' ? 'ایڈمن مینو' : 'یوزر مینو'}>
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar sx={{ bgcolor: user.role === 'admin' ? 'error.main' : 'secondary.main' }}>
                    <Typography variant="h3" sx={{ fontFamily: 'Georgia' }} className='nav-button'>
                    {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                    </Typography>
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <MenuItem disabled sx={{ opacity: 1 }}>
                  <ListItemText 
                    primary={user.name || user.email}
                    secondary={user.role === 'admin' ? 'ایڈمن' : ''}
                    sx={{ 
                      textAlign: 'right', 
                      '& .MuiTypography-root': {
                        fontFamily: 'Noto Nastaliq Urdu, serif'
                      },
                      '& .MuiTypography-root:first-of-type': {
                        textAlign: 'left' // Apply left alignment only to the primary text (name/email)
                      }
                    }}
                  />
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => {
                  handleCloseUserMenu();
                  navigate('/change-password');
                }}>
                  <ListItemIcon>
                    <LockIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>پاس ورڈ تبدیل کریں</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>لاگ آؤٹ</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          ) : (
          <Box >
          <Button
                component={Link}
                to="/login"
                sx={(theme) => ({ 
                  color: '#fff', 
                  '&:hover': { 
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                  borderRadius: theme.shape.borderRadius,
                })}   
              >
                <Typography variant="h6" className='nav-button'>
                لاگ ان
                </Typography>
              </Button>
              <Button
                component={Link}
                to="/signup"
                sx={(theme) => ({ 
                  color: '#483c32', 
                  '&:hover': { 
                    bgcolor: theme.palette.secondary.main,  
                    color: 'white'
                  } 
                })} 
              >
                <Typography variant="h6" className='nav-button'>
                رجسٹر
                </Typography>
              </Button>
              </Box>
          )}

          {/* Mobile menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {navigationItems.map((item) => (
                <MenuItem key={item.text} onClick={() => {
                  handleCloseNavMenu();
                  item.onClick();
                }}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText>{item.text}</ListItemText>
                </MenuItem>
              ))}

              {/* Member-specific menu items */}
              {user?.role === 'member' && (
                <MenuItem onClick={() => { handleCloseNavMenu(); navigate('/bookmarks'); }}>
                  <ListItemIcon><BookmarkIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>محفوظ خبریں</ListItemText>
                </MenuItem>
              )}
            </Menu>
          </Box>

          {/* Logo/Brand - visible on mobile */}
          <Typography
            variant="h5"
            noWrap
            component={LogoComponent}
            {...logoProps}
            sx={{
              ...logoProps.sx,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
            }}
          >
            ذخیرہ خبر
          </Typography>

          {/* Desktop menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex', gap: 12, marginRight: '60px', justifyContent: 'flex-end' } }}>
            {navigationItems.map((item) => (
              <Button
                key={item.text}
                onClick={item.onClick}
                sx={{ my: 2, color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px' }}
                startIcon={item.icon}
              >
                <Typography variant="body1" gutterBottom className='nav-button'>
                {item.text}
                </Typography>
              </Button>
            ))}

            {/* Member-specific buttons */}
            {user?.role === 'member' && (
              <Button
                onClick={() => navigate('/bookmarks')}
                sx={{ my: 2, color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px' }}
                startIcon={<BookmarkIcon />}
              >
                محفوظ خبریں
              </Button>
            )}
          </Box>

            <Box sx={{ flexGrow: 0 }}>

              {/* Logo/Brand - visible on desktop */}
              <Typography
                variant="h2"
                noWrap
                component={Link} // Makes the whole component a clickable link
                to="/member" // Navigates to the homepage
                sx={{ 
                  padding: '8px', 
                  display: 'flex', 
                  alignItems: 'center',
                  textDecoration: 'none', // Removes default link underline
                  color: 'inherit' // Prevents color change on hover
                }}
              >
                <img 
                  src="/logo.svg" 
                  alt="Zakheera-e-Khabar Logo" 
                  style={{ height: '6rem', width: '8rem' }} // Adjust as needed
                />
              </Typography>
            </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navigation; 