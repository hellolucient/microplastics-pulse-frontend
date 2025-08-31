import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, DownloadCloud, X } from 'lucide-react';
import SocialShare from './SocialShare';
import fallbackPlaceholderImage from '../assets/fail whale elephant_404 overload.png';

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

interface NewsCarouselProps {
  news: NewsItem[];
  autoPlayInterval?: number;
}

const NewsCarousel: React.FC<NewsCarouselProps> = ({ 
  news, 
  autoPlayInterval = 5000 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const currentNews = news[currentIndex] || news[0];

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % news.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [currentIndex, isAutoPlaying, autoPlayInterval, news.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 3000); // Resume auto-play after 3 seconds
  };

  const goToPrevious = () => {
    goToSlide((currentIndex - 1 + news.length) % news.length);
  };

  const goToNext = () => {
    goToSlide((currentIndex + 1) % news.length);
  };

  const handleWhitepaperDownload = () => {
    setShowEmailModal(true);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsDownloading(true);
    
    // Get the backend URL from environment or use localhost for development
    const backendUrl = import.meta.env.DEV ? 'http://localhost:3001' : '';
    
    try {
      // First, collect the email via API - this is mandatory
      console.log('Collecting email before download...');
      
      const response = await fetch(`${backendUrl}/api/collect-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          source: 'whitepaper_download'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Email collection failed:', errorData);
        throw new Error(`Email collection failed: ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('Email collected successfully:', result);
      
      // Only proceed with download after email is collected
      let pdfUrl;
      if (isWhitepaper) {
        // For whitepaper, use the actual PDF file path
        pdfUrl = `${window.location.origin}/Microplastics - the Elephant in the Wellness Room.pdf`;
      } else {
        // For news articles, use the article URL
        pdfUrl = currentNews.url.startsWith('http') 
          ? currentNews.url 
          : `${window.location.origin}${currentNews.url}`;
      }
      
      console.log('Email collected, now downloading PDF from:', pdfUrl);
      
      if (isWhitepaper) {
        // Download the PDF file
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = 'Microplastics - the Elephant in the Wellness Room.pdf';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('PDF download initiated successfully');
      } else {
        // Open news article in new tab
        window.open(pdfUrl, '_blank');
        console.log('News article opened in new tab');
      }
      
      // Close modal and reset
      setShowEmailModal(false);
      setEmail('');
      setIsDownloading(false);
      
    } catch (error) {
      console.error('Process failed:', error);
      setIsDownloading(false);
      
      // Show error to user
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Download failed: ${errorMessage}. Please try again.`);
    }
  };

  if (!currentNews) return null;

  const isWhitepaper = currentNews.id === 'whitepaper';

  return (
    <>
      <div className={`relative rounded-2xl shadow-xl overflow-hidden max-w-6xl mx-auto ${
        isWhitepaper 
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200' 
          : 'bg-white'
      }`}>
        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border-2 border-gray-200 rounded-full p-3 shadow-xl hover:border-brand-blue hover:bg-brand-blue hover:text-white transition-all duration-200"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border-2 border-gray-200 rounded-full p-3 shadow-xl hover:border-brand-blue hover:bg-brand-blue hover:text-white transition-all duration-200"
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image Section */}
          <div className="relative h-full overflow-hidden">
            <img
              src={currentNews.ai_image_url || fallbackPlaceholderImage}
              alt={currentNews.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = fallbackPlaceholderImage;
              }}
            />
            {isWhitepaper && (
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 to-emerald-600/30 flex items-center justify-center">
                <div className="bg-white/95 backdrop-blur-sm rounded-full p-5 shadow-2xl border-2 border-green-300">
                  <DownloadCloud size={52} className="text-green-600" />
                </div>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className={`p-6 flex flex-col justify-center ${
            isWhitepaper ? 'bg-gradient-to-br from-green-50 to-emerald-50' : ''
          }`}>
            {/* Source and Date */}
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                isWhitepaper 
                  ? 'bg-green-500 text-white shadow-lg' 
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
                {isWhitepaper ? '📚 Premium Research' : (() => {
                  // Extract domain from the actual article URL for cleaner source display
                  if (!currentNews.url) return 'Unknown Source';
                  try {
                    const urlObj = new URL(currentNews.url);
                    let domain = urlObj.hostname;
                    if (domain.startsWith('www.')) {
                      domain = domain.substring(4);
                    }
                    return domain;
                  } catch {
                    return currentNews.url.replace(/^https?:\/\//, '').replace(/^www\./, '');
                  }
                })()}
              </span>
              <span className={`text-sm font-medium ${
                isWhitepaper ? 'text-green-700' : 'text-gray-500'
              }`}>
                {isWhitepaper ? 'Free Download' : (() => {
                  try {
                    if (currentNews.published_date) {
                      const date = new Date(currentNews.published_date);
                      if (!isNaN(date.getTime())) {
                        return date.toLocaleDateString('en-GB', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        });
                      }
                    }
                    // Fallback to created_at if published_date is invalid
                    if (currentNews.created_at) {
                      const date = new Date(currentNews.created_at);
                      if (!isNaN(date.getTime())) {
                        return date.toLocaleDateString('en-GB', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        });
                      }
                    }
                    return 'Recent';
                  } catch (error) {
                    return 'Recent';
                  }
                })()}
              </span>
            </div>

            {/* Title */}
            <h2 className={`font-bold mb-4 ${
              isWhitepaper ? 'text-2xl text-green-800' : 'text-lg text-gray-900'
            }`}>
              {currentNews.title?.replace(/<[^>]*>/g, '') || 'No Title'}
            </h2>

            {/* Summary */}
            <p className={`mb-6 leading-relaxed text-sm ${
              isWhitepaper ? 'text-green-700' : 'text-gray-600'
            }`}>
              {currentNews.ai_summary?.replace(/<[^>]*>/g, '') || 'Summary unavailable.'}
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              {isWhitepaper ? (
                <button
                  onClick={handleWhitepaperDownload}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-full hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <DownloadCloud size={18} />
                  Download Free Whitepaper
                </button>
              ) : (
                <a
                  href={currentNews.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-blue text-white font-semibold rounded-full hover:bg-sky-700 transition-colors duration-200 no-underline"
                >
                  Read Full Article
                  <ExternalLink size={16} />
                </a>
              )}
              
              <SocialShare
                title={currentNews.title?.replace(/<[^>]*>/g, '') || 'Microplastics Research'}
                url={currentNews.url}
                summary={currentNews.ai_summary?.replace(/<[^>]*>/g, '') || ''}
                storyId={currentNews.id}
                imageUrl={currentNews.ai_image_url}
                size="small"
                className="border-t border-gray-100 pt-3"
              />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <div
            className="h-full bg-brand-blue transition-all duration-300 ease-out"
            style={{ width: `${((currentIndex + 1) / news.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Dot Indicators */}
      <div className="flex justify-center space-x-2 mt-4">
        {news.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
              index === currentIndex
                ? isWhitepaper ? 'bg-green-500 scale-125' : 'bg-brand-blue scale-125'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Email Collection Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Download Your Whitepaper</h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">
              Enter your email to download "Microplastics - the Elephant in the Wellness Room" and stay updated with our latest research.
            </p>
            
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                />
              </div>
              
              <button
                type="submit"
                disabled={isDownloading || !email.trim()}
                className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isDownloading ? 'Downloading...' : 'Download Whitepaper'}
              </button>
            </form>
            
            <p className="text-xs text-gray-500 mt-4 text-center">
              We respect your privacy. Your email will only be used to send you research updates.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default NewsCarousel;
