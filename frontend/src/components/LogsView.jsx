import { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiRefreshCw, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { adminAPI } from '../lib/api';

const LogsView = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [error, setError] = useState('');

  const fetchLogs = async (page = 1, search = '', result = '') => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page,
        limit: 10,
        ...(search && { certificateId: search }),
        ...(result && { result })
      };

      const response = await adminAPI.getLogs(params);

      if (response.status === 'success') {
        setLogs(response.data.logs);
        setPagination(response.data.pagination);
      } else {
        setError('Failed to fetch logs');
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError(error.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(currentPage, searchTerm, resultFilter);
  }, [currentPage, resultFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLogs(1, searchTerm, resultFilter);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const getVerdictClass = (verdict) => {
    switch (verdict?.toLowerCase()) {
      case 'verified':
      case 'valid':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'forged':
        return 'bg-red-100 text-red-800';
      case 'suspicious':
        return 'bg-amber-100 text-amber-800';
      case 'blacklisted':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatReasons = (reasons) => {
    if (!reasons) return 'N/A';
    if (Array.isArray(reasons)) {
      return reasons.join(', ');
    }
    return reasons;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Verification Request Logs</h2>
        <button
          onClick={() => fetchLogs(currentPage, searchTerm, resultFilter)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiRefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Certificate ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="relative">
          <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">All Results</option>
            <option value="verified">Verified</option>
            <option value="failed">Failed</option>
            <option value="blacklisted">Blacklisted</option>
          </select>
        </div>

        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No verification logs found.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left font-semibold text-gray-600 p-4">Log ID</th>
                    <th className="text-left font-semibold text-gray-600 p-4">Certificate ID</th>
                    <th className="text-left font-semibold text-gray-600 p-4">Timestamp</th>
                    <th className="text-left font-semibold text-gray-600 p-4">Result</th>
                    <th className="text-left font-semibold text-gray-600 p-4">User</th>
                    <th className="text-left font-semibold text-gray-600 p-4">Reasons</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-4 text-gray-800 font-medium">#{log.id}</td>
                      <td className="p-4 text-gray-800">{log.certificateId || 'N/A'}</td>
                      <td className="p-4 text-gray-600">{formatDate(log.createdAt)}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getVerdictClass(log.result)}`}>
                          {log.result?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">
                        {log.user ? log.user.email : 'Anonymous'}
                      </td>
                      <td className="p-4 text-gray-600 max-w-xs truncate" title={formatReasons(log.reasons)}>
                        {formatReasons(log.reasons)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalItems)} of {pagination.totalItems} results
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <span className="px-3 py-2 text-sm font-medium text-gray-700">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Next</span>
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LogsView;
