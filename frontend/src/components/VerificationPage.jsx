import { useState } from 'react';
import {
  FiUploadCloud, FiFileText, FiCheckCircle, FiXCircle, FiAlertTriangle,
  FiDatabase, FiBox, FiCpu, FiInfo, FiRefreshCw, FiShield, FiBarChart2,
  FiSearch, FiEye, FiAward
} from 'react-icons/fi';
import { verificationAPI, publicVerificationAPI } from '../lib/api';

const VerificationPage = ({ onVerificationSuccess, onShowRegister }) => {
  const [verificationState, setVerificationState] = useState('initial'); // 'initial', 'loading', 'result'
  const [uploadedFile, setUploadedFile] = useState(null);
  const [certificateId, setCertificateId] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

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

  const handleVerify = async () => {
    if (!uploadedFile && !certificateId.trim()) {
      alert('Please upload a file or enter a certificate ID');
      return;
    }

    setVerificationState('loading');

    try {
      let response;
      if (certificateId.trim()) {
        // Verify by certificate ID
        response = await publicVerificationAPI.verifyCertificate(certificateId.trim());
      } else {
        // Verify by file upload
        response = await publicVerificationAPI.verifyCertificate(uploadedFile);
      }

      // Transform backend response to frontend format
      const transformedResult = transformBackendResponse(response);
      setVerificationResult(transformedResult);
      setVerificationState('result');

      if (transformedResult.verdict === 'VALID') {
        // Optional: Automatically navigate, or wait for user to click
        // onVerificationSuccess();
      }
    } catch (error) {
      console.error('Verification failed:', error);
      // Show error result
      setVerificationResult({
        verdict: 'ERROR',
        icon: <FiAlertTriangle className="w-16 h-16 mx-auto" />,
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-500',
        details: {
          error: error.message || 'Verification failed'
        },
        checks: {
          database: {
            status: 'Connection Failed',
            icon: <FiXCircle className="text-red-500" />,
            success: false
          },
          blockchain: {
            status: 'Unavailable',
            icon: <FiXCircle className="text-red-500" />,
            success: false
          },
          aiScore: 0
        },
        reasons: ['API connection failed', 'Please try again later']
      });
      setVerificationState('result');
    }
  };

  // Transform backend response to frontend format
  const transformBackendResponse = (response) => {
    const { status, data } = response;

    if (status === 'success' && data.result === 'VALID') {
      return {
        verdict: 'VALID',
        icon: <FiCheckCircle className="w-16 h-16 mx-auto" />,
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-500',
        details: data.details || {},
        ocrConfidence: data.ocrConfidence || 0,
        checks: {
          database: {
            status: data.databaseMatch ? 'Matched' : 'Not Found',
            icon: data.databaseMatch ? <FiCheckCircle className="text-green-500" /> : <FiXCircle className="text-red-500" />,
            success: data.databaseMatch
          },
          blockchain: {
            status: data.blockchainValid ? 'Valid' : 'Invalid',
            icon: data.blockchainValid ? <FiCheckCircle className="text-green-500" /> : <FiXCircle className="text-red-500" />,
            success: data.blockchainValid
          },
          aiScore: data.aiScore || 0
        },
        reasons: data.reasons || []
      };
    } else {
      return {
        verdict: 'FORGED',
        icon: <FiXCircle className="w-16 h-16 mx-auto" />,
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-500',
        details: data.details || {},
        ocrConfidence: data.ocrConfidence || 0,
        checks: {
          database: {
            status: data.databaseMatch ? 'Matched' : 'Not Found',
            icon: data.databaseMatch ? <FiCheckCircle className="text-green-500" /> : <FiXCircle className="text-red-500" />,
            success: data.databaseMatch
          },
          blockchain: {
            status: data.blockchainValid ? 'Valid' : 'Invalid',
            icon: data.blockchainValid ? <FiCheckCircle className="text-green-500" /> : <FiXCircle className="text-red-500" />,
            success: data.blockchainValid
          },
          aiScore: data.aiScore || 0
        },
        reasons: data.reasons || ['Certificate could not be verified']
      };
    }
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
    <div className="min-h-screen bg-gray-50 font-sans">
      {verificationState === 'initial' && (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-primary-600 p-4 rounded-2xl">
                <FiShield className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-bold text-gray-900 mb-6 text-balance">
              Verify Certificate Authenticity
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 text-balance">
              Instantly confirm the validity of any certificate using our advanced combination of
              AI analysis, database verification, and blockchain technology.
            </p>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-8 mb-12">
              <div className="flex items-center gap-2 text-gray-700">
                <FiCpu className="text-primary-600" />
                <span className="font-medium">AI Powered</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <FiDatabase className="text-primary-600" />
                <span className="font-medium">Database Verified</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <FiBox className="text-primary-600" />
                <span className="font-medium">Blockchain Secured</span>
              </div>
            </div>
          </div>

          {/* Main Verification Card */}
          <div className="max-w-2xl mx-auto">
            <div className="card-elevated-lg p-8 mb-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
                  Verify Your Certificate
                </h2>
                <p className="text-gray-600">
                  Upload your certificate or enter the Certificate ID
                </p>
              </div>

              {/* File Upload Section */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Upload Certificate File
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-primary-400 hover:bg-primary-50 transition-all duration-300 cursor-pointer group"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => document.querySelector('input[type="file"]').click()}
                >
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <FiUploadCloud className="w-16 h-16 text-gray-400 group-hover:text-primary-500 transition-colors" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-800 mb-1">
                        Drop your certificate here or <span className="text-primary-600">browse files</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports PDF, JPG, PNG files (max 10MB)
                      </p>
                    </div>
                    {uploadedFile && (
                      <div className="inline-flex items-center gap-3 bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium">
                        <FiFileText className="w-4 h-4" />
                        <span>Selected: {uploadedFile.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                />
              </div>

              {/* OR Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-6 bg-white text-gray-500 font-semibold tracking-wider uppercase">
                    Or
                  </span>
                </div>
              </div>

              {/* Certificate ID Input */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Enter Certificate ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="input-field pl-12 text-lg"
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
              </div>

              {/* Verify Button */}
              <button
                onClick={handleVerify}
                disabled={!uploadedFile && !certificateId.trim()}
                className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                <FiShield className="w-5 h-5" />
                Verify Certificate
              </button>

              {/* ...existing code... */}
            </div>

            {/* Secondary Actions */}
            <div className="space-y-4 text-center">
              <a
                href="#institutes"
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                <FiEye className="w-4 h-4" />
                View Verified Institutes
              </a>

              {/* Register Institute Button */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  Are you an educational institution?
                </p>
                <button
                  onClick={() => onShowRegister && onShowRegister()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-primary-600 text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <FiAward className="w-4 h-4" />
                  Register Your Institute
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {verificationState === 'loading' && (
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="mb-8">
              <div className="loading-spinner mx-auto mb-6"></div>
              <div className="space-y-2">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-600 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-display font-bold text-gray-900 mb-4">
              Verifying Certificate...
            </h3>
            <div className="space-y-2 text-gray-600">
              <p className="flex items-center justify-center gap-2">
                <FiCpu className="w-4 h-4 text-primary-600" />
                AI analysis in progress
              </p>
              <p className="flex items-center justify-center gap-2">
                <FiDatabase className="w-4 h-4 text-primary-600" />
                Checking database records
              </p>
              <p className="flex items-center justify-center gap-2">
                <FiBox className="w-4 h-4 text-primary-600" />
                Verifying blockchain hash
              </p>
            </div>
          </div>
        </main>
      )}



      {verificationState === 'result' && verificationResult && (
        <main className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-8 fade-in">
              {/* Verdict Card */}
              <div className={`card-elevated-lg p-8 text-center border-l-8 ${verificationResult.verdict === 'VALID' ? 'status-valid border-success-500' :
                verificationResult.verdict === 'FORGED' ? 'status-forged border-danger-500' :
                  'status-suspicious border-warning-500'
                }`}>
                <div className="mb-6">
                  {verificationResult.verdict === 'VALID' ? (
                    <FiCheckCircle className="w-20 h-20 mx-auto text-success-600" />
                  ) : verificationResult.verdict === 'FORGED' ? (
                    <FiXCircle className="w-20 h-20 mx-auto text-danger-600" />
                  ) : (
                    <FiAlertTriangle className="w-20 h-20 mx-auto text-warning-600" />
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
                  Certificate is{' '}
                  <span className={
                    verificationResult.verdict === 'VALID' ? 'text-success-700' :
                      verificationResult.verdict === 'FORGED' ? 'text-danger-700' :
                        'text-warning-700'
                  }>
                    {verificationResult.verdict}
                  </span>
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                  Verification completed using multi-layer security analysis
                </p>

                {/* Trust Score - if valid */}
                {verificationResult.verdict === 'VALID' && (
                  <div className="inline-flex items-center gap-3 bg-success-100 text-success-800 px-6 py-3 rounded-xl font-semibold text-lg">
                    <FiAward className="w-6 h-6" />
                    <span>Trust Score: 98%</span>
                  </div>
                )}
              </div>

              {/* Extracted Details Card */}
              <div className="card-elevated p-6">
                <h3 className="text-xl font-display font-bold text-gray-900 mb-6 flex items-center">
                  <FiFileText className="mr-3 text-primary-600 w-6 h-6" />
                  Certificate Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Name</label>
                      <p className="text-lg font-medium text-gray-900">{verificationResult.details.name || 'Not available'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Roll Number</label>
                      <p className="text-lg font-medium text-gray-900">{verificationResult.details.rollNo || 'Not available'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Certificate ID</label>
                      <p className="text-lg font-medium text-gray-900 font-mono">{verificationResult.details.certificateId || 'Not available'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Marks/Grade</label>
                      <p className="text-lg font-medium text-gray-900">{verificationResult.details.marks || 'Not available'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Date Issued</label>
                      <p className="text-lg font-medium text-gray-900">{verificationResult.details.dateIssued || 'Not available'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Issuing Authority</label>
                      <p className="text-lg font-medium text-gray-900">{verificationResult.details.issuingAuthority || 'Not available'}</p>
                    </div>
                  </div>
                </div>

                {/* OCR Confidence */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-500 uppercase tracking-wide">OCR Confidence</label>
                    <span className="text-sm font-bold text-gray-800">{verificationResult.ocrConfidence || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${verificationResult.ocrConfidence || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Verification Breakdown Card */}
              <div className="card-elevated p-6">
                <h3 className="text-xl font-display font-bold text-gray-900 mb-6 flex items-center">
                  <FiShield className="mr-3 text-primary-600 w-6 h-6" />
                  Security Verification Breakdown
                </h3>
                <div className="space-y-4">
                  {/* Database Check */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center">
                      <div className="bg-white p-3 rounded-lg mr-4">
                        <FiDatabase className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Database Verification</h4>
                        <p className="text-sm text-gray-600">Official records check</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`font-semibold ${verificationResult.checks?.database?.success ? 'text-success-600' : 'text-danger-600'}`}>
                        {verificationResult.checks?.database?.status || 'Unknown'}
                      </span>
                      <div className="text-2xl">{verificationResult.checks?.database?.icon || <FiXCircle className="text-red-500" />}</div>
                    </div>
                  </div>

                  {/* Blockchain Check */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center">
                      <div className="bg-white p-3 rounded-lg mr-4">
                        <FiBox className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Blockchain Verification</h4>
                        <p className="text-sm text-gray-600">Immutable hash validation</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`font-semibold ${verificationResult.checks?.blockchain?.success ? 'text-success-600' : 'text-danger-600'}`}>
                        {verificationResult.checks?.blockchain?.status || 'Unknown'}
                      </span>
                      <div className="text-2xl">{verificationResult.checks?.blockchain?.icon || <FiXCircle className="text-red-500" />}</div>
                    </div>
                  </div>

                  {/* AI Tamper Detection */}
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="bg-white p-3 rounded-lg mr-4">
                          <FiCpu className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">AI Tamper Detection</h4>
                          <p className="text-sm text-gray-600">Document integrity analysis</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-800">
                          Score: {(verificationResult.checks?.aiScore || 0).toFixed(2)}
                        </div>
                        <div className={`text-sm font-semibold ${getAiScoreColor(verificationResult.checks?.aiScore || 0).replace('bg-', 'text-').replace('500', '600')}`}>
                          {getAiScoreText(verificationResult.checks?.aiScore || 0)}
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${getAiScoreColor(verificationResult.checks?.aiScore || 0)}`}
                        style={{ width: `${(verificationResult.checks?.aiScore || 0) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explainable Reasons Card */}
              <div className="card-elevated p-6">
                <h3 className="text-xl font-display font-bold text-gray-900 mb-6 flex items-center">
                  <FiInfo className="mr-3 text-primary-600 w-6 h-6" />
                  Verification Explanation
                </h3>
                <div className="space-y-4">
                  {verificationResult.reasons && verificationResult.reasons.map((reason, index) => (
                    <div key={index} className="flex items-start">
                      <div className={`w-3 h-3 rounded-full mt-2 mr-4 flex-shrink-0 ${verificationResult.verdict === 'VALID' ? 'bg-success-500' :
                        verificationResult.verdict === 'FORGED' ? 'bg-danger-500' :
                          'bg-warning-500'
                        }`}></div>
                      <p className="text-gray-700 leading-relaxed">{reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={resetVerification}
                  className="btn-secondary"
                >
                  <FiRefreshCw className="w-5 h-5" />
                  <span>Verify Another Certificate</span>
                </button>
                {verificationResult.verdict === 'VALID' && onVerificationSuccess && (
                  <button
                    onClick={onVerificationSuccess}
                    className="btn-success"
                  >
                    <FiBarChart2 className="w-5 h-5" />
                    <span>View Trust Score Analytics</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

export default VerificationPage;
