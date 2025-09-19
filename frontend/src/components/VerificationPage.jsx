import { useState } from 'react';
import { 
  FiUploadCloud, FiFileText, FiCheckCircle, FiXCircle, FiAlertTriangle, 
  FiDatabase, FiBox, FiCpu, FiInfo, FiRefreshCw
} from 'react-icons/fi';

const VerificationPage = () => {
  const [verificationState, setVerificationState] = useState('initial'); // 'initial', 'loading', 'result'
  const [uploadedFile, setUploadedFile] = useState(null);
  const [certificateId, setCertificateId] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

  // Mock verification results
  const mockResults = {
    valid: {
      verdict: 'VALID',
      icon: <FiCheckCircle className="w-16 h-16 mx-auto" />,
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-500',
      details: {
        name: 'John Doe',
        rollNo: 'CS21B1001',
        certificateId: 'CERT-2024-001',
        marks: '85%',
        dateIssued: '2024-01-15',
        issuingAuthority: 'Tech University'
      },
      ocrConfidence: 92,
      checks: {
        database: { status: 'Matched', icon: <FiCheckCircle className="text-green-500" />, success: true },
        blockchain: { status: 'Valid', icon: <FiCheckCircle className="text-green-500" />, success: true },
        aiScore: 0.15
      },
      reasons: [
        'Certificate found in official database',
        'Blockchain hash verification successful',
        'AI tamper detection score below threshold',
        'OCR extraction confidence high (92%)'
      ]
    },
    forged: {
      verdict: 'FORGED',
      icon: <FiXCircle className="w-16 h-16 mx-auto" />,
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-500',
      details: {
        name: 'Jane Smith',
        rollNo: 'CS21B1002',
        certificateId: 'CERT-2024-002',
        marks: '95%',
        dateIssued: '2024-02-20',
        issuingAuthority: 'Tech University'
      },
      ocrConfidence: 78,
      checks: {
        database: { status: 'Mismatch', icon: <FiXCircle className="text-red-500" />, success: false },
        blockchain: { status: 'Forged', icon: <FiXCircle className="text-red-500" />, success: false },
        aiScore: 0.87
      },
      reasons: [
        'AI detected high copy-move score (0.87)',
        'Certificate hash not found on blockchain',
        'Inconsistencies found in database records',
        'Suspicious alterations detected in document structure'
      ]
    },
    suspicious: {
      verdict: 'SUSPICIOUS',
      icon: <FiAlertTriangle className="w-16 h-16 mx-auto" />,
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-800',
      borderColor: 'border-amber-500',
      details: {
        name: 'Alex Johnson',
        rollNo: 'CS21B1003',
        certificateId: 'CERT-2024-003',
        marks: '78%',
        dateIssued: '2024-03-10',
        issuingAuthority: 'Tech University'
      },
      ocrConfidence: 65,
      checks: {
        database: { status: 'No Record', icon: <FiXCircle className="text-red-500" />, success: false },
        blockchain: { status: 'Not Registered', icon: <FiXCircle className="text-red-500" />, success: false },
        aiScore: 0.45
      },
      reasons: [
        'Certificate not found in database',
        'No blockchain registration found',
        'Moderate AI tamper score (0.45)',
        'Low OCR confidence (65%) suggests poor quality or alterations'
      ]
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      setCertificateId('');
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setUploadedFile(file);
      setCertificateId('');
    }
  };

  const handleVerify = () => {
    if (!uploadedFile && !certificateId.trim()) {
      alert('Please upload a file or enter a certificate ID');
      return;
    }

    setVerificationState('loading');
    
    // Simulate verification process
    setTimeout(() => {
      // Randomly select one of the mock results for demonstration
      const results = Object.values(mockResults);
      const randomResult = results[Math.floor(Math.random() * results.length)];
      setVerificationResult(randomResult);
      setVerificationState('result');
    }, 3000);
  };

  const resetVerification = () => {
    setVerificationState('initial');
    setUploadedFile(null);
    setCertificateId('');
    setVerificationResult(null);
  };

  const getAiScoreColor = (score) => {
    if (score < 0.3) return 'bg-green-500';
    if (score < 0.6) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getAiScoreText = (score) => {
    if (score < 0.3) return 'Low Risk';
    if (score < 0.6) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {verificationState === 'initial' && (
        <>
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-5xl font-extrabold text-gray-900 mb-4">
              Verify Certificate Authenticity
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Instantly confirm the validity of any certificate using a powerful combination of AI, Database, and Blockchain technologies.
            </p>
          </div>

          {/* Verification Card */}
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl mx-auto border-t-4 border-blue-500">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Upload Certificate or Enter ID
            </h3>

            {/* Upload Section */}
            <div className="mb-6">
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.querySelector('input[type="file"]').click()}
              >
                <div className="space-y-3">
                  <FiUploadCloud className="w-12 h-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-lg font-semibold text-gray-800">Drop your file here or <span className="text-blue-600">browse</span></p>
                    <p className="text-sm text-gray-500">PDF, JPG, PNG supported (max 5MB)</p>
                  </div>
                  {uploadedFile && (
                    <div className="text-sm text-green-600 font-medium flex items-center justify-center space-x-2 pt-2">
                      <FiFileText />
                      <span>Selected: {uploadedFile.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* OR Separator */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-semibold uppercase">OR</span>
              </div>
            </div>

            {/* Input Section */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Certificate ID
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                placeholder="e.g., CERT-2024-001"
                value={certificateId}
                onChange={(e) => {
                  setCertificateId(e.target.value);
                  if (e.target.value.trim()) {
                    setUploadedFile(null);
                  }
                }}
              />
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={!uploadedFile && !certificateId.trim()}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
            >
              Verify Certificate
            </button>
          </div>
        </>
      )}

      {verificationState === 'loading' && (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            Verifying Certificate...
          </h3>
          <p className="text-gray-600">
            Running AI analysis, database lookup, and blockchain verification. Please wait.
          </p>
        </div>
      )}

      {verificationState === 'result' && verificationResult && (
        <div className="space-y-8">
          {/* Verdict Card */}
          <div className={`${verificationResult.bgColor} ${verificationResult.borderColor} border-l-8 rounded-lg p-6 text-center shadow-lg`}>
            <div className={`${verificationResult.textColor} mb-4`}>{verificationResult.icon}</div>
            <h2 className={`text-4xl font-bold ${verificationResult.textColor}`}>
              Certificate is {verificationResult.verdict}
            </h2>
            <p className={`text-lg opacity-90 mt-2 ${verificationResult.textColor}`}>
              Verification completed using multiple security checks.
            </p>
          </div>

          {/* Extracted Details Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FiFileText className="mr-3 text-blue-600" />
              Extracted Certificate Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Name</span>
                  <p className="text-gray-900 font-semibold">{verificationResult.details.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Roll No</span>
                  <p className="text-gray-900 font-semibold">{verificationResult.details.rollNo}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Certificate ID</span>
                  <p className="text-gray-900 font-semibold">{verificationResult.details.certificateId}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Marks</span>
                  <p className="text-gray-900 font-semibold">{verificationResult.details.marks}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Date Issued</span>
                  <p className="text-gray-900 font-semibold">{verificationResult.details.dateIssued}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Issuing Authority</span>
                  <p className="text-gray-900 font-semibold">{verificationResult.details.issuingAuthority}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-500">OCR Confidence</span>
              <div className="flex items-center mt-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2.5 mr-3">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${verificationResult.ocrConfidence}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  {verificationResult.ocrConfidence}%
                </span>
              </div>
            </div>
          </div>

          {/* Verification Checks Summary Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FiShield className="mr-3 text-blue-600" />
              Verification Breakdown
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <FiDatabase className="mr-3 text-gray-600" />
                  <span className="font-semibold text-gray-800">Database Check</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`font-semibold ${verificationResult.checks.database.success ? 'text-green-600' : 'text-red-600'}`}>
                    {verificationResult.checks.database.status}
                  </span>
                  <span className="text-xl">{verificationResult.checks.database.icon}</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <FiBox className="mr-3 text-gray-600" />
                  <span className="font-semibold text-gray-800">Blockchain Check</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`font-semibold ${verificationResult.checks.blockchain.success ? 'text-green-600' : 'text-red-600'}`}>
                    {verificationResult.checks.blockchain.status}
                  </span>
                  <span className="text-xl">{verificationResult.checks.blockchain.icon}</span>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <FiCpu className="mr-3 text-gray-600" />
                    <span className="font-semibold text-gray-800">AI Tamper Score</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {verificationResult.checks.aiScore.toFixed(2)} - {getAiScoreText(verificationResult.checks.aiScore)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${getAiScoreColor(verificationResult.checks.aiScore)}`}
                    style={{ width: `${verificationResult.checks.aiScore * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Explainable Reasons Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FiInfo className="mr-3 text-blue-600" />
              Reasons for Verdict
            </h3>
            <ul className="space-y-3">
              {verificationResult.reasons.map((reason, index) => (
                <li key={index} className="flex items-start">
                  <span className={`w-2 h-2 rounded-full mt-1.5 mr-3 flex-shrink-0 ${verificationResult.textColor.replace('text-', 'bg-').replace('800', '500')}`}></span>
                  <span className="text-gray-700">{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Button */}
          <div className="text-center">
            <button
              onClick={resetVerification}
              className="bg-emerald-500 text-white py-3 px-8 rounded-lg font-semibold text-lg hover:bg-emerald-600 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-300 flex items-center justify-center mx-auto space-x-2"
            >
              <FiRefreshCw />
              <span>Verify Another Certificate</span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default VerificationPage;
