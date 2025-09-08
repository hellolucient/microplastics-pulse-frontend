import React, { useState } from 'react';

interface BatchImageInterfaceProps {
  backendUrl: string;
}

interface BatchResult {
  id: string;
  success: boolean;
  message?: string;
  updates?: string[];
}

const BatchImageInterface: React.FC<BatchImageInterfaceProps> = ({ backendUrl }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinding, setIsFinding] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [results, setResults] = useState<BatchResult[]>([]);
  const [batchSize, setBatchSize] = useState(2);
  const [foundArticleIds, setFoundArticleIds] = useState<string[]>([]);

  const processBatch = async () => {
    setIsProcessing(true);
    setStatusMessage(`Starting batch image generation (${batchSize} articles)...`);
    setResults([]);

    try {
      const response = await fetch(`${backendUrl}/api/batch-generate-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batch_size: batchSize,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.done) {
        setStatusMessage('✅ All articles processed! No more articles need images.');
      } else {
        setStatusMessage(`✅ Processed ${data.results.length} articles in this batch. ${data.message}`);
      }
      
      setResults(data.results);

    } catch (error) {
      console.error('Error processing batch:', error);
      setStatusMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };


  const findMissingImages = async () => {
    setIsFinding(true);
    setStatusMessage('Searching for articles missing AI images...');
    setResults([]);
    setFoundArticleIds([]);

    try {
      const response = await fetch(`${backendUrl}/api/find-missing-images`, {
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
        setStatusMessage(`✅ Found ${data.articleIds.length} articles missing AI images. Click "Process Found Articles" to generate images.`);
      } else {
        setStatusMessage('✅ No articles found missing AI images!');
      }

    } catch (error) {
      console.error('Error finding missing images:', error);
      setStatusMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsFinding(false);
    }
  };

  const processFoundImages = async () => {
    if (foundArticleIds.length === 0) {
      setStatusMessage('❌ No articles found to process. Please click "Find Missing Images" first.');
      return;
    }

    setIsProcessing(true);
    setStatusMessage(`Processing ${foundArticleIds.length} found articles...`);
    setResults([]);

    try {
      const response = await fetch(`${backendUrl}/api/batch-generate-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          article_ids: foundArticleIds,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.done) {
        setStatusMessage('✅ All found articles processed!');
        setFoundArticleIds([]);
      } else {
        setStatusMessage(`✅ Processed ${data.results.length} articles. ${data.message}`);
      }
      
      setResults(data.results);

    } catch (error) {
      console.error('Error processing found images:', error);
      setStatusMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetProcess = () => {
    setResults([]);
    setStatusMessage('');
    setFoundArticleIds([]);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Batch Size
          </label>
          <select
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isProcessing}
          >
            <option value={1}>1 article</option>
            <option value={2}>2 articles (recommended)</option>
            <option value={3}>3 articles</option>
          </select>
        </div>
        <div className="flex items-end space-x-2">
          <button
            onClick={findMissingImages}
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
              'Find Missing Images'
            )}
          </button>

          <button
            onClick={processFoundImages}
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
              'Process Missing Images'
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

      {statusMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">{statusMessage}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Results:</h4>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-2 rounded text-xs ${
                  result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs break-all">{result.id}</span>
                  <span className={`px-2 py-1 rounded text-xs ml-2 flex-shrink-0 ${
                    result.success ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {result.success ? 'SUCCESS' : 'ERROR'}
                  </span>
                </div>
                {result.success && result.updates && (
                  <div className="mt-1 text-xs opacity-75">
                    Updated: {result.updates.join(', ')}
                  </div>
                )}
                {!result.success && result.message && (
                  <div className="mt-1 text-xs opacity-75">
                    Error: {result.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p><strong>Find Missing Images:</strong> Searches for articles missing AI images</p>
        <p><strong>Process Found Articles:</strong> Processes the articles found in the previous step</p>
        <p><strong>Process Missing Images:</strong> Processes only the specified batch size (1-3 articles) and stops</p>
        <p><strong>Batch Size:</strong> Number of articles to process per batch (2 recommended to avoid rate limiting)</p>
        <p><strong>Note:</strong> Each image takes ~3 seconds to generate due to API rate limiting</p>
      </div>
    </div>
  );
};

export default BatchImageInterface;
