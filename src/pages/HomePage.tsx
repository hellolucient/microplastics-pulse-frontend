import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import whitepaperImage from '../assets/whitepaper-hero.png';  
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
  // --- State for Latest News --- 
  const [latestNews, setLatestNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  // --- End State ---

  // --- Effect to fetch latest news from API --- 
  useEffect(() => {
    // Create the whitepaper card immediately (static content)
    const whitepaperCard: NewsItem = {
      id: 'whitepaper',
      created_at: new Date().toISOString(),
      url: '/Understanding-the-Microplastics-Crisis_Framing-a-Wellness-Response.pdf',
      title: 'Download Our Comprehensive Whitepaper',
      source: 'MicroplasticsWatch Research',
      published_date: new Date(Date.now() - 86400000).toISOString(),
      ai_summary: 'Get your copy of "Understanding Microplastics Crisis : Framing a Wellness Response" to dive deeper into the research, impacts, and potential solutions. This comprehensive whitepaper covers the latest findings, policy implications, and actionable steps for addressing microplastic pollution.',
      ai_image_url: whitepaperImage
    };

    // Show whitepaper card immediately
    setLatestNews([whitepaperCard]);

    const fetchLatestNewsFromApi = async () => {
      setNewsLoading(true);
      try {
        const response = await axios.get(`${BACKEND_URL}/api/latest-news?page=1&limit=3`);
        if (response.data && typeof response.data === 'object' && 'data' in response.data) {
          // Take the first 3 items from the paginated response
          const apiNews = (response.data as { data: NewsItem[] }).data.slice(0, 3);
          const newsWithWhitepaper = [whitepaperCard, ...apiNews];
          setLatestNews(newsWithWhitepaper);
        } else {
          console.error('API Error: Expected paginated response with data property, but received:', response.data);
        }
      } catch (error: unknown) {
        console.error('Error fetching latest news for homepage:', error);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchLatestNewsFromApi();
  }, []);
  // --- End Effect ---


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