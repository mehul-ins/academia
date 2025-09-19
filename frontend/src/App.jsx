import { useState } from 'react';
import { FiShield, FiCheckCircle, FiGrid } from 'react-icons/fi';
import VerificationPage from './components/VerificationPage';
import AdminDashboard from './components/AdminDashboard';

const App = () => {
  const [page, setPage] = useState('verify'); // 'verify' or 'admin'

  const NavLink = ({ pageName, children }) => {
    const isActive = page === pageName;
    return (
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setPage(pageName);
        }}
        className={`font-semibold pb-2 flex items-center space-x-2 ${
          isActive
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
              <NavLink pageName="admin">
                <FiGrid />
                <span>Admin Dashboard</span>
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      {page === 'verify' ? <VerificationPage /> : <AdminDashboard />}
    </div>
  );
};

export default App;