import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';

const AdminPage = () => {
  const [url, setUrl] = useState('');
  const [batchSize, setBatchSize] = useState(2);
  const [continueToken, setContinueToken] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  
  const handleAddUrl = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');
    setResults([]);
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/add-news`, { url });
      setMessage(`Success: Article processed - ${response.data.message}`);
    } catch (err) {
      console.error('Error adding URL:', err);
      setError(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBatchUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');
    setResults([]);
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/batch-update-stories`, {
        batch_size: parseInt(batchSize),
        continue_token: continueToken || undefined
      });
      
      setMessage(`Success: ${response.data.message}`);
      setResults(response.data.results || []);
      
      if (response.data.continue_token) {
        setContinueToken(response.data.continue_token);
      }
      
      if (response.data.done) {
        setMessage(prev => `${prev} - All stories processed!`);
      }
    } catch (err) {
      console.error('Error running batch update:', err);
      setError(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Tools</h1>
      
      <div className="mb-8 p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Add Single URL</h2>
        <form onSubmit={handleAddUrl} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
              Article URL
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isLoading ? 'Processing...' : 'Add URL'}
          </button>
        </form>
      </div>
      
      <div className="mb-8 p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Batch Update Stories</h2>
        <p className="text-sm text-gray-600 mb-4">
          Refresh all stories in the database with improved AI summaries and images.
          Stories are processed from oldest to newest to ensure the entire collection 
          gets updated with the latest AI generation techniques.
        </p>
        <form onSubmit={handleBatchUpdate} className="space-y-4">
          <div>
            <label htmlFor="batchSize" className="block text-sm font-medium text-gray-700 mb-1">
              Batch Size
            </label>
            <input
              type="number"
              id="batchSize"
              value={batchSize}
              onChange={(e) => setBatchSize(e.target.value)}
              min="1"
              max="50"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">Recommended: 2-3 stories per batch to avoid API rate limits</p>
          </div>
          <div>
            <label htmlFor="continueToken" className="block text-sm font-medium text-gray-700 mb-1">
              Continue Token (Optional)
            </label>
            <input
              type="text"
              id="continueToken"
              value={continueToken}
              onChange={(e) => setContinueToken(e.target.value)}
              placeholder="Leave empty to start from oldest stories"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">Continue from where you left off</p>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400"
          >
            {isLoading ? 'Processing...' : 'Run Batch Update'}
          </button>
        </form>
      </div>
      
      {message && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-md">
          {message}
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}
      
      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Results</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {result.updates ? result.updates.join(', ') : result.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              To continue processing, click the "Run Batch Update" button again. The continue token has been automatically set.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage; 