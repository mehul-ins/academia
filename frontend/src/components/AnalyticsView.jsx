import { useState, useEffect } from 'react';
import { FiBarChart2, FiPieChart, FiUsers, FiFileText, FiShield, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { adminAPI } from '../lib/api';

const AnalyticsView = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminAPI.getStats();

      if (response.status === 'success') {
        setStats(response.data);
      } else {
        setError('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(error.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Prepare data for charts
  const getVerdictData = () => {
    if (!stats?.overview) return [];

    const total = stats.overview.totalVerifications;
    const recent = stats.overview.recentVerifications;
    const successRate = stats.overview.successRate;

    return [
      { name: 'VERIFIED', value: Math.round((recent * successRate) / 100), color: '#22C55E' },
      { name: 'FAILED', value: Math.round(recent * (1 - successRate / 100)), color: '#EF4444' },
    ];
  };

  const getTrendData = () => {
    if (!stats?.trends) return [];
    return stats.trends.map(trend => ({
      ...trend,
      date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button
            onClick={fetchStats}
            className="ml-4 text-red-800 underline hover:no-underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Analytics & Insights</h2>
        <button
          onClick={fetchStats}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiRefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.overview?.totalUsers || 0}</p>
            </div>
            <FiUsers className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Certificates</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.overview?.totalCertificates || 0}</p>
            </div>
            <FiFileText className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Verifications</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.overview?.totalVerifications || 0}</p>
            </div>
            <FiShield className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Blacklisted</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.overview?.blacklistedCertificates || 0}</p>
            </div>
            <FiAlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Verification Results Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <FiPieChart className="mr-3 text-emerald-500" />
            Recent Verification Results
          </h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={getVerdictData()}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {getVerdictData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Success Rate: <span className="font-bold text-green-600">{stats?.overview?.successRate || 0}%</span>
            </p>
          </div>
        </div>

        {/* 7-Day Verification Trend */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <FiBarChart2 className="mr-3 text-blue-500" />
            7-Day Verification Trend
          </h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={getTrendData()}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Institutions */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <FiBarChart2 className="mr-3 text-purple-500" />
          Top Institutions by Certificate Count
        </h3>

        {stats?.topInstitutions?.length > 0 ? (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={stats.topInstitutions} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No institution data available
          </div>
        )}
      </div>

      {/* Additional Metrics */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-2">Recent Activity</h4>
          <p className="text-3xl font-bold">{stats?.overview?.recentVerifications || 0}</p>
          <p className="text-blue-100">Verifications in last 30 days</p>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-2">Success Rate</h4>
          <p className="text-3xl font-bold">{stats?.overview?.successRate || 0}%</p>
          <p className="text-green-100">Of recent verifications</p>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-2">Security Alerts</h4>
          <p className="text-3xl font-bold">{stats?.overview?.blacklistedCertificates || 0}</p>
          <p className="text-red-100">Blacklisted certificates</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
