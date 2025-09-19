import { useState } from 'react';
import { FiShield, FiCheckCircle, FiGrid, FiLogOut, FiUser } from 'react-icons/fi';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import VerificationPage from './components/VerificationPage';
import AdminDashboard from './components/AdminDashboard';
import LoginPage from './components/LoginPage';

const AppContent = () => {
  const [page, setPage] = useState('verify'); // 'verify' or 'admin'
  const [adminInitialView, setAdminInitialView] = useState('logs');
  const { user, logout, isAdmin, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleVerificationSuccess = () => {
    // If not authenticated, redirect to login first
    if (!isAuthenticated) {
      setPage('admin'); // This will trigger the login page
      setAdminInitialView('analytics');
    } else {
      // If authenticated, go directly to analytics
      setPage('admin');
      setAdminInitialView('analytics');
    }
  };

  // Show admin login for admin pages if not authenticated
  if (page === 'admin' && !isAuthenticated) {
    return <LoginPage />;
  }

  const NavLink = ({ pageName, children, requiresAuth = false }) => {
    const isActive = page === pageName;

    // If admin page is required but user is not admin, show disabled state
    if (requiresAuth && isAuthenticated && !isAdmin()) {
      return (
        <span className="flex items-center space-x-2 text-gray-400 cursor-not-allowed font-medium">
          {children}
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">(Admin Only)</span>
        </span>
      );
    }

    return (
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setPage(pageName);
        }}
        className={`flex items-center space-x-2 font-medium px-4 py-2 rounded-lg transition-all duration-200 ${
          isActive
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
                <h1 className="text-2xl font-display font-bold text-gray-900">CertiVerify</h1>
                <p className="text-xs text-gray-500 font-medium">Trusted Certificate Verification</p>
              </div>
            </div>

            <nav className="flex items-center space-x-8">
              <NavLink pageName="verify">
                <FiCheckCircle className="w-5 h-5" />
                <span>Verify Certificate</span>
              </NavLink>
              <NavLink pageName="admin" requiresAuth={true}>
                <FiGrid className="w-5 h-5" />
                <span>Dashboard</span>
              </NavLink>

              {/* User Info and Logout */}
              {isAuthenticated && (
                <div className="flex items-center space-x-4 ml-8 pl-8 border-l border-gray-200">
                  <div className="flex items-center space-x-3 text-gray-700">
                    <div className="bg-gray-100 p-2 rounded-lg">
                      <FiUser className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.email}</p>
                      {isAdmin() && (
                        <span className="trust-badge text-xs">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setPage('verify');
                    }}
                    className="flex items-center space-x-2 text-gray-600 hover:text-danger-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {page === 'verify' ? (
        <VerificationPage onVerificationSuccess={handleVerificationSuccess} />
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