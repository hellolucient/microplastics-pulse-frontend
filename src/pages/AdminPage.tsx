import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Import useAuth to access user info and signOut
import axios from 'axios'; // Import axios for API calls

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001'; // Fallback for safety

// Interface for progress tracking
interface FetchProgress {
    [queryIndex: number]: {
        status: 'pending' | 'processing' | 'success' | 'error';
        message: string;
        addedCount?: number;
    };
}

// Interface for search queries response
interface SearchQueriesResponse {
    queries: string[];
}

// Interface for trigger fetch response
interface TriggerFetchResponse {
    message: string;
    query: string;
    addedCount: number;
    nextIndex: number | null;
}

// Interface for batch update response
interface BatchUpdateResult {
  id: number | string;
  success: boolean;
  message?: string;
  updates?: string[];
}

interface BatchUpdateResponse {
  message: string;
  results: BatchUpdateResult[];
  continue_token?: string | null;
  done: boolean;
}

// Interface for Regenerate Image response
interface RegenerateImageResponse {
  message: string;
  article_id: number | string;
  new_ai_image_url: string;
}

// Interface for email check success response
interface EmailCheckSuccessResponse {
  message: string;
  processedCount: number;
  failedCount: number;
  failedUrls: string[];
}

const AdminPage: React.FC = () => {
  const { user, signOut } = useAuth();
  // --- State for Manual Submission Form ---
  const [submitUrl, setSubmitUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  // --- State for Manual Fetch Button ---
  const [isFetching, setIsFetching] = useState(false);

  // --- State for Dynamic Manual Fetch ---
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [fetchProgress, setFetchProgress] = useState<FetchProgress>({});
  const [currentQueryIndex, setCurrentQueryIndex] = useState<number | null>(null);
  const [totalAdded, setTotalAdded] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchCompleted, setFetchCompleted] = useState(false);

  // --- State for Batch AI Updates ---
  const [batchSize, setBatchSize] = useState(2);
  const [continueToken, setContinueToken] = useState('');
  const [batchResults, setBatchResults] = useState<BatchUpdateResult[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchMessage, setBatchMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // --- State for Regenerate Image by ID ---
  const [articleIdToRegenerate, setArticleIdToRegenerate] = useState('');
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  const [regenerateImageMessage, setRegenerateImageMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // --- State for Checking Submitted Emails ---
  const [isCheckingEmails, setIsCheckingEmails] = useState(false);
  const [emailCheckMessage, setEmailCheckMessage] = useState<string | null>(null);
  const [emailCheckProcessedCount, setEmailCheckProcessedCount] = useState<number | null>(null);
  const [emailCheckFailedCount, setEmailCheckFailedCount] = useState<number | null>(null);
  const [emailCheckFailedUrls, setEmailCheckFailedUrls] = useState<string[]>([]);
  const [emailCheckError, setEmailCheckError] = useState<string | null>(null);

  // Fetch search queries on mount
  useEffect(() => {
    const fetchQueries = async () => {
        try {
            // Explicitly type the expected response data
            const response = await axios.get<SearchQueriesResponse>(`${BACKEND_URL}/api/search-queries`);
            if (response.data && Array.isArray(response.data.queries)) {
                setSearchQueries(response.data.queries);
            }
        } catch (error) {
            console.error("Failed to fetch search queries:", error);
            setFetchError("Could not load search queries list from backend.");
        }
    };
    fetchQueries();
  }, []);

  const handleLogout = async () => {
    await signOut();
    // Navigate to home or login page after logout handled by AuthProvider listener
  };

  // --- Form Submit Handler ---
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    if (!submitUrl || !submitUrl.startsWith('http')) {
        setSubmitMessage({ type: 'error', text: 'Please enter a valid URL starting with http/https.'});
        setIsSubmitting(false);
        return;
    }

    try {
        // Using fetch here, so keeping its error handling style
        const response = await fetch(`${BACKEND_URL}/api/add-news`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: submitUrl })
        });

        const result = await response.json();

        if (!response.ok) {
            // Use error message from backend if available, otherwise generic
            throw new Error(result.message || result.error || `HTTP error! status: ${response.status}`);
        }

        setSubmitMessage({ type: 'success', text: result.message || 'Article submitted successfully! Processing in background...' });
        setSubmitUrl(''); // Clear input on success

    } catch (error: unknown) {
        console.error('Error submitting URL:', error);
        if (error instanceof Error) {
            setSubmitMessage({ type: 'error', text: `Submission failed: ${error.message}` });
        } else {
            setSubmitMessage({ type: 'error', text: 'An unknown error occurred during submission.' });
        }
    } finally {
        setIsSubmitting(false);
    }
  };
  // --- End Form Submit Handler ---

  // --- Dynamic Manual Fetch Logic ---
  const processFetchQueue = async (index: number) => {
      if (index >= searchQueries.length) { 
          setIsFetching(false);
          setCurrentQueryIndex(null);
          setFetchCompleted(true);
          console.log("Fetch queue finished (index out of bounds).");
          return;
      }

      setCurrentQueryIndex(index);
      setFetchProgress(prev => ({
          ...prev,
          [index]: { status: 'processing', message: 'Processing...' }
      }));

      try {
          // Explicitly type the expected success response data
          const response = await axios.post<TriggerFetchResponse>(`${BACKEND_URL}/api/trigger-fetch`, { queryIndex: index });
          const { addedCount, nextIndex, message } = response.data; 

          setTotalAdded(prev => prev + (addedCount || 0));
          setFetchProgress(prev => ({
              ...prev,
              [index]: { status: 'success', message: message || `Completed. Added: ${addedCount}` }
          }));

          if (nextIndex !== null) {
              await processFetchQueue(nextIndex);
          } else {
              setIsFetching(false);
              setCurrentQueryIndex(null);
              setFetchCompleted(true);
          }

      } catch (error: unknown) {
          console.error(`Error processing query index ${index}:`, error);
          let errorMessage = 'An unknown error occurred';
          if (axios.isAxiosError(error) && error.response) {
              // Use detailed error from backend if available
              errorMessage = error.response.data.details || error.response.data.message || errorMessage;
          } else if (error instanceof Error) {
              errorMessage = error.message;
          }
          setFetchError(errorMessage);
      }
  };

  const handleTriggerFetchClick = () => {
    if (isFetching || searchQueries.length === 0) return;

    setIsFetching(true);
    setFetchError(null);
    setFetchProgress({}); // Reset progress
    setTotalAdded(0);
    setCurrentQueryIndex(0);
    setFetchCompleted(false);

    processFetchQueue(0); // Start the queue
  };
  // --- End Dynamic Manual Fetch Logic ---

  // --- Batch AI Updates ---
  const handleBatchUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBatchProcessing(true);
    setBatchMessage(null);
    setBatchResults([]);
    
    try {
      const response = await axios.post<BatchUpdateResponse>(`${BACKEND_URL}/api/batch-update-stories`, {
        batch_size: parseInt(batchSize.toString()),
        continue_token: continueToken || undefined
      });
      
      const data = response.data;
      
      setBatchMessage({ 
        type: 'success', 
        text: data.message + (data.done ? ' - All processing complete!' : '')
      });
      setBatchResults(data.results || []);
      
      if (data.continue_token) {
        setContinueToken(data.continue_token);
      } else if (data.done) {
        setContinueToken('');
      }
      
    } catch (err: any) {
      console.error('Error running batch update:', err);
      setBatchMessage({ 
        type: 'error', 
        text: `Error: ${err.response?.data?.error || err.message}` 
      });
    } finally {
      setIsBatchProcessing(false);
    }
  };
  // --- End Batch AI Updates ---

  // --- Regenerate Image by ID Handler ---
  const handleRegenerateImageById = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegeneratingImage(true);
    setRegenerateImageMessage(null);

    const idToRegenerate = articleIdToRegenerate.trim();

    if (!idToRegenerate) {
      setRegenerateImageMessage({ type: 'error', text: 'Please enter an Article ID.' });
      setIsRegeneratingImage(false);
      return;
    }

    // Basic UUID format check on the frontend (optional, but good for quick feedback)
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(idToRegenerate)) {
      setRegenerateImageMessage({ type: 'error', text: 'Article ID must be a valid UUID format (e.g., xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).' });
      setIsRegeneratingImage(false);
      return;
    }

    try {
      // Explicitly type the expected success response data
      const response = await axios.post<RegenerateImageResponse>(`${BACKEND_URL}/api/regenerate-image`, {
        article_id: idToRegenerate // Send the UUID string
      });
      
      setRegenerateImageMessage({ type: 'success', text: response.data.message });
      setArticleIdToRegenerate(''); // Clear input on success
      // Optionally, you could trigger a refresh of any displayed data if needed

    } catch (err: any) {
      console.error('Error regenerating image by ID:', err);
      setRegenerateImageMessage({ 
        type: 'error', 
        text: `Error: ${err.response?.data?.error || err.message}` 
      });
    } finally {
      setIsRegeneratingImage(false);
    }
  };
  // --- End Regenerate Image by ID Handler ---

  // --- Check Submitted Emails Handler ---
  const handleCheckSubmittedEmails = async () => {
    setIsCheckingEmails(true);
    setEmailCheckMessage(null);
    setEmailCheckProcessedCount(null);
    setEmailCheckFailedCount(null);
    setEmailCheckFailedUrls([]);
    setEmailCheckError(null);

    try {
      const response = await axios.get<EmailCheckSuccessResponse>(`${BACKEND_URL}/api/admin/check-submitted-emails`);
      const { message, processedCount, failedCount, failedUrls } = response.data;
      
      // Use the raw message from backend as the primary display message
      setEmailCheckMessage(message || 'Email check process completed.');
      setEmailCheckProcessedCount(processedCount);
      setEmailCheckFailedCount(failedCount);
      setEmailCheckFailedUrls(failedUrls || []);

    } catch (error: unknown) {
      console.error('Error checking submitted emails:', error);
      let errorMessage = 'An unknown error occurred while checking emails.';
      if (axios.isAxiosError(error) && error.response) {
        // Use detailed error from backend if available
        errorMessage = error.response.data.details || error.response.data.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      setEmailCheckError(errorMessage);
    } finally {
      setIsCheckingEmails(false);
    }
  };
  // --- End Check Submitted Emails Handler ---

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        {user && (
            <button 
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
                Logout ({user.email?.split('@')[0]})
            </button>
        )}
      </div>
      
      {/* Manual News Submission Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl font-semibold mb-4">Manual News Submission</h2>
        <form onSubmit={handleManualSubmit}>
            <label htmlFor="newsUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Enter News Article URL:
            </label>
            <div className="flex gap-2">
                <input
                    type="url" 
                    id="newsUrl"
                    value={submitUrl}
                    onChange={(e) => setSubmitUrl(e.target.value)}
                    placeholder="https://example.com/news-article"
                    required
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={isSubmitting}
                />
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Submitting...' : 'Add Article'}
                </button>
            </div>
             {submitMessage && (
                <p className={`mt-3 text-sm ${submitMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                    {submitMessage.text}
                </p>
            )}
        </form>
        <p className="mt-3 text-xs text-gray-500">Submitting a URL will trigger backend processing (AI summary) and save it to the database if new.</p>
      </div>

      {/* Dynamic Manual Fetch Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Manual News Fetch</h2>
        <button
            onClick={handleTriggerFetchClick}
            disabled={isFetching || searchQueries.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isFetching ? `Fetching ${currentQueryIndex !== null ? `${currentQueryIndex + 1}/${searchQueries.length}` : '...'}` : 'Trigger Manual News Fetch'}
        </button>
        {searchQueries.length === 0 && !fetchError && <p className="mt-2 text-sm text-gray-500">Loading search queries...</p>}
        {fetchError && <p className="mt-2 text-sm text-red-600">{fetchError}</p>}
      </div>

      {/* Progress Display */}
      {(isFetching || Object.keys(fetchProgress).length > 0) && (
          <div className="mt-4 p-3 rounded bg-gray-100">
              {fetchProgress[currentQueryIndex]?.message || 'Pending...'}
          </div>
      )}

    </div>
  );
};

export default AdminPage; 