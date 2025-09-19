import { useState } from 'react';
import { FiShield, FiCheckCircle, FiGrid, FiLogOut, FiUser } from 'react-icons/fi';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import VerificationPage from './components/VerificationPage';
import AdminDashboard from './components/AdminDashboard';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';

const AppContent = () => {
  const { user, profile, logout, isAuthenticated, loading } = useAuth();
  const [page, setPage] = useState('verify'); // 'verify', 'admin', 'login', 'register'
  const [adminInitialView, setAdminInitialView] = useState('logs');

  // Show loading spinner while checking auth (only for dashboard access)
  if (loading && page === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-primary-600 w-16 h-16 rounded-xl mx-auto flex items-center justify-center mb-4">
            <FiShield className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login/register pages only when explicitly requested or when accessing dashboard without auth
  if ((page === 'login' || page === 'register') || (page === 'admin' && !isAuthenticated)) {
    if (page === 'register') {
      return (
        <RegisterPage
          onRegisterSuccess={() => setPage('verify')}
          onSwitchToLogin={() => setPage('login')}
          onBack={() => setPage('verify')}
        />
      );
    }

    return (
      <LoginPage
        onLoginSuccess={() => setPage('admin')} // Redirect to dashboard after login
        onSwitchToRegister={() => setPage('register')}
        onBack={() => setPage('verify')}
      />
    );
  }

  const handleVerificationSuccess = () => {
    // Don't automatically redirect - let users see the verification results
    console.log('Verification successful - staying on verification page to show results');
  };

  const handleLogout = async () => {
    try {
      await logout();
      setPage('login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const NavLink = ({ pageName, children, onClick }) => {
    const isActive = page === pageName;

    return (
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          if (onClick) {
            onClick();
          } else {
            setPage(pageName);
          }
        }}
        className={`flex items-center space-x-2 font-medium px-4 py-2 rounded-lg transition-all duration-200 ${isActive
          ? 'bg-primary-600 text-white shadow-trust'
          : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
          }`}
      >
        {children}
      </a>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-soft sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="bg-primary-600 p-2 rounded-xl">
                <FiShield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-gray-900">Academia</h1>
                <p className="text-xs text-gray-500 font-medium">Trusted Certificate Verification</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Navigation */}
              <nav className="flex items-center space-x-4">
                <NavLink pageName="verify">
                  <FiCheckCircle className="w-5 h-5" />
                  <span>Verify Certificate</span>
                </NavLink>
                <NavLink
                  pageName="admin"
                  onClick={() => {
                    if (!isAuthenticated) {
                      setPage('login');
                    } else {
                      setPage('admin');
                    }
                  }}
                >
                  <FiGrid className="w-5 h-5" />
                  <span>Dashboard</span>
                </NavLink>
              </nav>

              {/* User Menu - Only show when authenticated */}
              {isAuthenticated && (
                <div className="flex items-center space-x-4 pl-4 border-l border-gray-200">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {profile?.institution_name || user?.email}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {profile?.role || 'User'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-primary-100 p-2 rounded-lg">
                      <FiUser className="w-4 h-4 text-primary-600" />
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Logout"
                    >
                      <FiLogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Login/Register Links - Only show when not authenticated */}
              {!isAuthenticated && (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setPage('login')}
                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setPage('register')}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-medium transition-colors"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {page === 'verify' ? (
        <VerificationPage
          onVerificationSuccess={handleVerificationSuccess}
          onShowRegister={() => setPage('register')}
        />
      ) : (
        <AdminDashboard initialView={adminInitialView} />
      )}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;