import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext'; // Import useAuth to access user info and signOut
import axios from 'axios'; // Import axios for API calls
import AutomationLogSection from '../components/AutomationLogSection';
import FailedUrlsSection from '../components/FailedUrlsSection';
import AIUsageSection from '../components/AIUsageSection';
import AdminChatInterface from '../components/AdminChatInterface';
import BatchSummaryInterface from '../components/BatchSummaryInterface';
import BatchImageInterface from '../components/BatchImageInterface';

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
  
  // --- State for UI Management ---
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const expandedFeaturesRef = useRef<HTMLDivElement>(null);
  
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
  const [imageGenerationMode, setImageGenerationMode] = useState<'single' | 'batch'>('single');

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

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <button
            onClick={() => setExpandedFeature('run-automation')}
            className="group relative flex items-center justify-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
          >
            <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm font-medium text-indigo-700">Run Automation</span>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Run the complete automation suite (Google fetch + Email check + Tweet post)
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </button>

          <button
            onClick={() => setExpandedFeature('fetch-news')}
            className="group relative flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
          >
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-sm font-medium text-blue-700">Fetch News</span>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Manually fetch news articles from Google search queries
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </button>

          <button
            onClick={() => setExpandedFeature('check-emails')}
            className="group relative flex items-center justify-center p-4 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors"
          >
            <svg className="w-5 h-5 text-teal-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-teal-700">Check Emails</span>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Check submitted emails for new article URLs to process
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </button>

          <button
            onClick={() => setExpandedFeature('tweet-candidates')}
            className="group relative flex items-center justify-center p-4 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 transition-colors"
          >
            <svg className="w-5 h-5 text-sky-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm font-medium text-sky-700">Tweet Candidates</span>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Get next articles ready for Twitter posting with generated tweet text
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </button>

          <button
            onClick={() => setExpandedFeature('add-article')}
            className="group relative flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
          >
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-sm font-medium text-green-700">Add Article</span>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Manually submit a single article URL for processing
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </button>

          <button
            onClick={() => setExpandedFeature('regenerate-image')}
            className="group relative flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
          >
            <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-purple-700">Regenerate Image</span>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Regenerate AI image for a specific article by ID
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </button>

          <button
            onClick={() => setExpandedFeature('check-database')}
            className="group relative flex items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
          >
            <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm font-medium text-orange-700">Check Database</span>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Scan database for duplicate URLs and data integrity issues
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </button>

          <button
            onClick={() => setExpandedFeature('batch-process')}
            className="group relative flex items-center justify-center p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
          >
            <svg className="w-5 h-5 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-sm font-medium text-emerald-700">Batch Process</span>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Process multiple articles in batches for AI updates
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </button>

          <button
            onClick={() => setExpandedFeature('cron-status')}
            className="group relative flex items-center justify-center p-4 bg-cyan-50 hover:bg-cyan-100 rounded-lg border border-cyan-200 transition-colors"
          >
            <svg className="w-5 h-5 text-cyan-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-cyan-700">Cron Status</span>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Check cron job status and server uptime
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </button>

          <button
            onClick={() => setExpandedFeature('ai-usage')}
            className="group relative flex items-center justify-center p-4 bg-violet-50 hover:bg-violet-100 rounded-lg border border-violet-200 transition-colors"
          >
            <svg className="w-5 h-5 text-violet-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm font-medium text-violet-700">AI Usage</span>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Track OpenAI and Anthropic API usage, costs, and performance
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </button>

          <button
            onClick={() => {
              setExpandedFeature('ai-chat');
              // Scroll to the expanded features section
              setTimeout(() => {
                expandedFeaturesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }}
            className="group relative flex items-center justify-center p-4 bg-pink-50 hover:bg-pink-100 rounded-lg border border-pink-200 transition-colors"
          >
            <svg className="w-5 h-5 text-pink-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm font-medium text-pink-700">AI Chat</span>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Chat with AI using general or microplastics research modes
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </button>

          <button
            onClick={() => {
              setExpandedFeature('batch-summaries');
              // Scroll to the expanded features section
              setTimeout(() => {
                expandedFeaturesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }}
            className="group relative flex items-center justify-center p-4 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
          >
            <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium text-amber-700">Batch Summaries</span>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Generate AI summaries for articles missing summaries (processes 2 at a time)
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </button>
        </div>
      </div>

      {/* Expanded Features */}
      {expandedFeature && (
        <div ref={expandedFeaturesRef} className="space-y-6">
          {/* Run Automation Feature */}
          {expandedFeature === 'run-automation' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Run Automation Suite</h3>
              <p className="text-sm text-gray-600 mb-4">
                Run the complete automation suite (Google fetch + Email check + Tweet post). 
                This is the same process that runs automatically daily at 2:00 AM UTC.
              </p>
              <button
                onClick={handleTriggerAutomation}
                disabled={isRunningAutomation}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {isRunningAutomation ? 'Running Full Automation...' : 'Run Full Automation Suite'}
              </button>

              {automationError && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg">
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
                      💡 <strong>Tip:</strong> Check the "View Logs" section for detailed results of each task.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fetch News Feature */}
          {expandedFeature === 'fetch-news' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual News Fetch</h3>
              <p className="text-sm text-gray-600 mb-4">
                Manually fetch news articles from Google search queries. This will process all configured search queries and add new articles to the database.
              </p>
              <button
                onClick={handleTriggerFetchClick}
                disabled={isFetching}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {isFetching ? `Processing Query ${currentQueryIndex !== null ? currentQueryIndex + 1 : ''}...` : 'Fetch All News Queries'}
              </button>

              {fetchError && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg">
                  <strong>Error:</strong> {fetchError}
                </div>
              )}
              
              {(isFetching || fetchCompleted) && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-800 mb-2">
                    <strong>Total New Articles Added: {totalAdded}</strong>
                  </p>
                  <div className="space-y-2">
                    {searchQueries.map((query, index) => (
                      <div key={index} className="text-sm">
                        <span className="text-gray-700">Query {index + 1}: {query}</span>
                        <span 
                          className={`ml-2 font-semibold ${
                            fetchProgress[index]?.status === 'success' ? 'text-green-600' : 
                            fetchProgress[index]?.status === 'error' ? 'text-red-600' : 
                            'text-gray-500'
                          }`}
                        >
                          {` ${fetchProgress[index]?.message || 'Queued'}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Check Emails Feature */}
          {expandedFeature === 'check-emails' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Processing</h3>
              <p className="text-sm text-gray-600 mb-4">
                Check submitted emails for new article URLs to process. This will scan the configured email account for new submissions and add them to the database.
              </p>
              <button
                onClick={handleCheckSubmittedEmails}
                disabled={isCheckingEmails}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {isCheckingEmails ? 'Checking Emails...' : 'Check Submitted Emails'}
              </button>

              {emailCheckResult && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-green-500 text-xl mr-2">📧</span>
                    <span className="text-gray-700 font-semibold">Email Processing Results</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{emailCheckResult.message}</p>
                  {emailCheckResult.error && (
                    <p className="text-sm text-red-600 mb-3"><strong>Error:</strong> {emailCheckResult.error}</p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {emailCheckResult.processedCount > 0 && (
                      <div className="bg-green-100 p-3 rounded text-center">
                        <div className="text-2xl font-bold text-green-600">{emailCheckResult.processedCount}</div>
                        <div className="text-sm text-green-800">Successfully Processed</div>
                      </div>
                    )}
                    {emailCheckResult.failedCount > 0 && (
                      <div className="bg-red-100 p-3 rounded text-center">
                        <div className="text-2xl font-bold text-red-600">{emailCheckResult.failedCount}</div>
                        <div className="text-sm text-red-800">Failed to Process</div>
                      </div>
                    )}
                  </div>
                  
                  {emailCheckResult.processedUrls && emailCheckResult.processedUrls.length > 0 && (
                    <div className="mb-3">
                      <p className="font-bold text-green-700 text-sm mb-2">✅ Successfully Added URLs:</p>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {emailCheckResult.processedUrls.map((url, index) => (
                          <div key={index} className="text-sm text-green-700 break-all bg-green-50 p-2 rounded">
                            {url}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {emailCheckResult.failedUrls && emailCheckResult.failedUrls.length > 0 && (
                    <div>
                      <p className="font-bold text-red-700 text-sm mb-2">❌ Failed URLs:</p>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {emailCheckResult.failedUrls.map((failure, index) => (
                          <div key={index} className="text-sm bg-red-50 p-2 rounded">
                            <div className="text-red-700 break-all">{failure.url || 'Unknown URL'}</div>
                            {failure.reason && (
                              <div className="text-gray-600 text-xs mt-1">
                                Reason: {failure.reason}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tweet Candidates Feature */}
          {expandedFeature === 'tweet-candidates' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Twitter Integration</h3>
              <p className="text-sm text-gray-600 mb-4">
                Get next articles ready for Twitter posting with generated tweet text. You can review and edit the generated tweets before posting.
              </p>
              <button
                onClick={handleFetchTweetCandidates}
                disabled={isFetchingCandidates}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {isFetchingCandidates ? 'Fetching...' : 'Fetch Next Tweet Candidates'}
              </button>

              {tweetCandidateError && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg">
                  <strong>Error:</strong> {tweetCandidateError}
                </div>
              )}

              {postSuccessMessage && (
                <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg">
                  <strong>Success:</strong> {postSuccessMessage}
                </div>
              )}
              
              {tweetCandidates.length > 0 && (
                <div className="mt-6 space-y-6">
                  {tweetCandidates.map((candidate) => (
                    <div key={candidate.id} className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-semibold text-lg text-gray-900 mb-2">{candidate.title}</h4>
                      <a href={candidate.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all block mb-3">
                        {candidate.url}
                      </a>
                      
                      <div className="space-y-2">
                        <label htmlFor={`tweet-text-${candidate.id}`} className="block text-sm font-medium text-gray-700">
                          Generated Tweet Text (Editable)
                        </label>
                        <textarea
                          id={`tweet-text-${candidate.id}`}
                          value={candidate.generatedTweetText}
                          onChange={(e) => handleTweetTextChange(candidate.id, e.target.value)}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        />
                      </div>

                      <button
                        onClick={() => handlePostTweet(candidate.id)}
                        disabled={isPosting === candidate.id}
                        className="mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isPosting === candidate.id ? 'Posting...' : 'Post This Tweet'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add Article Feature */}
          {expandedFeature === 'add-article' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Article Submission</h3>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label htmlFor="submit-url" className="block text-sm font-medium text-gray-700 mb-2">
                    Article URL
                  </label>
                  <input
                    id="submit-url"
                    type="url"
                    value={submitUrl}
                    onChange={(e) => setSubmitUrl(e.target.value)}
                    placeholder="Enter article URL"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Article'}
                </button>
              </form>
              {submitMessage && (
                <div className={`mt-4 p-3 rounded-lg ${submitMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {submitMessage.text}
                </div>
              )}
            </div>
          )}

          {/* Regenerate Image Feature */}
          {expandedFeature === 'regenerate-image' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Regenerate Image</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setImageGenerationMode('single')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      imageGenerationMode === 'single'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Single
                  </button>
                  <button
                    onClick={() => setImageGenerationMode('batch')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      imageGenerationMode === 'batch'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Batch
                  </button>
                </div>
              </div>

              {imageGenerationMode === 'single' ? (
                <form onSubmit={handleRegenerateImageById} className="space-y-4">
                  <div>
                    <label htmlFor="regenerate-id" className="block text-sm font-medium text-gray-700 mb-2">
                      Article ID (UUID)
                    </label>
                    <input
                      id="regenerate-id"
                      type="text"
                      value={articleIdToRegenerate}
                      onChange={(e) => setArticleIdToRegenerate(e.target.value)}
                      placeholder="Enter the full article ID"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isRegeneratingImage}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isRegeneratingImage ? 'Regenerating...' : 'Regenerate Image'}
                  </button>
                  {regenerateImageMessage && (
                    <div className={`mt-4 p-3 rounded-lg ${regenerateImageMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {regenerateImageMessage.text}
                    </div>
                  )}
                </form>
              ) : (
                <BatchImageInterface backendUrl={BACKEND_URL} />
              )}
            </div>
          )}

          {/* Batch Process Feature */}
          {expandedFeature === 'batch-process' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Batch AI Processing</h3>
              <form onSubmit={handleBatchUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="batch-size" className="block text-sm font-medium text-gray-700 mb-2">
                      Batch Size
                    </label>
                    <input
                      id="batch-size"
                      type="number"
                      value={batchSize}
                      onChange={(e) => setBatchSize(parseInt(e.target.value, 10))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="continue-token" className="block text-sm font-medium text-gray-700 mb-2">
                      Continue Token (optional)
                    </label>
                    <input
                      id="continue-token"
                      type="text"
                      value={continueToken}
                      onChange={(e) => setContinueToken(e.target.value)}
                      placeholder="Last processed ID"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isBatchProcessing}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isBatchProcessing ? 'Processing...' : 'Start/Continue Batch'}
                </button>
              </form>
              {batchMessage && (
                <div className={`mt-4 p-3 rounded-lg ${batchMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {batchMessage.text}
                </div>
              )}
              {batchResults.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Batch Results:</h4>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {batchResults.map((result) => (
                      <div key={result.id} className={`p-3 rounded-lg text-sm ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        Story {result.id}: {result.success ? `Updated ${result.updates?.join(', ')}` : `Failed - ${result.message}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Check Database Feature */}
          {expandedFeature === 'check-database' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Integrity Check</h3>
              <p className="text-sm text-gray-600 mb-4">
                Check for duplicate URLs in the database. This scans all {duplicateCheckResult?.databaseCount || '1200+'} records to identify any duplicates.
              </p>
              <button
                onClick={handleCheckDuplicates}
                disabled={isCheckingDuplicates}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {isCheckingDuplicates ? 'Checking...' : 'Check for Duplicate URLs'}
              </button>

              {duplicateCheckError && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg">
                  <strong>Error:</strong> {duplicateCheckError}
                </div>
              )}

              {duplicateCheckResult && (
                <div className="mt-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold text-lg mb-3">📊 Database Analysis Results</h4>
                    
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
                        <h5 className="font-semibold mb-2">🔍 Top Duplicated URLs:</h5>
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
          )}

          {/* Cron Status Feature */}
          {expandedFeature === 'cron-status' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Cron Job Status</h3>
                <button
                  onClick={fetchCronStatus}
                  disabled={isFetchingCronStatus}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isFetchingCronStatus ? 'Refreshing...' : 'Refresh Status'}
                </button>
              </div>
              
              {cronStatus ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-3">Schedule Information</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Schedule:</strong> {cronStatus.cronSchedule} (Daily at 2:00 AM UTC)</p>
                      <p><strong>Next Run:</strong> {new Date(cronStatus.nextScheduledRun).toLocaleString()}</p>
                      <p><strong>Current Time:</strong> {new Date(cronStatus.currentTime).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-3">System Status</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        <strong>Cron Job Status:</strong> 
                        <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                          cronStatus.cronJobRunning ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                        }`}>
                          {cronStatus.cronJobRunning ? 'RUNNING' : 'STOPPED'}
                        </span>
                      </p>
                      <p><strong>Server Uptime:</strong> {Math.floor(cronStatus.serverUptime / 3600)}h {Math.floor((cronStatus.serverUptime % 3600) / 60)}m</p>
                      <p><strong>Timezone:</strong> {cronStatus.timezone}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-red-600">Unable to fetch cron job status. Please check server connection.</p>
              )}
              
              {cronStatus?.appSleepingWarning && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-yellow-600 font-semibold mr-2">⚠️ Warning:</span>
                    <p className="text-sm text-yellow-700">{cronStatus.appSleepingWarning}</p>
                  </div>
                  <p className="text-xs text-yellow-600 mt-2">
                    Consider using an external cron service to call /api/admin/trigger-automation at 2am UTC, or upgrade to a Railway plan with always-on services.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* AI Usage Tracking Feature */}
          {expandedFeature === 'ai-usage' && (
            <AIUsageSection />
          )}

          {/* AI Chat Feature */}
          {expandedFeature === 'ai-chat' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Research Assistant</h3>
              <p className="text-sm text-gray-600 mb-4">
                Chat with AI using either general conversation or microplastics research mode. 
                The research mode searches through your article database to provide research-backed answers.
              </p>
              <AdminChatInterface backendUrl={BACKEND_URL} />
            </div>
          )}

          {/* Batch Summaries Feature */}
          {expandedFeature === 'batch-summaries' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Batch Summary Generation</h3>
              <p className="text-sm text-gray-600 mb-4">
                Generate AI summaries for articles that are missing summaries. This processes articles in batches of 2 to avoid rate limiting.
              </p>
              <BatchSummaryInterface backendUrl={BACKEND_URL} />
            </div>
          )}
        </div>
      )}

      {/* View Logs Toggle */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <button
          onClick={() => setExpandedFeature(expandedFeature === 'view-logs' ? null : 'view-logs')}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-sm font-medium">View Logs</span>
          <svg 
            className={`w-4 h-4 ml-2 transition-transform ${expandedFeature === 'view-logs' ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* System Logs */}
      {expandedFeature === 'view-logs' && (
        <div className="space-y-6">
          <AutomationLogSection />
          <FailedUrlsSection />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderOverview()}
        </div>
      </main>
    </div>
  );
};

export default AdminPage; 