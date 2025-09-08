import React, { useState } from 'react';

interface BatchSummaryInterfaceProps {
  backendUrl: string;
}

interface BatchResult {
  id: string;
  success: boolean;
  message?: string;
  updates?: string[];
}

const BatchSummaryInterface: React.FC<BatchSummaryInterfaceProps> = ({ backendUrl }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinding, setIsFinding] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [continueToken, setContinueToken] = useState<string | null>(null);
  const [batchSize, setBatchSize] = useState(2);
  const [foundArticleIds, setFoundArticleIds] = useState<string[]>([]);

  const processBatch = async () => {
    setIsProcessing(true);
    setStatus('Starting batch summary generation...');
    setResults([]);

    try {
      const response = await fetch(`${backendUrl}/api/batch-generate-summaries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batch_size: batchSize,
          continue_token: continueToken
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process batch');
      }

      const data = await response.json();
      setStatus(data.message);
      setResults(data.results || []);
      setContinueToken(data.continue_token);
      
      if (data.done) {
        setStatus('✅ All articles processed!');
        setContinueToken(null);
      }

    } catch (error) {
      console.error('Error processing batch:', error);
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const findMissingSummaries = async () => {
    setIsFinding(true);
    setStatus('Searching for articles missing AI summaries...');
    setResults([]);
    setFoundArticleIds([]);

    try {
      const response = await fetch(`${backendUrl}/api/find-missing-summaries`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.articleIds && data.articleIds.length > 0) {
        setFoundArticleIds(data.articleIds);
        setStatus(`✅ Found ${data.articleIds.length} articles missing AI summaries. Click "Process Found Articles" to generate summaries.`);
      } else {
        setStatus('✅ No articles found missing AI summaries!');
      }

    } catch (error) {
      console.error('Error finding missing summaries:', error);
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsFinding(false);
    }
  };

  const processFoundArticles = async () => {
    if (foundArticleIds.length === 0) {
      setStatus('❌ No articles found to process. Please click "Find Missing Summaries" first.');
      return;
    }

    setIsProcessing(true);
    setStatus(`Processing ${foundArticleIds.length} found articles...`);
    setResults([]);

    try {
      const response = await fetch(`${backendUrl}/api/batch-generate-summaries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          article_ids: foundArticleIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process batch');
      }

      const data = await response.json();
      setStatus(data.message);
      setResults(data.results || []);
      
      if (data.done) {
        setStatus('✅ All found articles processed!');
        setFoundArticleIds([]);
      }

    } catch (error) {
      console.error('Error processing found articles:', error);
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetProcess = () => {
    setStatus(null);
    setResults([]);
    setContinueToken(null);
    setFoundArticleIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Batch Size
          </label>
          <select
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isProcessing}
          >
            <option value={1}>1 article</option>
            <option value={2}>2 articles (recommended)</option>
            <option value={3}>3 articles</option>
          </select>
        </div>

        <div className="flex items-end space-x-2">
          <button
            onClick={findMissingSummaries}
            disabled={isFinding || isProcessing}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isFinding ? (
              <>
                <div className="flex space-x-1 mr-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                Finding...
              </>
            ) : (
              'Find Missing Summaries'
            )}
          </button>

          <button
            onClick={processFoundArticles}
            disabled={isProcessing || foundArticleIds.length === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isProcessing ? (
              <>
                <div className="flex space-x-1 mr-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                Processing...
              </>
            ) : (
              `Process Found Articles (${foundArticleIds.length})`
            )}
          </button>

          <button
            onClick={processBatch}
            disabled={isProcessing || isFinding}
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isProcessing ? (
              <>
                <div className="flex space-x-1 mr-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                Processing...
              </>
            ) : (
              'Process All Missing'
            )}
          </button>

          <button
            onClick={resetProcess}
            disabled={isProcessing || isFinding}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Status */}
      {status && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">{status}</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Results:</h4>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-2 rounded text-xs ${
                  result.success 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-mono">{result.id.substring(0, 8)}...</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    result.success ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {result.success ? 'SUCCESS' : 'ERROR'}
                  </span>
                </div>
                {result.updates && (
                  <div className="mt-1 text-xs opacity-75">
                    Updated: {result.updates.join(', ')}
                  </div>
                )}
                {result.message && (
                  <div className="mt-1 text-xs opacity-75">
                    {result.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-500 space-y-1">
        <p><strong>Find Missing Summaries:</strong> Searches for articles missing AI summaries</p>
        <p><strong>Process Found Articles:</strong> Processes the articles found in the previous step</p>
        <p><strong>Process All Missing:</strong> Finds and processes all articles without summaries in batches</p>
        <p><strong>Batch Size:</strong> Number of articles to process at once (2 recommended to avoid rate limiting)</p>
        <p><strong>Note:</strong> Each article takes ~2 seconds to process due to API rate limiting</p>
      </div>
    </div>
  );
};

export default BatchSummaryInterface;
