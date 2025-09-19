import { FiUpload, FiTrash2, FiUploadCloud } from 'react-icons/fi';

const DataManagementView = () => {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Data Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Bulk Upload Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <FiUpload className="mr-3 text-blue-500" />
            Bulk Upload Certificates
          </h3>
          <p className="text-gray-600 mb-6">
            Upload a CSV or JSON file to register new certificates in the system.
          </p>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 cursor-pointer">
            <FiUploadCloud className="w-10 h-10 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-700">
              <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-sm text-gray-500">CSV or JSON (max. 10MB)</p>
          </div>
          <button className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Submit File
          </button>
        </div>

        {/* Blacklist Management Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <FiTrash2 className="mr-3 text-red-500" />
            Blacklist Certificates/Institutions
          </h3>
          <p className="text-gray-600 mb-6">
            Permanently flag a certificate ID or institution to prevent verification.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certificate ID or Institution Name
              </label>
              <input
                type="text"
                placeholder="e.g., CERT-FAKE-001 or Fake University"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <button className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors">
              Blacklist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagementView;
