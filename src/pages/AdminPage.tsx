import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Import useAuth to access user info and signOut
import axios from 'axios'; // Import axios for API calls

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
interface EmailCheckSuccessResponse {
  message: string;
  processedCount: number;
  failedCount: number;
  failedUrls: string[];
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

interface ManualSubmissionResponse {
  success: boolean;
  message: string;
  data?: any; // You can define a more specific type for the article data if needed
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

  // --- Form Submit Handler ---
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitUrl) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await axios.post<ManualSubmissionResponse>(`${BACKEND_URL}/api/submit-article-url`, { url: submitUrl });

      if (response.data.success) {
        setSubmitMessage({type: 'success', text: response.data.message || 'Article submitted successfully!'});
        setSubmitUrl(''); // Clear input on success
      } else {
         throw new Error(response.data.message || 'An unknown error occurred during submission.');
      }
    } catch (error: any) {
      console.error('Error submitting URL:', error);
      const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred.';
      setSubmitMessage({type: 'error', text: `Submission failed: ${errorMessage}`});
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
          setIsFetching(false); // Stop the queue on error
          setCurrentQueryIndex(null);
          setFetchCompleted(true);
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

  // --- Batch Update Handler ---
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
        text: `Error: ${err.response?.data?.error || err.message}.` 
      });
    } finally {
      setIsBatchProcessing(false);
    }
  };
  // --- End Batch Update Handler ---

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
    setEmailCheckResult(null);

    try {
      const response = await axios.get<EmailCheckSuccessResponse>(`${BACKEND_URL}/api/admin/check-submitted-emails`);
      setEmailCheckResult(response.data);

    } catch (error: any) {
      console.error('Error checking submitted emails:', error);
      const errorMessage = error.response?.data?.details || error.response?.data?.message || error.message || 'An unknown error occurred while checking emails.';
      setEmailCheckResult({ 
        error: errorMessage, 
        message: '',
        processedCount: 0,
        failedCount: 0,
        failedUrls: []
      });
    } finally {
      setIsCheckingEmails(false);
    }
  };
  // --- End Check Submitted Emails Handler ---

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

    } catch (error: unknown) {
      console.error('Error fetching tweet candidates:', error);
      if (axios.isAxiosError(error)) {
        setTweetCandidateError(error.response?.data?.message || 'Failed to fetch candidates.');
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
      prev.map(candidate =>
        candidate.id === id ? { ...candidate, generatedTweetText: newText } : candidate
      )
    );
  };

  const handlePostTweet = async (candidateId: string) => {
    setIsPosting(candidateId);
    setTweetCandidateError(null);
    setPostSuccessMessage(null);

    // Find the specific candidate to get its text
    const candidateToPost = tweetCandidates.find(c => c.id === candidateId);
    if (!candidateToPost || !candidateToPost.generatedTweetText) {
      setTweetCandidateError('Could not find tweet text. Please try fetching candidates again.');
      setIsPosting(null);
      return;
    }

    try {
      // The backend expects storyId and tweetText
      const response = await axios.post(`${BACKEND_URL}/api/admin/post-tweet`, {
        storyId: candidateToPost.id,
        tweetText: candidateToPost.generatedTweetText,
      });

      setPostSuccessMessage(response.data.message || 'Tweet posted successfully!');
      // Remove the posted candidate from the list
      setTweetCandidates(prev => prev.filter(c => c.id !== candidateId));
    } catch (error: unknown) {
      console.error('Error posting tweet:', error);
      let errorMessage = 'An unknown error occurred while posting the tweet.';
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to post tweet.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      setTweetCandidateError(errorMessage); // Use the error state for the candidate section
    } finally {
      setIsPosting(null);
    }
  };

  // --- END ADDED ---

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
        <p className="mt-3 text-xs text-gray-500">Submitting a URL will trigger backend processing (AI summary/category) and save it to the database if new.</p>
      </div>

      {/* Dynamic Manual Fetch Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Manual News Fetch</h2>
        
        <div className="mb-4">
            <button 
              onClick={handleTriggerFetchClick} // Updated handler
              disabled={isFetching || searchQueries.length === 0} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFetching ? `Fetching ${currentQueryIndex !== null ? `${currentQueryIndex + 1}/${searchQueries.length}` : '...'}` : 'Trigger Manual News Fetch'}
            </button>
            {searchQueries.length === 0 && !fetchError && <p className="mt-2 text-sm text-gray-500">Loading search queries...</p>}
            {fetchError && <p className="mt-2 text-sm text-red-600">Error: {fetchError}</p>}
            {fetchCompleted && (
                <p className="mt-2 text-sm font-semibold text-green-700">
                    Fetch complete. Total new articles added: {totalAdded}
                </p>
            )}
            <p className="mt-2 text-xs text-gray-500">Manually trigger the backend to search all sources and add new articles step-by-step.</p>
        </div>

        {/* Progress Display */}
        {(isFetching || Object.keys(fetchProgress).length > 0) && (
            <div className="mt-4 border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">Fetch Progress:</h3>
                 {isFetching && currentQueryIndex !== null && (
                     <p className="mb-3 text-sm font-medium text-indigo-600">
                         Processing query {currentQueryIndex + 1} of {searchQueries.length}... Total added so far: {totalAdded}
                     </p>
                 )}
                <ul className="space-y-2 max-h-60 overflow-y-auto text-sm border rounded p-3 bg-gray-50">
                    {searchQueries.map((query, index) => (
                        <li key={index} className="flex justify-between items-center">
                            <span className="truncate mr-2" title={query}>{index + 1}. {query}</span>
                            <span className={`font-medium px-2 py-0.5 rounded text-xs ${
                                fetchProgress[index]?.status === 'success' ? 'bg-green-100 text-green-800' :
                                fetchProgress[index]?.status === 'error' ? 'bg-red-100 text-red-800' :
                                fetchProgress[index]?.status === 'processing' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                                'bg-gray-100 text-gray-600'
                            }`}>
                                {fetchProgress[index]?.message || 'Pending'}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        )}

        {/* Cron Job Info */}
        {/* <div className="mt-6 pt-4 border-t">
            <h3 className="text-lg font-semibold mb-2">Automated Fetch Schedule</h3>
            <p className="text-sm text-gray-700">
                The backend is scheduled to automatically fetch new articles approximately once per day.
                (UTC Time: 08:00)
            </p>
             <p className="mt-1 text-xs text-gray-500">
                Check the Vercel project settings for exact cron job status and history.
            </p>
        </div> */}

        {/* Placeholder for future actions */}
        <p className="text-gray-600 mt-6">
          Other admin actions (like category override) could go here...
        </p>
      </div>

      {/* AI Update Batch Processing */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl font-semibold mb-4">Batch AI Updates for Missing Images</h2>
        <p className="text-sm text-gray-600 mb-4">
          Targets stories in the database that are missing an AI-generated image. 
          For these stories, new AI summaries and images will be generated.
          Stories needing images are processed in batches, ordered by their internal ID for consistency.
          Use the 'Continue Token' if a previous batch was interrupted for manual processing.
        </p>
        
        <form onSubmit={handleBatchUpdate}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="batchSize" className="block text-sm font-medium text-gray-700 mb-1">
                Batch Size:
              </label>
              <input
                type="number"
                id="batchSize"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value))}
                min="1"
                max="20"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isBatchProcessing}
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: 2-3 stories per batch to avoid API rate limits</p>
            </div>
            
            <div>
              <label htmlFor="continueToken" className="block text-sm font-medium text-gray-700 mb-1">
                Continue Token:
              </label>
              <input
                type="text"
                id="continueToken"
                value={continueToken}
                onChange={(e) => setContinueToken(e.target.value)}
                placeholder="Leave empty to start from oldest stories"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isBatchProcessing}
              />
              <p className="text-xs text-gray-500 mt-1">Continue from where you left off</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={isBatchProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBatchProcessing ? 'Processing...' : 'Process Batch'}
            </button>
          </div>
        </form>
        
        {batchMessage && (
          <div className={`mt-4 p-3 rounded ${batchMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {batchMessage.text}
          </div>
        )}
        
        {batchResults.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium text-lg mb-2">Batch Results</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Story ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {batchResults.map((result, index) => (
                    <tr key={index} className={result.success ? '' : 'bg-red-50'}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{result.id}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {result.success ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Success
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {result.updates ? result.updates.join(', ') : result.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <p>To continue processing the next batch, click "Process Batch" again. The continue token has been set automatically.</p>
            </div>
          </div>
        )}
      </div>

      {/* Regenerate Image by ID Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl font-semibold mb-4">Regenerate Image by ID</h2>
        <form onSubmit={handleRegenerateImageById}>
          <label htmlFor="articleIdRegen" className="block text-sm font-medium text-gray-700 mb-1">
            Enter Article ID to Regenerate Image:
          </label>
          <div className="flex gap-2">
            <input
              type="text" 
              id="articleIdRegen"
              value={articleIdToRegenerate}
              onChange={(e) => setArticleIdToRegenerate(e.target.value)}
              placeholder="e.g., f7f73745-7447-45de-9a28-7aa1f50778b5"
              className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isRegeneratingImage}
            />
            <button
              type="submit"
              disabled={isRegeneratingImage}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegeneratingImage ? 'Regenerating...' : 'Regenerate Image'}
            </button>
          </div>
          {regenerateImageMessage && (
            <p className={`mt-3 text-sm ${regenerateImageMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
              {regenerateImageMessage.text}
            </p>
          )}
        </form>
        <p className="mt-3 text-xs text-gray-500">This will attempt to generate a new image for the specified article ID and update it in the database. The summary will not be affected.</p>
      </div>

      {/* --- ADDED: Post to X/Twitter Section --- */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl font-semibold mb-4">Post to X/Twitter</h2>
        <p className="text-sm text-gray-600 mb-4">
          Fetch the next stories recommended for posting based on the "Oldest-Newest-Oldest" strategy. You can edit the generated text before posting.
        </p>
        <div className="mb-4">
          <button
            onClick={handleFetchTweetCandidates}
            disabled={isFetchingCandidates}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {isFetchingCandidates ? 'Fetching...' : 'Fetch Tweet Candidates'}
          </button>
        </div>

        {tweetCandidateError && <p className="text-red-600 text-sm mb-4">{tweetCandidateError}</p>}
        {postSuccessMessage && <p className="text-green-600 text-sm mb-4">{postSuccessMessage}</p>}

        {tweetCandidates.length > 0 && (
          <div className="space-y-6">
            {tweetCandidates.map((candidate) => (
              <div key={candidate.id} className="border-t pt-4">
                <h3 className="font-semibold text-lg">{candidate.title}</h3>
                <p className="text-xs text-gray-500 mb-2">ID: {candidate.id}</p>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="md:w-1/4">
                    {candidate.ai_image_url && (
                      <img src={candidate.ai_image_url} alt="AI generated image" className="rounded-md shadow-md w-full" />
                    )}
                  </div>
                  <div className="md:w-3/4">
                    <textarea
                      value={candidate.generatedTweetText}
                      onChange={(e) => handleTweetTextChange(candidate.id, e.target.value)}
                      className="w-full h-36 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                      maxLength={280}
                    />
                    <p className="text-right text-sm text-gray-500">
                      {candidate.generatedTweetText?.length || 0}/280
                    </p>
                  </div>
                </div>
                <div className="text-right mt-2">
                  <button
                    onClick={() => handlePostTweet(candidate.id)}
                    disabled={isPosting !== null}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                  >
                    {isPosting === candidate.id ? 'Posting...' : 'Post This Tweet'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* --- END ADDED --- */}

      {/* Check Submitted Emails Section */}
      <div className="mb-8 p-6 bg-gray-800 rounded-lg shadow-xl">
        <h2 className="text-2xl font-semibold mb-4 text-sky-400">Check Submitted Emails</h2>
        <p className="mb-4 text-gray-400">
          Manually trigger the backend process to check for new emails sent to the submission address (e.g., submit@microplasticswatch.com) and process them.
        </p>
        <button
          onClick={handleCheckSubmittedEmails}
          disabled={isCheckingEmails}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 transition duration-150 ease-in-out"
        >
          {isCheckingEmails ? 'Checking Emails...' : 'Trigger Email Check'}
        </button>
        
        {/* --- Email Check Results Display --- */}
        {emailCheckResult && (
          <div className={`mt-4 p-4 rounded-lg ${emailCheckResult.error ? 'bg-red-900 border-red-700 text-red-100' : 'bg-green-900 border-green-700 text-green-100'} border`}>
              <p className="font-bold text-lg mb-2">{emailCheckResult.error ? 'Error' : 'Processing Report'}</p>
              <p className="mb-3">{emailCheckResult.error || emailCheckResult.message}</p>
              
              {!emailCheckResult.error && (
                  <div className="text-sm opacity-90">
                      <p><strong>Successfully Processed / Skipped:</strong> {emailCheckResult.processedCount}</p>
                      <p><strong>Failed:</strong> {emailCheckResult.failedCount}</p>
                  </div>
              )}

              {emailCheckResult.failedUrls.length > 0 && (
                  <div className="mt-3">
                      <p className="font-bold">Failed URLs:</p>
                      <ul className="list-disc list-inside bg-gray-800 p-2 rounded">
                          {emailCheckResult.failedUrls.map((url, index) => (
                              <li key={index} className="text-xs font-mono break-all">{url}</li>
                          ))}
                      </ul>
                  </div>
              )}
          </div>
        )}
        {/* --- End Email Check Results Display --- */}

      </div>

    </div>
  );
};

export default AdminPage; 