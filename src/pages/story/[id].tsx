import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import fallbackPlaceholderImage from '../../assets/fail whale elephant_404 overload.png';

const BACKEND_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface NewsItem {
  id: string | number;
  url: string;
  title: string;
  created_at: string;
  published_date: string | null;
  ai_summary: string | null;
  ai_image_url?: string | null;
  source?: string | null;
}

const StoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<NewsItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchStory = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await axios.get<NewsItem>(`${BACKEND_URL}/api/story/${id}`);
        setStory(response.data);
      } catch (error: any) {
        if (error.isAxiosError && error.response) {
          const errorMessage = error.response.data?.error || 'Failed to fetch story.';
          setErrorMessage(errorMessage);
        } else {
          setErrorMessage('An unexpected error occurred.');
        }
        console.error('Error fetching story:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStory();
  }, [id]);

  const imageUrl = story?.ai_image_url || fallbackPlaceholderImage;
  const displayDate = story?.published_date ? new Date(story.published_date) : (story?.created_at ? new Date(story.created_at) : new Date());
  const formattedDate = displayDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="mt-4">{errorMessage}</p>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Story not found</h1>
        <p className="mt-4">The story you are looking for does not exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <article>
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-brand-darker leading-tight mb-4">
            {story.title}
          </h1>
          <div className="text-md text-gray-500">
            <span>Published on {formattedDate}</span>
            {story.source && <span> &middot; Source: {story.source}</span>}
          </div>
        </header>

        <div className="mb-8">
          <img
            src={imageUrl}
            alt={story.title}
            className="w-full h-auto object-cover rounded-lg shadow-lg"
            onError={(e) => { (e.target as HTMLImageElement).src = fallbackPlaceholderImage; }}
          />
        </div>

        <div className="prose prose-lg max-w-none text-brand-dark">
          <p>{story.ai_summary}</p>
        </div>

        <footer className="mt-12 pt-8 border-t border-gray-200">
          <a
            href={story.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-brand-blue text-white font-bold py-3 px-6 rounded-lg hover:bg-sky-700 transition-colors duration-200"
          >
            Read Full Article
          </a>
        </footer>
      </article>
    </div>
  );
};

export default StoryPage; 