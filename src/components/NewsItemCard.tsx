import React from 'react';
import SocialShare from './SocialShare';
import fallbackPlaceholderImage from '../assets/fail whale elephant_404 overload.png';

// Types
interface NewsItem {
  id: string;
  title?: string | null;
  ai_summary?: string | null;
  ai_image_url?: string | null;
  url?: string | null;
  source?: string | null;
  processed_at: string;
  published_date?: string;
  created_at?: string;
}

interface NewsItemCardProps {
  item: NewsItem;
  isFeatured: boolean;
}

const NewsItemCard: React.FC<NewsItemCardProps> = ({ item, isFeatured }) => {
  const imageUrl = item.ai_image_url || fallbackPlaceholderImage;
  
  // Better date formatting (e.g., "31 August 2025")
  const displayDate = item.published_date ? new Date(item.published_date) : new Date(item.created_at || item.processed_at);
  const formattedDate = displayDate.toLocaleDateString('en-GB', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Extract domain from the actual article URL for cleaner source display
  const extractDomain = (url: unknown): string => {
    if (typeof url !== 'string') return '';
    try {
      const urlObj = new URL(url);
      let domain = urlObj.hostname;
      // Remove 'www.' prefix if present
      if (domain.startsWith('www.')) {
        domain = domain.substring(4);
      }
      return domain;
    } catch {
      // Fallback if URL parsing fails
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '');
    }
  };
  
  // Use the article URL (item.url) instead of the source field
  const cleanSource = item.url ? extractDomain(item.url) : null;
  
  // Remove HTML tags from title and summary
  const cleanText = (text: unknown): string => {
    if (typeof text !== 'string') return '';
    return text.replace(/<[^>]*>/g, '');
  };

  if (isFeatured) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col md:flex-row overflow-hidden mb-12">
        <div className="md:w-2/5 flex-shrink-0">
          <img 
            src={imageUrl}
            alt={cleanText(item.title) || 'News image'}
            className="w-full h-64 md:h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = fallbackPlaceholderImage; }} // Fallback for broken AI URL
          />
        </div>
        <div className="p-8 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">{formattedDate}</span>
            {cleanSource && <span className="text-xs text-gray-500">Source: {cleanSource}</span>}
          </div>
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-2xl md:text-3xl font-bold text-brand-darker mb-4 hover:text-brand-blue transition-colors duration-150 no-underline">
            {cleanText(item.title || 'No Title')}
          </a>
          <p className="text-brand-dark text-base mb-6 flex-grow">{cleanText(item.ai_summary || 'Summary unavailable.')}</p>
          <div className="mt-auto">
            <a href={item.url || '#'} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:text-sky-700 font-medium text-base no-underline self-start transition-colors duration-150 block mb-4">
              Read Full Article →
            </a>
            <SocialShare 
              title={cleanText(item.title || 'Microplastics Research')}
              url={item.url || undefined}
              summary={cleanText(item.ai_summary || '')}
              storyId={item.id}
              imageUrl={item.ai_image_url}
              size="medium"
              className="border-t border-gray-100 pt-4"
            />
          </div>
        </div>
      </div>
    );
  }

  // Secondary story card (non-featured)
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Mobile layout: Stack image and content vertically */}
      <div className="block sm:hidden">
        <img 
          src={imageUrl} 
          alt={cleanText(item.title) || 'News image'}
          className="w-full h-48 object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = fallbackPlaceholderImage; }}
        />
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">{formattedDate}</span>
            {cleanSource && <span className="text-xs text-gray-500 truncate max-w-[60%]">Source: {cleanSource}</span>}
          </div>
          <a href={item.url || '#'} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors duration-150 no-underline leading-tight block">
            {cleanText(item.title || 'No Title')}
          </a>
          <p className="text-gray-600 text-sm mb-4 break-words line-clamp-3">
            {cleanText(item.ai_summary || 'Summary unavailable.')}
          </p>
          <div className="flex items-center justify-between">
            <a href={item.url || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-medium text-sm no-underline transition-colors duration-150">
              Read Full Article →
            </a>
            <SocialShare 
              title={cleanText(item.title || 'Microplastics Research')}
              url={item.url || undefined}
              summary={cleanText(item.ai_summary || '')}
              storyId={item.id}
              imageUrl={item.ai_image_url}
              size="small"
            />
          </div>
        </div>
      </div>
      
      {/* Desktop layout: Side-by-side image and content */}
      <div className="hidden sm:block p-4 md:p-6 flow-root">
        <img 
          src={imageUrl} 
          alt={cleanText(item.title) || 'News image'}
          className="float-left w-36 h-36 object-cover mr-4 mb-2 rounded"
          onError={(e) => { (e.target as HTMLImageElement).src = fallbackPlaceholderImage; }}
        />
        <div className="flex flex-wrap items-center justify-between mb-1">
          <span className="text-xs text-gray-500">{formattedDate}</span>
          {cleanSource && <span className="text-xs text-gray-500 truncate max-w-[60%]">Source: {cleanSource}</span>}
        </div>
        <a href={item.url || '#'} target="_blank" rel="noopener noreferrer" className="text-md md:text-lg font-semibold text-brand-darker mb-2 hover:text-brand-blue transition-colors duration-150 no-underline leading-tight block">
          {cleanText(item.title || 'No Title')}
        </a>
        <p className="text-brand-dark text-sm mb-3 md:mb-4 break-words">
          {cleanText(item.ai_summary || 'Summary unavailable.')}
        </p>
        <div className="flex items-center justify-between">
          <a href={item.url || '#'} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:text-sky-700 font-medium text-sm no-underline transition-colors duration-150">
            Read Full Article →
          </a>
          <SocialShare 
            title={cleanText(item.title || 'Microplastics Research')}
            url={item.url || undefined}
            summary={cleanText(item.ai_summary || '')}
            storyId={item.id}
            imageUrl={item.ai_image_url}
            size="small"
          />
        </div>
      </div>
    </div>
  );
};

export default NewsItemCard;
