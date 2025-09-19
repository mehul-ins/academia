import { useState } from 'react';
import { FiList, FiDatabase, FiBarChart2 } from 'react-icons/fi';
import LogsView from './LogsView';
import DataManagementView from './DataManagementView';
import AnalyticsView from './AnalyticsView';

const AdminDashboard = () => {
  const [adminView, setAdminView] = useState('logs'); // 'logs', 'data', 'analytics'

  const AdminNavLink = ({ viewName, icon, children }) => {
    const isActive = adminView === viewName;
    return (
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setAdminView(viewName);
        }}
        className={`flex items-center px-4 py-3 text-lg font-medium rounded-lg transition-colors ${
          isActive
            ? 'bg-blue-500 text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-200'
        }`}
      >
        {icon && <span className="mr-3">{icon}</span>}
        <span>{children}</span>
      </a>
    );
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)]">
      {/* Sidebar */}
      <aside className="w-64 bg-white p-6 shadow-lg">
        <nav className="space-y-4">
          <AdminNavLink viewName="logs" icon={<FiList />}>
            Verification Logs
          </AdminNavLink>
          <AdminNavLink viewName="data" icon={<FiDatabase />}>
            Data Management
          </AdminNavLink>
          <AdminNavLink viewName="analytics" icon={<FiBarChart2 />}>
            Analytics
          </AdminNavLink>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-gray-100">
        {adminView === 'logs' && <LogsView />}
        {adminView === 'data' && <DataManagementView />}
        {adminView === 'analytics' && <AnalyticsView />}
      </main>
    </div>
  );
};

export default AdminDashboard;
