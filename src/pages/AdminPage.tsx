import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Import useAuth to access user info and signOut

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001'; // Fallback for safety

const AdminPage: React.FC = () => {
  const { user, signOut } = useAuth();
  // --- State for Manual Submission Form ---
  const [submitUrl, setSubmitUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  // --- End State ---

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

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Other Admin Actions</h2>
        <p className="text-gray-600">
          Manual fetch trigger button, category override management, etc., could go here...
        </p>
         {/* TODO: Add manual fetch trigger button */}
      </div>

    </div>
  );
};

export default AdminPage; 