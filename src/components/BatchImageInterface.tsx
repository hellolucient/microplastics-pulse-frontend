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
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [results, setResults] = useState<BatchResult[]>([]);
  const [batchSize, setBatchSize] = useState(2);

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

  const processAllMissingImages = async () => {
    setIsProcessing(true);
    setStatusMessage('Starting complete image generation for all missing images...');
    setResults([]);

    let allResults: BatchResult[] = [];
    let continueToken = '';
    let totalProcessed = 0;
    let batchCount = 0;

    try {
      while (true) {
        batchCount++;
        setStatusMessage(`Processing batch ${batchCount}... (${totalProcessed} articles processed so far)`);

        const response = await fetch(`${backendUrl}/api/batch-generate-images`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            batch_size: batchSize,
            continue_token: continueToken || undefined,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Add results to our collection
        allResults = [...allResults, ...data.results];
        totalProcessed += data.results.length;
        
        // Update continue token for next batch
        continueToken = data.continue_token || '';

        // Check if we're done
        if (data.done || data.results.length === 0) {
          setStatusMessage(`✅ Complete! Processed ${totalProcessed} articles across ${batchCount} batches. All articles now have images.`);
          break;
        }

        // Small delay between batches to be nice to the API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setResults(allResults);

    } catch (error) {
      console.error('Error processing all images:', error);
      setStatusMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}. Processed ${totalProcessed} articles before error.`);
      setResults(allResults); // Show what we did process
    } finally {
      setIsProcessing(false);
    }
  };

  const resetProcess = () => {
    setResults([]);
    setStatusMessage('');
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
            onClick={processBatch}
            disabled={isProcessing}
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
            onClick={processAllMissingImages}
            disabled={isProcessing}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isProcessing ? (
              <>
                <div className="flex space-x-1 mr-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                Processing All...
              </>
            ) : (
              'Process All Missing Images'
            )}
          </button>
          <button
            onClick={resetProcess}
            disabled={isProcessing}
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
        <p><strong>Process Missing Images:</strong> Processes only the specified batch size (1-3 articles) and stops</p>
        <p><strong>Process All Missing Images:</strong> Continues processing until ALL articles have images (processes in batches automatically)</p>
        <p><strong>Batch Size:</strong> Number of articles to process per batch (2 recommended to avoid rate limiting)</p>
        <p><strong>Note:</strong> Each image takes ~3 seconds to generate due to API rate limiting</p>
      </div>
    </div>
  );
};

export default BatchImageInterface;
