import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiUpload, FiTrash2, FiUploadCloud, FiSearch, FiEye, FiEyeOff } from 'react-icons/fi';
import { certificateAPI, adminAPI } from '../lib/api';



const DataManagementView = () => {
  const { user, profile, loading: authLoading, isAuthenticated } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [blacklistId, setBlacklistId] = useState('');
  const [blacklistReason, setBlacklistReason] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [blacklistLoading, setBlacklistLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  // Only fetch certificates when auth is ready and user is authenticated
  // Reset loading/error/success state and force fetch on mount or navigation
  useEffect(() => {
    setLoadingCertificates(false);
    setUploadLoading(false);
    setBlacklistLoading(false);
    setError('');
    setSuccess('');
    if (!authLoading && isAuthenticated) {
      fetchCertificates(currentPage, searchTerm);
    }
    // Optionally, force profile refresh if needed (uncomment if you add a refreshProfile method to AuthContext)
    // if (user && typeof refreshProfile === 'function') refreshProfile();
  }, [currentPage, user, authLoading, isAuthenticated]);

  // Force session/profile refresh and redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Not authenticated, redirect to login
      navigate('/login', { replace: true });
    }
    // Optionally, could trigger a profile refresh here if needed
  }, [authLoading, isAuthenticated, navigate]);

  const fetchCertificates = async (page = 1, search = '') => {
    setLoadingCertificates(true);
    setError('');
    try {
      const response = await certificateAPI.getCertificates();
      if (response.status === 'success') {
        setCertificates(response.data.certificates);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setError('Failed to fetch certificates');
    } finally {
      setLoadingCertificates(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) {
      setError('Please select a file to upload');
      return;
    }

    setUploadLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await certificateAPI.bulkUpload(uploadFile);
      if (response && response.status === 'success') {
        const summary = response.summary || {};
        setSuccess(
          `Upload complete: ${summary.inserted || 0} inserted, ${summary.updated || 0} updated, ${summary.failed || 0} failed.`
        );
        setUploadFile(null);
        // Refresh certificates list
        fetchCertificates(currentPage, searchTerm);
      } else {
        setError((response && response.message) || 'Upload failed (unexpected response)');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError((error && error.message) || 'Upload failed (exception)');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleBlacklist = async () => {
    if (!blacklistId.trim()) {
      setError('Please enter a roll number or institution name');
      return;
    }

    setBlacklistLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await adminAPI.toggleBlacklist(
        blacklistId.trim(),
        true,
        blacklistReason || 'Blacklisted via admin panel'
      );

      if (response && response.status === 'success') {
        setSuccess(`Successfully blacklisted: ${blacklistId}`);
        setBlacklistId('');
        setBlacklistReason('');
        // Refresh certificates list
        fetchCertificates(currentPage, searchTerm);
      } else {
        setError((response && response.message) || 'Blacklisting failed (unexpected response)');
      }
    } catch (error) {
      console.error('Blacklist error:', error);
      setError((error && error.message) || 'Blacklisting failed (exception)');
    } finally {
      setBlacklistLoading(false);
    }
  };

  const handleToggleBlacklist = async (rollNumber, currentBlacklistStatus) => {
    try {
      const response = await adminAPI.toggleBlacklist(
        rollNumber,
        !currentBlacklistStatus,
        currentBlacklistStatus ? 'Removed from blacklist' : 'Added to blacklist'
      );

      if (response.status === 'success') {
        setSuccess(`Certificate ${!currentBlacklistStatus ? 'blacklisted' : 'unblacklisted'} successfully`);
        fetchCertificates(currentPage, searchTerm);
      }
    } catch (error) {
      setError('Failed to update blacklist status');
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCertificates(1, searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
    fetchCertificates(1, '');
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Data Management</h2>

      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Bulk Upload Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <FiUpload className="mr-3 text-blue-500" />
            Bulk Upload Certificates
          </h3>
          <p className="text-gray-600 mb-6">
            Upload a CSV file to register new certificates in the system.
          </p>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 cursor-pointer transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <FiUploadCloud className="w-10 h-10 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-700">
              <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-sm text-gray-500">CSV files only (max. 10MB)</p>
            {uploadFile && (
              <p className="text-sm text-green-600 mt-2 font-medium">
                Selected: {uploadFile.name}
              </p>
            )}
          </div>
          <input
            id="fileInput"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={handleBulkUpload}
            disabled={!uploadFile || uploadLoading}
            className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {uploadLoading ? 'Uploading...' : 'Submit File'}
          </button>
        </div>

        {/* Blacklist Management Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <FiTrash2 className="mr-3 text-red-500" />
            Blacklist Certificates
          </h3>
          <p className="text-gray-600 mb-6">
            Permanently flag a roll number to prevent verification.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Roll Number
              </label>
              <input
                type="text"
                placeholder="e.g., 21BCE1234"
                value={blacklistId}
                onChange={(e) => setBlacklistId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Fraudulent certificate"
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleBlacklist}
              disabled={blacklistLoading}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {blacklistLoading ? 'Blacklisting...' : 'Blacklist Certificate'}
            </button>
          </div>
        </div>
      </div>

      {/* Certificates Management */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Certificate Management</h3>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by roll number, student name, or institution..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
            <button
              onClick={handleClearSearch}
              className="bg-gray-300 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
              disabled={!searchTerm}
            >
              Clear Search
            </button>
          </div>
        </div>

        {loadingCertificates ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading certificates...</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No certificates found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left font-semibold text-gray-600 p-4">Roll Number</th>
                  <th className="text-left font-semibold text-gray-600 p-4">Student Name</th>
                  <th className="text-left font-semibold text-gray-600 p-4">Institution</th>
                  <th className="text-left font-semibold text-gray-600 p-4">Course</th>
                  <th className="text-left font-semibold text-gray-600 p-4">Status</th>
                  <th className="text-left font-semibold text-gray-600 p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert) => (
                  <tr key={cert.roll_number || cert.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-4 text-gray-800 font-medium">{cert.roll_number || 'N/A'}</td>
                    <td className="p-4 text-gray-800">{cert.student_name || 'N/A'}</td>
                    <td className="p-4 text-gray-800">{cert.institution || 'N/A'}</td>
                    <td className="p-4 text-gray-800">{cert.course_name || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${cert.blacklisted
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                        }`}>
                        {cert.blacklisted ? 'Blacklisted' : 'Active'}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleBlacklist(cert.roll_number, cert.blacklisted)}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${cert.blacklisted
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                      >
                        {cert.blacklisted ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
                        <span>{cert.blacklisted ? 'Unblacklist' : 'Blacklist'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Template Manager removed as per request */}
    </div>
  );
};

export default DataManagementView;
