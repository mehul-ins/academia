import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';

const LogsView = () => {
  const mockLogs = [
    { reqId: 'REQ-001', certId: 'CERT-2024-001', timestamp: '2025-09-19 10:30:00', verdict: 'VALID', user: '192.168.1.1' },
    { reqId: 'REQ-002', certId: 'CERT-2024-002', timestamp: '2025-09-19 10:32:15', verdict: 'FORGED', user: 'user@example.com' },
    { reqId: 'REQ-003', certId: 'CERT-2024-003', timestamp: '2025-09-19 10:35:45', verdict: 'SUSPICIOUS', user: '203.0.113.5' },
    { reqId: 'REQ-004', certId: 'CERT-2023-987', timestamp: '2025-09-18 15:12:30', verdict: 'VALID', user: '198.51.100.2' },
    { reqId: 'REQ-005', certId: 'CERT-2024-002', timestamp: '2025-09-18 14:05:10', verdict: 'FORGED', user: 'admin@internal' },
    { reqId: 'REQ-006', certId: 'CERT-2024-110', timestamp: '2025-09-18 11:20:00', verdict: 'VALID', user: '192.168.1.2' },
    { reqId: 'REQ-007', certId: 'CERT-2024-301', timestamp: '2025-09-17 09:55:00', verdict: 'SUSPICIOUS', user: 'user2@example.com' },
  ];

  const [searchTerm, setSearchTerm] = useState('');

  const getVerdictClass = (verdict) => {
    switch (verdict) {
      case 'VALID': return 'bg-green-100 text-green-800';
      case 'FORGED': return 'bg-red-100 text-red-800';
      case 'SUSPICIOUS': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLogs = mockLogs.filter(log =>
    log.reqId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.certId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Verification Request Logs</h2>
      
      <div className="mb-6">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Request ID or Certificate ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full min-w-max">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left font-semibold text-gray-600 p-4">Request ID</th>
              <th className="text-left font-semibold text-gray-600 p-4">Certificate ID</th>
              <th className="text-left font-semibold text-gray-600 p-4">Timestamp</th>
              <th className="text-left font-semibold text-gray-600 p-4">Verdict</th>
              <th className="text-left font-semibold text-gray-600 p-4">User (or IP)</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.reqId} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-4 text-gray-800 font-medium">{log.reqId}</td>
                <td className="p-4 text-gray-800">{log.certId}</td>
                <td className="p-4 text-gray-600">{log.timestamp}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getVerdictClass(log.verdict)}`}>
                    {log.verdict}
                  </span>
                </td>
                <td className="p-4 text-gray-600">{log.user}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LogsView;
