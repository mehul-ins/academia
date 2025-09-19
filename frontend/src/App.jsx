import { useState } from 'react';
import { FiShield, FiCheckCircle, FiGrid, FiLogOut, FiUser } from 'react-icons/fi';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import VerificationPage from './components/VerificationPage';
import AdminDashboard from './components/AdminDashboard';
import LoginPage from './components/LoginPage';

const AppContent = () => {
  const [page, setPage] = useState('verify'); // 'verify' or 'admin'
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

  // Show admin login for admin pages if not authenticated
  if (page === 'admin' && !isAuthenticated) {
    return <LoginPage />;
  }

  const NavLink = ({ pageName, children, requiresAuth = false }) => {
    const isActive = page === pageName;

    // If admin page is required but user is not admin, show disabled state
    if (requiresAuth && isAuthenticated && !isAdmin()) {
      return (
        <span className="font-semibold pb-2 flex items-center space-x-2 text-gray-400 cursor-not-allowed">
          {children}
          <span className="text-xs">(Admin Only)</span>
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
        className={`font-semibold pb-2 flex items-center space-x-2 ${isActive
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-800'
          }`}
      >
        {children}
      </a>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 font-montserrat">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <FiShield className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">Academia</h1>
            </div>

            <nav className="flex items-center space-x-8">
              <NavLink pageName="verify">
                <FiCheckCircle />
                <span>Verify Certificate</span>
              </NavLink>
              <NavLink pageName="admin" requiresAuth={true}>
                <FiGrid />
                <span>Admin Dashboard</span>
              </NavLink>

              {/* User Info and Logout */}
              {isAuthenticated && (
                <div className="flex items-center space-x-4 ml-8 pl-8 border-l border-gray-200">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <FiUser className="w-4 h-4" />
                    <span className="text-sm font-medium">{user.email}</span>
                    {isAdmin() && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setPage('verify');
                    }}
                    className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
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

      {page === 'verify' ? <VerificationPage /> : <AdminDashboard />}
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