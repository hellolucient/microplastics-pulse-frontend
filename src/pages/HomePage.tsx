import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { FileText, DownloadCloud, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
// import WhitepaperSection from '../components/WhitepaperSection'; // Remove unused import
import axios from 'axios'; // <-- Add axios
import mascotImage from '../assets/mascot-elephant.png'; // <-- Import the image
import fallbackPlaceholderImage from '../assets/fail whale elephant_404 overload.png'; // Import the placeholder
import whitepaperImage from '../assets/whitepaper-hero.png'; // Import the whitepaper image
import SocialShare from '../components/SocialShare';
import NewsCarousel from '../components/NewsCarousel';

// Updated NewsItem interface
interface NewsItem {
  id: string;
  created_at: string;
  url: string;
  title: string;
  source: string;
  published_date: string; 
  ai_summary: string;
  ai_image_url: string;
}

// --- Add Backend URL --- 
const BACKEND_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';
// --- End Backend URL ---

// Removed unused PLACEHOLDER_IMAGE constant



const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  // --- State for Latest News --- 
  const [latestNews, setLatestNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  // --- End State ---

  // --- State for Whitepaper Download ---
  const [whitepaperEmail, setWhitepaperEmail] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [showDownloadLink, setShowDownloadLink] = useState(false);
  const whitepaperUrl = "/Microplastics - the Elephant in the Wellness Room.pdf";
  // --- End Whitepaper State ---

  // --- Effect to fetch latest news from API --- 
  useEffect(() => {
    // Create the whitepaper card immediately (static content)
    const whitepaperCard: NewsItem = {
      id: 'whitepaper',
      created_at: new Date().toISOString(),
      url: '/Microplastics - the Elephant in the Wellness Room.pdf',
      title: 'Download Our Comprehensive Whitepaper',
      source: 'MicroplasticsWatch Research',
      published_date: new Date(Date.now() - 86400000).toISOString(),
      ai_summary: 'Get your copy of "Microplastics - the Elephant in the Wellness Room" to dive deeper into the research, impacts, and potential solutions. This comprehensive whitepaper covers the latest findings, policy implications, and actionable steps for addressing microplastic pollution.',
      ai_image_url: whitepaperImage
    };

    // Show whitepaper card immediately
    setLatestNews([whitepaperCard]);

    const fetchLatestNewsFromApi = async () => {
      setNewsLoading(true);
      setNewsError(null);
      try {
        const response = await axios.get<NewsItem[]>(`${BACKEND_URL}/api/latest-news`);
        if (Array.isArray(response.data)) {
          // Take only the first 3 items returned by the API
          const apiNews = response.data.slice(0, 3);
          const newsWithWhitepaper = [whitepaperCard, ...apiNews];
          setLatestNews(newsWithWhitepaper);
        } else {
          console.error('API Error: Expected an array of news items, but received:', response.data);
          setNewsError('Failed to load news: The server returned an unexpected response.');
        }
      } catch (error: unknown) {
        console.error('Error fetching latest news for homepage:', error);
        setNewsError('Failed to load news from the server.');
      } finally {
        setNewsLoading(false);
      }
    };

    fetchLatestNewsFromApi();
  }, []);
  // --- End Effect ---

  // --- Whitepaper Email Submission Handler ---
  const handleWhitepaperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (!whitepaperEmail || !/\S+@\S+\.\S+/.test(whitepaperEmail)) {
      setSubmissionError('Please enter a valid email address.');
      return;
    }

    setIsSubmittingEmail(true);
    try {
      const response = await axios.post<{ message?: string; error?: string }>(`${BACKEND_URL}/api/collect-email`, { 
        email: whitepaperEmail,
        source: 'whitepaper_download'
      });
      if (response.status === 200 || response.status === 201) {
        setShowDownloadLink(true);
        setWhitepaperEmail(''); // Clear email field
      } else {
        setSubmissionError(response.data.message || response.data.error || 'An unexpected error occurred.');
      }
    } catch (error: any) {
      console.error('Error submitting email for whitepaper:', error);
      if (error.response && error.response.data && (error.response.data.error || error.response.data.message) ) {
        setSubmissionError(error.response.data.error || error.response.data.message);
      } else if (error.message) {
        setSubmissionError(error.message);
      } else {
        setSubmissionError('Failed to submit email. Please try again.');
      }
    } finally {
      setIsSubmittingEmail(false);
    }
  };
  // --- End Whitepaper Email Submission Handler ---

  return (
    <>
      <Helmet>
        <title>MicroplasticsWatch - Latest Research & News</title>
        <meta name="description" content="Stay informed with the latest microplastics research, news, and insights. Your dedicated source for timely updates on this critical environmental and health issue." />
        <meta property="og:title" content="MicroplasticsWatch - Latest Research & News" />
        <meta property="og:description" content="Stay informed with the latest microplastics research, news, and insights." />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="MicroplasticsWatch" />
      </Helmet>
      
      <div className="bg-brand-light">
      {/* News Carousel - Now the main hero section */}
      <section className="py-8 pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h1 className="text-xl md:text-2xl font-light text-gray-500 tracking-wide">
              Latest News
            </h1>
          </div>
          <NewsCarousel 
            news={latestNews}
            isLoading={newsLoading}
          />
        </div>
      </section>

      {/* Mission Statement Section */}
      <section className="bg-white py-6 md:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-lg md:text-xl font-bold tracking-tight mb-3 text-brand-darker">
              Our Mission
            </h2>
            <p className="text-base text-brand-dark max-w-3xl mx-auto leading-relaxed">
              Our mission is to provide timely updates and comprehensive information to help you stay informed about this critical environmental and health issue. With new research emerging daily, we're committed to keeping you updated on the latest discoveries, policy changes, and solutions in the fight against microplastic pollution.
            </p>
          </div>
        </div>
      </section>
    </div>
    </>
  );
};

export default HomePage; 