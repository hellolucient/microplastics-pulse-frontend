import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Import useAuth to access user info and signOut
import axios from 'axios'; // Import axios for API calls
import AutomationLogSection from '../components/AutomationLogSection';
import FailedUrlsSection from '../components/FailedUrlsSection';

const BACKEND_URL = import.meta.env.DEV ? 'http://localhost:3001' : ''; // Fallback for safety

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
interface FailedUrl {
  url: string;
  reason: string;
}

interface EmailCheckSuccessResponse {
  message: string;
  processedCount: number;
  failedCount: number;
  failedUrls: FailedUrl[];
  processedUrls: string[];
}

// --- ADDED: Interface for Tweet Candidate ---
interface Story {
  id: string;
  title: string;
  ai_summary: string;
  ai_image_url?: string | null;
  url: string;
  // Add other fields from your 'latest_news' table as needed
}

interface TweetCandidate extends Story {
  generatedTweetText?: string;
}
// --- END ADDED ---



interface DuplicateCheckResponse {
  totalRecords: number;
  databaseCount: number;
  uniqueUrls: number;
  duplicateUrls: number;
  duplicatePercentage: string;
  duplicateGroups: Array<{
    url: string;
    occurrences: number;
    originalId: number;
    duplicateIds: number[];
  }>;
}

// Interface for automation trigger response
interface AutomationTriggerResponse {
  message: string;
  status: 'SUCCESS' | 'FAILURE';
  details: {
    google_fetch: { status: string; details: string; articles_added: number };
    email_check: { status: string; details: string };
    tweet_post: { status: string; details: string };
  };
  timestamp: string;
}

// Interface for cron status response
interface CronStatusResponse {
  currentTime: string;
  cronSchedule: string;
  cronJobRunning: boolean;
  nextScheduledRun: string;
  serverUptime: number;
  timezone: string;
  appSleepingWarning?: string;
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
  const [emailCheckResult, setEmailCheckResult] = useState<EmailCheckSuccessResponse & { error?: string } | null>(null);

  // --- State for Duplicate URL Checker ---
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<DuplicateCheckResponse | null>(null);
  const [duplicateCheckError, setDuplicateCheckError] = useState<string | null>(null);

  // --- State for Manual Automation Trigger ---
  const [isRunningAutomation, setIsRunningAutomation] = useState(false);
  const [automationResult, setAutomationResult] = useState<AutomationTriggerResponse | null>(null);
  const [automationError, setAutomationError] = useState<string | null>(null);

  // --- State for Cron Status ---
  const [cronStatus, setCronStatus] = useState<CronStatusResponse | null>(null);
  const [isFetchingCronStatus, setIsFetchingCronStatus] = useState(false);

  // --- ADDED: State for Twitter Feature ---
  const [isFetchingCandidates, setIsFetchingCandidates] = useState(false);
  const [tweetCandidates, setTweetCandidates] = useState<TweetCandidate[]>([]);
  const [tweetCandidateError, setTweetCandidateError] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState<string | null>(null); // Holds the ID of the story being posted
  const [postSuccessMessage, setPostSuccessMessage] = useState<string | null>(null);
  // --- END ADDED ---

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

