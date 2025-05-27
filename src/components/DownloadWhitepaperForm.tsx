import React, { useState } from 'react';
import axios from 'axios';
import { FileText, DownloadCloud, X } from 'lucide-react';

// Assume BACKEND_URL is available, e.g., from import.meta.env.VITE_BACKEND_API_URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001'; 
const whitepaperUrl = "/Microplastics - the Elephant in the Wellness Room.pdf";

// Simple pulsing animation CSS
const pulsingKeyframes = `
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.7;
    }
  }
`;
const pulseAnimationStyle = {
  animation: 'pulse 2s infinite'
};

const DownloadWhitepaperForm: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [whitepaperEmail, setWhitepaperEmail] = useState('');
  const [showDownloadLink, setShowDownloadLink] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const handleIconClick = () => {
    setIsFormOpen(true);
    // Reset form state when opening
    setShowDownloadLink(false);
    setSubmissionError(null);
    setWhitepaperEmail('');
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleWhitepaperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (!whitepaperEmail || !/\S+@\S+\.\S+/.test(whitepaperEmail)) {
      setSubmissionError('Please enter a valid email address.');
      return;
    }

    setIsSubmittingEmail(true);
    try {
      const response = await axios.post<{ message?: string; error?: string }>(`${BACKEND_URL}/api/whitepaper-signup`, { email: whitepaperEmail });
      if (response.status === 200 || response.status === 201) {
        setShowDownloadLink(true);
        setWhitepaperEmail(''); // Clear email field
      } else {
        setSubmissionError(response.data.message || response.data.error || 'An unexpected error occurred.');
      }
    } catch (error: any) {
      console.error('Error submitting email for whitepaper:', error);
      if (error.response && error.response.data && (error.response.data.error || error.response.data.message) ) {
        setSubmissionError(error.response.data.error || error.response.data.message);
      } else if (error.message) {
        setSubmissionError(error.message);
      } else {
        setSubmissionError('Failed to submit email. Please try again.');
      }
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  if (!isFormOpen) {
    return (
      <>
        <style>{pulsingKeyframes}</style> {/* Inject keyframes */} 
        <div 
          onClick={handleIconClick} 
          style={pulseAnimationStyle}
          className="cursor-pointer p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
        >
          <FileText size={32} className="text-green-600" />
        </div>
      </>
    );
  }

  // Form is open
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"> {/* Modal container */}
      <div className="bg-white p-6 pt-8 rounded-lg shadow-xl max-w-sm w-full relative sm:p-8"> {/* Adjusted max-width and padding */}
        <button 
          onClick={handleCloseForm} 
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close form"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6"> {/* Centered header text */}
          <div className="inline-block bg-green-100 p-3 rounded-full mb-3">
            <FileText size={28} className="text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800">
            Download Our Whitepaper
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            "Microplastics - the Elephant in the Wellness Room"
          </p>
        </div>
        
        {!showDownloadLink ? (
          <div className="space-y-4"> {/* Container for form elements with spacing */}
            <p className="text-sm text-gray-600 text-center px-2">
              Enter your email address below to receive the download link.
            </p>
            <form onSubmit={handleWhitepaperSubmit} className="w-full">
              <input
                type="email"
                value={whitepaperEmail}
                onChange={(e) => setWhitepaperEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:opacity-70"
                disabled={isSubmittingEmail}
              />
              {submissionError && (
                <p className="mt-2 text-xs text-red-600 text-center">{submissionError}</p>
              )}
              {isSubmittingEmail && (
                <p className="mt-2 text-xs text-gray-500 flex items-center justify-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400 mr-2"></span>
                  Submitting...
                </p>
              )}
            </form>
          </div>
        ) : (
          <div className="text-center py-4">
             <p className="text-base text-green-700 font-semibold mb-3">Thank you!</p>
             <p className="text-sm text-gray-600 mb-4">You can now download the whitepaper.</p>
            <a
              href={whitepaperUrl}
              download
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-green-600 text-white font-semibold text-base shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150 no-underline"
            >
              <DownloadCloud size={20} />
              Download PDF
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadWhitepaperForm; 