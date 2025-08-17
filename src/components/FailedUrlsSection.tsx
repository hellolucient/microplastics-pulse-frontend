import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface FailedUrl {
  id: string;
  url: string;
  reason: string;
  subject: string;
  created_at: string;
  attempts: number;
}

const FailedUrlsSection: React.FC = () => {
  const [failedUrls, setFailedUrls] = useState<FailedUrl[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [isClearing, setIsClearing] = useState(false);

  const fetchFailedUrls = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get<{ failedUrls: FailedUrl[]; count: number }>(
        `${BACKEND_URL}/api/admin/failed-urls`
      );
      setFailedUrls(response.data.failedUrls);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch failed URLs');
      console.error('Error fetching failed URLs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFailedUrls();
  }, [fetchFailedUrls]);

  const handleSelectAll = () => {
    if (selectedUrls.length === failedUrls.length) {
      setSelectedUrls([]);
    } else {
      setSelectedUrls(failedUrls.map(url => url.url));
    }
  };

  const handleSelectUrl = (url: string) => {
    setSelectedUrls(prev =>
      prev.includes(url)
        ? prev.filter(u => u !== url)
        : [...prev, url]
    );
  };

  const handleClearSelected = async () => {
    if (selectedUrls.length === 0) return;

    setIsClearing(true);
    setError(null);
    try {
      await axios.post(`${BACKEND_URL}/api/admin/failed-urls/clear`, {
        urls: selectedUrls
      });
      await fetchFailedUrls(); // Refresh the list
      setSelectedUrls([]); // Clear selection
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to clear selected URLs');
      console.error('Error clearing URLs:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Failed Email URLs</h2>
        <div className="space-x-2">
          <button
            onClick={fetchFailedUrls}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
          >
            Refresh
          </button>
          <button
            onClick={handleClearSelected}
            disabled={selectedUrls.length === 0 || isClearing}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm disabled:bg-gray-300"
          >
            {isClearing ? 'Clearing...' : `Clear Selected (${selectedUrls.length})`}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {failedUrls.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No failed URLs found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedUrls.length === failedUrls.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Error
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attempts
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Failed At
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {failedUrls.map((failedUrl) => (
                <tr key={failedUrl.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUrls.includes(failedUrl.url)}
                      onChange={() => handleSelectUrl(failedUrl.url)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={failedUrl.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-900 break-all"
                    >
                      {failedUrl.url}
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900">{failedUrl.subject || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-red-600">{failedUrl.reason}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900">{failedUrl.attempts}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-500">{formatDate(failedUrl.created_at)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FailedUrlsSection;
