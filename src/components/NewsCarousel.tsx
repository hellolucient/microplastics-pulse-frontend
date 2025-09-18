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
  isLoading?: boolean;
}

const NewsCarousel: React.FC<NewsCarouselProps> = ({ 
  news, 
  autoPlayInterval = 5000,
  isLoading = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const currentNews = news[currentIndex] || news[0];

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || isShareModalOpen) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % news.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [currentIndex, isAutoPlaying, autoPlayInterval, news.length, isShareModalOpen]);

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
        pdfUrl = `${window.location.origin}/Understanding-the-Microplastics-Crisis_Framing-a-Wellness-Response.pdf`;
      } else {
        // For news articles, use the article URL
        pdfUrl = currentNews.url.startsWith('http') 
          ? currentNews.url 
          : `${window.location.origin}${currentNews.url}`;
      }
      
      
      if (isWhitepaper) {
        // Download the PDF file
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = 'Understanding-the-Microplastics-Crisis_Framing-a-Wellness-Response.pdf';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        
        // Show success message to user
        const successMessage = document.createElement('div');
        successMessage.innerHTML = `
          <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 500;
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
          ">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">🎉</span>
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Download Started!</div>
                <div style="font-size: 12px; opacity: 0.9;">Check your downloads folder</div>
              </div>
            </div>
          </div>
          <style>
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          </style>
        `;
        document.body.appendChild(successMessage);
        
        // Remove the message after 4 seconds
        setTimeout(() => {
          if (successMessage.parentNode) {
            successMessage.parentNode.removeChild(successMessage);
          }
        }, 4000);
      } else {
        // Open news article in new tab
        window.open(pdfUrl, '_blank');
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

  // Skeleton loading component
  const SkeletonCard = () => (
    <div className="relative rounded-2xl shadow-xl overflow-hidden max-w-6xl mx-auto bg-white animate-pulse">
      <div className="grid md:grid-cols-2 gap-0">
        {/* Image skeleton */}
        <div className="relative h-64 md:h-auto bg-gray-200">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300"></div>
        </div>
        
        {/* Content skeleton */}
        <div className="p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
          </div>
          
          <div className="h-8 w-3/4 bg-gray-200 rounded mb-4"></div>
          
          <div className="space-y-2 mb-6">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
          
          <div className="h-12 w-48 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div 
        className={`relative rounded-2xl shadow-xl overflow-hidden max-w-6xl mx-auto ${
          isWhitepaper 
            ? 'bg-white cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]' 
            : 'bg-white'
        }`}
        onClick={isWhitepaper ? handleWhitepaperDownload : undefined}
      >
        {/* Navigation Arrows */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPrevious();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border-2 border-gray-200 rounded-full p-3 shadow-xl hover:border-brand-blue hover:bg-brand-blue hover:text-white transition-all duration-200"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border-2 border-gray-200 rounded-full p-3 shadow-xl hover:border-brand-blue hover:bg-brand-blue hover:text-white transition-all duration-200"
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image Section */}
          <div className="relative h-full overflow-hidden">
            {isWhitepaper ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <img
                  src={currentNews.ai_image_url || fallbackPlaceholderImage}
                  alt={currentNews.title}
                  className="w-3/4 h-3/4 object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = fallbackPlaceholderImage;
                  }}
                />
              </div>
            ) : (
              <img
                src={currentNews.ai_image_url || fallbackPlaceholderImage}
                alt={currentNews.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = fallbackPlaceholderImage;
                }}
              />
            )}
          </div>

          {/* Content Section */}
          <div className="p-6 flex flex-col justify-center">
            {/* Source and Date */}
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                isWhitepaper 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
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
              <span className="text-sm font-medium text-gray-500">
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWhitepaperDownload();
                  }}
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
                onModalStateChange={setIsShareModalOpen}
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
              Enter your email to download "Understanding the Microplastics Crisis: Framing a Wellness Response" and stay updated with our latest research.
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
