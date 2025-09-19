import { useState } from 'react';
import { FiShield, FiCheckCircle, FiGrid } from 'react-icons/fi';
import { AuthProvider } from './contexts/AuthContext';
import VerificationPage from './components/VerificationPage';
import AdminDashboard from './components/AdminDashboard';

const AppContent = () => {
  const [page, setPage] = useState('verify'); // 'verify' or 'admin'
  const [adminInitialView, setAdminInitialView] = useState('logs');

  const handleVerificationSuccess = () => {
    // Don't automatically redirect - let users see the verification results
    // They can manually navigate to admin dashboard if needed
    console.log('Verification successful - staying on verification page to show results');
  };

  const NavLink = ({ pageName, children }) => {
    const isActive = page === pageName;

    return (
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setPage(pageName);
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

            <nav className="flex items-center space-x-8">
              <NavLink pageName="verify">
                <FiCheckCircle className="w-5 h-5" />
                <span>Verify Certificate</span>
              </NavLink>
              <NavLink pageName="admin">
                <FiGrid className="w-5 h-5" />
                <span>Dashboard</span>
              </NavLink>
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