  // --- Manual Submission Handler ---
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitUrl) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await axios.post<{ message: string; data?: any; code: string }>(`${BACKEND_URL}/api/add-news`, { url: submitUrl });
      setSubmitMessage({ 
        type: 'success', 
        text: response.data.message || 'Article processed successfully.' 
      });
      setSubmitUrl(''); // Clear input on success

    } catch (err: any) {
      console.error('Error submitting URL manually:', err);
      const errorResponse = err.response?.data;
      let errorMessage = 'An unknown error occurred';
      let errorDetails = '';

      if (errorResponse) {
        errorMessage = errorResponse.error || errorResponse.message || errorMessage;
        errorDetails = errorResponse.details || '';
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Handle specific error codes
      const errorCode = errorResponse?.code || '';
      switch (errorCode) {
        case 'URL_DUPLICATE':
        case 'URL_DUPLICATE_RACE':
          setSubmitMessage({ 
            type: 'error', 
            text: `${errorMessage} ${errorDetails}` 
          });
          break;
        case 'GOOGLE_RATE_LIMIT':
          setSubmitMessage({ 
            type: 'error', 
            text: `${errorMessage} Please wait a few minutes before trying again.` 
          });
          break;
        case 'ARTICLE_NOT_FOUND':
          setSubmitMessage({ 
            type: 'error', 
            text: `${errorMessage} ${errorDetails}` 
          });
          break;
        case 'AI_SUMMARY_FAILED':
        case 'AI_IMAGE_FAILED':
          setSubmitMessage({ 
            type: 'error', 
            text: `Processing failed: ${errorMessage}. ${errorDetails}` 
          });
          break;
        default:
          setSubmitMessage({ 
            type: 'error', 
            text: errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage 
          });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  // --- End Manual Submission Handler ---

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
          const response = await axios.post<TriggerFetchResponse>(`${BACKEND_URL}/api/trigger-fetch`, { queryIndex: index }, {
              timeout: 180000 // 3 minute timeout - increased for complex queries
          });
          const { addedCount, nextIndex, message } = response.data; 

          setTotalAdded(prev => prev + (addedCount || 0));
          setFetchProgress(prev => ({
              ...prev,
              [index]: { status: 'success', message: message || `Completed. Added: ${addedCount}`, addedCount: addedCount }
          }));

          if (nextIndex !== null) {
              await processFetchQueue(nextIndex); // Process next item
          } else {
              setIsFetching(false);
              setCurrentQueryIndex(null);
              setFetchCompleted(true);
          }

      } catch (error: unknown) {
          console.error(`Error processing query index ${index}:`, error);
          let errorMessage = 'An unknown error occurred';

          // Simplified error message extraction
          if (error && typeof error === 'object') {
              let extracted = false;
              if ('response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data) {
                  const data = error.response.data as any; // Use any for simplicity here
                  if (data.error) {
                      errorMessage = String(data.error);
                      extracted = true;
                  } else if (data.details) {
                      errorMessage = String(data.details);
                      extracted = true;
                  }
              }
              // Fallback to error message if specific fields weren't found or no response data
              if (!extracted && 'message' in error) {
                  errorMessage = String(error.message);
              }
          }

          setFetchProgress(prev => ({
              ...prev,
              [index]: { status: 'error', message: `Error: ${errorMessage}` }
          }));
          setFetchError(`Failed on query ${index + 1}. ${errorMessage}`);
          
          // Continue to next query on error instead of stopping completely
          const nextIndex = index + 1;
          if (nextIndex < searchQueries.length) {
              console.log(`Continuing to next query ${nextIndex + 1} after error on ${index + 1}`);
              setTimeout(() => processFetchQueue(nextIndex), 1000); // Small delay before continuing
          } else {
              setIsFetching(false);
              setCurrentQueryIndex(null);
              setFetchCompleted(true);
          }
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

    const initialProgress: FetchProgress = {};
    searchQueries.forEach((_, index) => {
      initialProgress[index] = { status: 'pending', message: 'Waiting...' };
    });
    setFetchProgress(initialProgress);

    processFetchQueue(0); // Start the queue
  };
  // --- End Dynamic Manual Fetch Logic ---

  // --- Batch AI Update Logic ---
  const handleBatchUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBatchProcessing(true);
    setBatchMessage(null);
    try {
      const response = await axios.post<BatchUpdateResponse>(`/api/batch-update-stories`, {
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
        text: `Batch update failed: ${err.response?.data?.error || err.message}.` 
      });
    } finally {
      setIsBatchProcessing(false);
    }
  };
  // --- End Batch AI Update Logic ---

  // --- Regenerate Image by ID Handler ---
  const handleRegenerateImageById = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleIdToRegenerate) return;

    setIsRegeneratingImage(true);
    setRegenerateImageMessage(null);

    const idToRegenerate = articleIdToRegenerate;

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
    setEmailCheckResult(null);

    try {
      const response = await axios.post<EmailCheckSuccessResponse>(`${BACKEND_URL}/api/admin/check-emails`);
      setEmailCheckResult(response.data);

    } catch (error: any) {
      console.error('Error checking submitted emails:', error);
      
      let errorMessage = 'An unknown error occurred while checking emails.';
      let errorDetails = '';
      
      // Get error details from response if available
      if (error.response?.data) {
        const errorData = error.response.data;
        errorMessage = errorData.error || errorMessage;
        errorDetails = errorData.details || '';
        
        // Handle specific error codes
        switch (errorData.code) {
          case 'EMAIL_CONFIG_MISSING':
            errorMessage = 'Email configuration is missing on the server.';
            errorDetails = 'Please check the server configuration.';
            break;
          case 'EMAIL_AUTH_FAILED':
            errorMessage = 'Failed to authenticate with Gmail.';
            errorDetails = 'Please verify the email credentials on the server.';
            break;
          case 'EMAIL_TIMEOUT':
            errorMessage = 'Connection to Gmail timed out.';
            errorDetails = 'Please try again. If the problem persists, contact support.';
            break;
          case 'EMAIL_CONNECTION_FAILED':
            errorMessage = 'Could not connect to Gmail.';
            errorDetails = 'The email service is currently unavailable. Please try again later.';
            break;
          case 'DB_UNAVAILABLE':
            errorMessage = 'Database connection is unavailable.';
            errorDetails = 'Please try again later.';
            break;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setEmailCheckResult({ 
        error: errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage,
        message: '',
        processedCount: 0,
        failedCount: 0,
        failedUrls: [],
        processedUrls: []
      });
    } finally {
      setIsCheckingEmails(false);
    }
  };
  // --- End Check Submitted Emails Handler ---

  // --- Duplicate URL Checker Handler ---
  const handleCheckDuplicates = async () => {
    setIsCheckingDuplicates(true);
    setDuplicateCheckResult(null);
    setDuplicateCheckError(null);

    try {
      const response = await axios.post<DuplicateCheckResponse>(`${BACKEND_URL}/api/admin/check-duplicates`);
      setDuplicateCheckResult(response.data);
    } catch (error: any) {
      console.error('Error checking duplicates:', error);
      const errorMessage = error.response?.data?.details || error.response?.data?.error || error.message || 'An unknown error occurred';
      setDuplicateCheckError(`Failed to check duplicates: ${errorMessage}`);
    } finally {
      setIsCheckingDuplicates(false);
    }
  };
  // --- End Duplicate URL Checker Handler ---

  // --- Manual Automation Trigger Handler ---
  const handleTriggerAutomation = async () => {
    setIsRunningAutomation(true);
    setAutomationResult(null);
    setAutomationError(null);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/admin/trigger-automation`);
      
      // Handle both success (200) and partial success (207) as successful completion
      if (response.status === 200 || response.status === 207) {
        setAutomationResult(response.data as AutomationTriggerResponse);
        // Clear any previous errors since the automation completed
        setAutomationError(null);
      } else {
        // This shouldn't happen with axios, but just in case
        const errorMessage = (response.data as any)?.details || (response.data as any)?.error || 'Unexpected response status';
        setAutomationError(`Automation completed with issues: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error('Error triggering automation:', error);
      
      // Check if it's a partial success (207) that axios treated as an error
      if (error.response?.status === 207) {
        setAutomationResult(error.response.data as AutomationTriggerResponse);
        setAutomationError(null);
      } else {
        const errorMessage = error.response?.data?.details || error.response?.data?.error || error.message || 'An unknown error occurred';
        setAutomationError(`Failed to run automation: ${errorMessage}`);
      }
    } finally {
      setIsRunningAutomation(false);
    }
  };
  // --- End Manual Automation Trigger Handler ---

  // --- Cron Status Handler ---
  const fetchCronStatus = async () => {
    setIsFetchingCronStatus(true);
    try {
      const response = await axios.get<CronStatusResponse>(`${BACKEND_URL}/api/admin/cron-status`);
      setCronStatus(response.data);
    } catch (error: any) {
      console.error('Error fetching cron status:', error);
      setCronStatus(null);
    } finally {
      setIsFetchingCronStatus(false);
    }
  };

  // Fetch cron status on component mount
  useEffect(() => {
    fetchCronStatus();
  }, []);
  // --- End Cron Status Handler ---

  // --- ADDED: Twitter Feature Handlers ---

  const handleFetchTweetCandidates = async () => {
    setIsFetchingCandidates(true);
    setTweetCandidateError(null);
    setTweetCandidates([]);
    setPostSuccessMessage(null);

    try {
      const response = await axios.get<TweetCandidate[]>(`${BACKEND_URL}/api/admin/next-tweet-candidate`);
      
      // The backend now returns the fully-formed preview text, so no need to generate it here.
      setTweetCandidates(response.data);

    } catch (error: any) {
      console.error('Error fetching tweet candidates:', error);
      if (error.response) {
        setTweetCandidateError(error.response.data?.message || 'Failed to fetch candidates.');
      } else if (error instanceof Error) {
        setTweetCandidateError(error.message);
      } else {
        setTweetCandidateError('An unknown error occurred.');
      }
    } finally {
      setIsFetchingCandidates(false);
    }
  };

  const handleTweetTextChange = (id: string, newText: string) => {
    setTweetCandidates(prev => 
      prev.map(c => (c.id === id ? { ...c, generatedTweetText: newText } : c))
    );
  };

  const handlePostTweet = async (id: string) => {
    const candidate = tweetCandidates.find(c => c.id === id);
    if (!candidate) return;

    setIsPosting(id);
    setPostSuccessMessage(null);
    setTweetCandidateError(null); // Clear previous errors

    try {
      await axios.post<{ message: string, tweet: any }>(`${BACKEND_URL}/api/admin/post-tweet`, {
        storyId: candidate.id,
        tweetText: candidate.generatedTweetText
      });

      setPostSuccessMessage(`Tweet for "${candidate.title}" posted successfully!`);
      // Remove the posted candidate from the list
      setTweetCandidates(prev => prev.filter(c => c.id !== id));

    } catch (error: any) {
      console.error('Error posting tweet:', error);
      if (error.response) {
        setTweetCandidateError(error.response.data?.error || 'Failed to post tweet.');
      } else if (error instanceof Error) {
        setTweetCandidateError(error.message);
      } else {
        setTweetCandidateError('An unknown error occurred while posting.');
      }
    } finally {
      setIsPosting(null);
    }
  };

  // --- END ADDED ---

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <div>
            <span className="text-gray-600 mr-4">Welcome, {user?.email}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            >
              Logout
            </button>
          </div>
        </div>

        <AutomationLogSection />

        {/* Cron Job Status */}
        <div className="mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-700">Cron Job Status</h2>
              <button
                onClick={fetchCronStatus}
                disabled={isFetchingCronStatus}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300"
              >
                {isFetchingCronStatus ? 'Refreshing...' : 'Refresh Status'}
              </button>
            </div>
            
            {cronStatus ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Schedule Information</h3>
                  <p className="text-sm text-gray-600"><strong>Schedule:</strong> {cronStatus.cronSchedule} (Daily at 2:00 AM UTC)</p>
                  <p className="text-sm text-gray-600"><strong>Next Run:</strong> {new Date(cronStatus.nextScheduledRun).toLocaleString()}</p>
                  <p className="text-sm text-gray-600"><strong>Current Time:</strong> {new Date(cronStatus.currentTime).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">System Status</h3>
                  <p className="text-sm text-gray-600">
                    <strong>Cron Job Status:</strong> 
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                      cronStatus.cronJobRunning ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                    }`}>
                      {cronStatus.cronJobRunning ? 'RUNNING' : 'STOPPED'}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600"><strong>Server Uptime:</strong> {Math.floor(cronStatus.serverUptime / 3600)}h {Math.floor((cronStatus.serverUptime % 3600) / 60)}m</p>
                  <p className="text-sm text-gray-600"><strong>Timezone:</strong> {cronStatus.timezone}</p>
                </div>
              </div>
              {cronStatus.appSleepingWarning && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-yellow-600 font-semibold mr-2">⚠️ Warning:</span>
                    <p className="text-sm text-yellow-700">{cronStatus.appSleepingWarning}</p>
                  </div>
                  <p className="text-xs text-yellow-600 mt-2">
                    Consider using an external cron service to call /api/admin/trigger-automation at 2am UTC, or upgrade to a Railway plan with always-on services.
                  </p>
                </div>
              )}
            ) : (
              <p className="text-red-600">Unable to fetch cron job status. Please check server connection.</p>
            )}
          </div>
        </div>
        
        <FailedUrlsSection />
        
        <div className="mt-8">
          {/* Manual Article Submission */}
          <div className="w-full mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Manual Article Submission</h2>
              <form onSubmit={handleManualSubmit}>
                <input
                  type="url"
                  value={submitUrl}
                  onChange={(e) => setSubmitUrl(e.target.value)}
                  placeholder="Enter article URL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-300"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-4 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit URL'}
                </button>
              </form>
              {submitMessage && (
                <div className={`mt-4 text-sm ${submitMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {submitMessage.text}
                </div>
              )}
            </div>
          </div>

          {/* Batch Process AI Data */}
          <div className="w-full mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Batch Process AI Data</h2>
                <form onSubmit={handleBatchUpdate} className="flex items-center space-x-4">
                  <div>
                    <label htmlFor="batch-size" className="block text-sm font-medium text-gray-700">
                      Batch Size
                    </label>
                    <input
                      id="batch-size"
                      type="number"
                      value={batchSize}
                      onChange={(e) => setBatchSize(parseInt(e.target.value, 10))}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="continue-token" className="block text-sm font-medium text-gray-700">
                      Continue Token (optional)
                    </label>
                    <input
                      id="continue-token"
                      type="text"
                      value={continueToken}
                      onChange={(e) => setContinueToken(e.target.value)}
                      placeholder="Last processed ID"
                      className="w-48 px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="pt-5">
                    <button
                      type="submit"
                      disabled={isBatchProcessing}
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-green-300"
                    >
                      {isBatchProcessing ? 'Processing...' : 'Start/Continue Batch'}
                    </button>
                  </div>
                </form>

                {batchMessage && (
                   <div className={`mt-4 text-sm ${batchMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {batchMessage.text}
                  </div>
                )}
                
                {batchResults.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-bold">Batch Results:</h3>
                    <ul className="list-disc list-inside text-sm max-h-60 overflow-y-auto">
                      {batchResults.map((result) => (
                        <li key={result.id} className={result.success ? 'text-gray-700' : 'text-red-700'}>
                          Story {result.id}: {result.success ? `Updated ${result.updates?.join(', ')}` : `Failed - ${result.message}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          </div>
          
          {/* Manual News Fetch from Google */}
          <div className="w-full mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Manual News Fetch from Google</h2>
              {searchQueries.length > 0 ? (
                <button
                  onClick={handleTriggerFetchClick}
                  disabled={isFetching}
                  className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:bg-indigo-300"
                >
                  {isFetching ? `Processing Query ${currentQueryIndex !== null ? currentQueryIndex + 1 : ''}...` : 'Fetch All News Queries'}
                </button>
              ) : (
                <p className="text-gray-500">Loading search queries or none available.</p>
              )}

              {fetchError && (
                <div className="mt-4 text-red-600">
                  <strong>Error:</strong> {fetchError}
                </div>
              )}
              
              {(isFetching || fetchCompleted) && (
                <div className="mt-4">
                  <p><strong>Total New Articles Added: {totalAdded}</strong></p>
                  <ul className="list-disc list-inside mt-2">
                    {searchQueries.map((query, index) => (
                      <li key={index} className="text-sm">
                        Query {index + 1}: {query} - 
                        <span 
                          className={`font-semibold ${
                            fetchProgress[index]?.status === 'success' ? 'text-green-600' : 
                            fetchProgress[index]?.status === 'error' ? 'text-red-600' : 
                            'text-gray-500'
                          }`}
                        >
                          {` ${fetchProgress[index]?.message || 'Queued'}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Twitter Integration */}
          <div className="w-full mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Post to Twitter</h2>
                <div className="space-y-4">
                  <button
                      onClick={handleFetchTweetCandidates}
                      disabled={isFetchingCandidates}
                      className="bg-sky-500 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded disabled:bg-sky-300"
                  >
                      {isFetchingCandidates ? 'Fetching...' : 'Fetch Next Tweet Candidates'}
                  </button>

                  {tweetCandidateError && (
                      <div className="mt-4 text-red-600">
                          <strong>Error:</strong> {tweetCandidateError}
                      </div>
                  )}

                  {postSuccessMessage && (
                      <div className="mt-4 text-green-600">
                          <strong>Success:</strong> {postSuccessMessage}
                      </div>
                  )}
                  
                  {tweetCandidates.length > 0 && (
                      <div className="mt-6 space-y-6">
                          {tweetCandidates.map((candidate) => (
                              <div key={candidate.id} className="p-4 border rounded-lg">
                                  <h3 className="font-bold text-lg">{candidate.title}</h3>
                                  <a href={candidate.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline break-all">{candidate.url}</a>
                                  
                                  <div className="mt-4">
                                      <label htmlFor={`tweet-text-${candidate.id}`} className="block text-sm font-medium text-gray-700">
                                          Generated Tweet Text (Editable)
                                      </label>
                                      <textarea
                                          id={`tweet-text-${candidate.id}`}
                                          value={candidate.generatedTweetText}
                                          onChange={(e) => handleTweetTextChange(candidate.id, e.target.value)}
                                          rows={6}
                                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-300"
                                      />
                                  </div>

                                  <button
                                      onClick={() => handlePostTweet(candidate.id)}
                                      disabled={isPosting === candidate.id}
                                      className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-green-300"
                                  >
                                      {isPosting === candidate.id ? 'Posting...' : 'Post This Tweet'}
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
                </div>
            </div>
          </div>

          {/* Email Processing */}
          <div className="w-full mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Email Processing</h2>
              <button
                onClick={handleCheckSubmittedEmails}
                disabled={isCheckingEmails}
                className="bg-teal-500 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded disabled:bg-teal-300"
              >
                {isCheckingEmails ? 'Checking...' : 'Check Submitted Emails'}
              </button>

              {emailCheckResult && (
                <div className="mt-4 p-4 bg-gray-100 rounded">
                  <p><strong>Result:</strong> {emailCheckResult.message}</p>
                  {emailCheckResult.error && <p className="text-red-600"><strong>Error:</strong> {emailCheckResult.error}</p>}
                  
                  {emailCheckResult.processedCount > 0 && <p>Successfully processed: {emailCheckResult.processedCount}</p>}
                  {emailCheckResult.failedCount > 0 && <p>Failed to process: {emailCheckResult.failedCount}</p>}
                  
                  {emailCheckResult.processedUrls && emailCheckResult.processedUrls.length > 0 && (
                    <div className="mt-3">
                      <p className="font-bold text-green-700">Successfully Added URLs:</p>
                      <ul className="list-disc list-inside text-sm">
                        {emailCheckResult.processedUrls.map((url, index) => (
                          <li key={index} className="mb-2">
                            <span className="text-green-700 break-all">{url}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {emailCheckResult.failedUrls && emailCheckResult.failedUrls.length > 0 && (
                    <div className="mt-3">
                      <p className="font-bold text-red-700">Failed URLs:</p>
                      <ul className="list-disc list-inside text-sm">
                        {emailCheckResult.failedUrls.map((failure, index) => (
                          <li key={index} className="mb-2">
                            <span className="text-red-700 break-all">{failure.url || 'Unknown URL'}</span>
                            {failure.reason && (
                              <span className="text-gray-600 ml-2 break-normal">
                                - {failure.reason}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Database Duplicate URL Checker */}
          <div className="w-full mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Database Integrity Check</h2>
              <p className="text-sm text-gray-600 mb-4">
                Check for duplicate URLs in the database. This scans all {duplicateCheckResult?.databaseCount || '1200+'} records to identify any duplicates.
              </p>
              <button
                onClick={handleCheckDuplicates}
                disabled={isCheckingDuplicates}
                className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:bg-purple-300"
              >
                {isCheckingDuplicates ? 'Checking...' : 'Check for Duplicate URLs'}
              </button>

              {duplicateCheckError && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  <strong>Error:</strong> {duplicateCheckError}
                </div>
              )}

              {duplicateCheckResult && (
                <div className="mt-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-bold text-lg mb-3">📊 Database Analysis Results</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-blue-100 p-3 rounded text-center">
                        <div className="text-2xl font-bold text-blue-600">{duplicateCheckResult.totalRecords}</div>
                        <div className="text-sm text-blue-800">Records Scanned</div>
                      </div>
                      <div className="bg-green-100 p-3 rounded text-center">
                        <div className="text-2xl font-bold text-green-600">{duplicateCheckResult.uniqueUrls}</div>
                        <div className="text-sm text-green-800">Unique URLs</div>
                      </div>
                      <div className={`p-3 rounded text-center ${duplicateCheckResult.duplicateUrls > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                        <div className={`text-2xl font-bold ${duplicateCheckResult.duplicateUrls > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {duplicateCheckResult.duplicateUrls}
                        </div>
                        <div className={`text-sm ${duplicateCheckResult.duplicateUrls > 0 ? 'text-red-800' : 'text-green-800'}`}>
                          Duplicates
                        </div>
                      </div>
                      <div className="bg-gray-100 p-3 rounded text-center">
                        <div className="text-2xl font-bold text-gray-600">{duplicateCheckResult.duplicatePercentage}%</div>
                        <div className="text-sm text-gray-800">Duplicate Rate</div>
                      </div>
                    </div>

                    {duplicateCheckResult.duplicateUrls === 0 ? (
                      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                        <div className="flex items-center">
                          <span className="text-green-500 text-xl mr-2">🎉</span>
                          <span className="text-green-700 font-semibold">Database is clean! No duplicate URLs found.</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-semibold mb-2">🔍 Top Duplicated URLs:</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {duplicateCheckResult.duplicateGroups.map((group, index) => (
                            <div key={index} className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="font-mono text-sm text-gray-600 break-all">{group.url}</div>
                                  <div className="text-sm text-gray-500 mt-1">
                                    Original ID: {group.originalId} | Duplicate IDs: {group.duplicateIds.join(', ')}
                                  </div>
                                </div>
                                <div className="ml-4 bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-semibold">
                                  {group.occurrences}x
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm text-blue-800">
                            💡 <strong>Tip:</strong> If duplicates are found, you can use the cleanup script from the terminal:
                            <code className="bg-blue-100 px-1 rounded ml-1">node scripts/check-duplicates.js</code>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Manual Automation Trigger */}
          <div className="w-full mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Manual Automation Trigger</h2>
              <p className="text-sm text-gray-600 mb-4">
                Manually run the complete automation suite (Google fetch + Email check + Tweet post). 
                This is the same process that runs automatically daily at 2:00 AM UTC.
              </p>
              <button
                onClick={handleTriggerAutomation}
                disabled={isRunningAutomation}
                className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:bg-indigo-300"
              >
                {isRunningAutomation ? 'Running Full Automation...' : 'Run Full Automation Suite'}
              </button>

              {automationError && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  <strong>Error:</strong> {automationError}
                </div>
              )}

              {automationResult && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-green-500 text-xl mr-2">✅</span>
                    <span className="text-green-700 font-semibold">Automation completed successfully!</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <strong>Completed at:</strong> {new Date(automationResult.timestamp).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {automationResult.message}
                  </p>
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Tip:</strong> Check the "Automation Task Logs" section above for detailed results of each task.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Batch Process AI Data */}
          <div className="w-full mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Batch Process AI Data</h2>
              <form onSubmit={handleBatchUpdate} className="flex items-center space-x-4">
                <div>
                  <label htmlFor="batch-size" className="block text-sm font-medium text-gray-700">
                    Batch Size
                  </label>
                  <input
                    id="batch-size"
                    type="number"
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value, 10))}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="continue-token" className="block text-sm font-medium text-gray-700">
                    Continue Token (optional)
                  </label>
                  <input
                    id="continue-token"
                    type="text"
                    value={continueToken}
                    onChange={(e) => setContinueToken(e.target.value)}
                    placeholder="Last processed ID"
                    className="w-48 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="pt-5">
                  <button
                    type="submit"
                    disabled={isBatchProcessing}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-green-300"
                  >
                    {isBatchProcessing ? 'Processing...' : 'Start/Continue Batch'}
                  </button>
                </div>
              </form>

              {batchMessage && (
                <div className={`mt-4 text-sm ${batchMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {batchMessage.text}
                </div>
              )}
              
              {batchResults.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-bold">Batch Results:</h3>
                  <ul className="list-disc list-inside text-sm max-h-60 overflow-y-auto">
                    {batchResults.map((result) => (
                      <li key={result.id} className={result.success ? 'text-gray-700' : 'text-red-700'}>
                        Story {result.id}: {result.success ? `Updated ${result.updates?.join(', ')}` : `Failed - ${result.message}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Regenerate Image */}
          <div className="w-full mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Regenerate Image by Article ID</h2>
              <form onSubmit={handleRegenerateImageById} className="flex items-center space-x-4">
                <div className="flex-grow">
                  <label htmlFor="regenerate-id" className="block text-sm font-medium text-gray-700">
                    Article ID (UUID)
                  </label>
                  <input
                    id="regenerate-id"
                    type="text"
                    value={articleIdToRegenerate}
                    onChange={(e) => setArticleIdToRegenerate(e.target.value)}
                    placeholder="Enter the full article ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isRegeneratingImage}
                  className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:bg-purple-300"
                >
                  {isRegeneratingImage ? 'Regenerating...' : 'Regenerate'}
                </button>
              </form>
              {regenerateImageMessage && (
                <div className={`mt-4 text-sm ${regenerateImageMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {regenerateImageMessage.text}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 