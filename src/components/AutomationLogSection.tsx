import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface AutomationLog {
  id: number;
  created_at: string;
  status: 'SUCCESS' | 'FAILURE';
  details: {
    google_fetch: { status: string; details: string; articles_added: number };
    email_check: { status: string; details: string };
    tweet_post: { status: string; details: string };
  };
}

const AutomationLogSection: React.FC = () => {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get<AutomationLog[]>(`${BACKEND_URL}/api/admin/automation-logs`);
      setLogs(response.data);
    } catch (err) {
      setError('Failed to fetch automation logs. Please check the backend connection.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const renderStatus = (status: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-semibold rounded-full';
    switch (status) {
      case 'SUCCESS':
        return <span className={`${baseClasses} bg-green-200 text-green-800`}>Success</span>;
      case 'SKIPPED':
        return <span className={`${baseClasses} bg-yellow-200 text-yellow-800`}>Skipped</span>;
      case 'FAILURE':
        return <span className={`${baseClasses} bg-red-200 text-red-800`}>Failure</span>;
      default:
        return <span className={`${baseClasses} bg-gray-200 text-gray-800`}>Unknown</span>;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Automation Task Logs</h2>
        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-blue-300"
        >
          {isLoading ? 'Refreshing...' : 'Refresh Logs'}
        </button>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase border-b">Timestamp (UTC)</th>
              <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase border-b">Overall Status</th>
              <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase border-b">Task Details</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {logs.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={3} className="text-center py-4">No logs found.</td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{new Date(log.created_at).toLocaleString('en-GB', { timeZone: 'UTC' })}</td>
                  <td className="py-3 px-4">{renderStatus(log.status)}</td>
                  <td className="py-3 px-4">
                    <ul className="space-y-2">
                      <li>
                        <strong>Google Fetch:</strong> {renderStatus(log.details.google_fetch.status)} - Added: {log.details.google_fetch.articles_added} articles.
                        <p className="text-xs text-gray-500 pl-2">{log.details.google_fetch.details}</p>
                      </li>
                      <li>
                        <strong>Email Check:</strong> {renderStatus(log.details.email_check.status)}
                        <p className="text-xs text-gray-500 pl-2">{log.details.email_check.details}</p>
                      </li>
                      <li>
                        <strong>Tweet Post:</strong> {renderStatus(log.details.tweet_post.status)}
                        <p className="text-xs text-gray-500 pl-2">{log.details.tweet_post.details}</p>
                      </li>
                    </ul>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {isLoading && <p className="text-center py-4">Loading logs...</p>}
      </div>
    </div>
  );
};

export default AutomationLogSection; 