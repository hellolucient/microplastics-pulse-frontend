import React from 'react';
import { Share2, Twitter, Facebook, Linkedin } from 'lucide-react';

interface SocialShareProps {
  title: string;
  url: string;
  summary?: string | null;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  storyId?: string | number; // Add storyId to generate your site's URL
}

const SocialShare: React.FC<SocialShareProps> = ({ 
  title, 
  url, 
  summary, 
  className = '', 
  size = 'medium',
  storyId 
}) => {
  // Generate your site's story URL if storyId is provided, otherwise use the original URL
  // This ensures social shares point to YOUR site first, not the source
  const shareUrl = storyId ? `${window.location.origin}/story/${storyId}` : url;
  const shareToTwitter = () => {
    // Twitter accepts pre-filled content directly (title, hashtags, URL)
    // This is why Twitter works - no crawling needed!
    const text = `${title} - Important microplastics research`;
    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}&hashtags=microplastics,health,environment`;
    window.open(twitterShareUrl, '_blank', 'width=550,height=420');
  };

  const shareToFacebook = () => {
    // Generate a professional Facebook post
    const cleanTitle = title.replace(/<[^>]*>/g, '');
    const cleanSummary = (summary || title).replace(/<[^>]*>/g, '');
    const facebookPost = `📰 Important Research Update:\n\n${cleanTitle}\n\n${cleanSummary}\n\nThis is exactly the kind of research we need to be sharing and discussing. The findings are concerning but also highlight why platforms like MicroplasticsWatch are so important.\n\nWhat are your thoughts on this research? Share below!\n\n#microplastics #health #environment #research\n\nRead more: ${shareUrl}`;
    
    // Show our alert first, then open Facebook popup
    alert(`Facebook Post Ready to Copy:\n\n${facebookPost}\n\nClick OK, then the Facebook popup will open. Copy this post and paste it into Facebook!`);
    
    // Open Facebook share popup after alert
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookShareUrl, '_blank', 'width=580,height=296');
  };

  const shareToLinkedIn = () => {
    // Generate a professional LinkedIn post
    const cleanTitle = title.replace(/<[^>]*>/g, '');
    const cleanSummary = (summary || title).replace(/<[^>]*>/g, '');
    const linkedinPost = `🔬 New Research Alert: ${cleanTitle}\n\n${cleanSummary}\n\nThis study highlights the critical impact of microplastics on our health and environment. As researchers continue to uncover the extent of this crisis, it's crucial we stay informed and take action.\n\n#microplastics #health #environment #research\n\nRead the full article: ${shareUrl}`;
    
    // Show our alert first, then open LinkedIn popup
    alert(`LinkedIn Post Ready to Copy:\n\n${linkedinPost}\n\nClick OK, then the LinkedIn popup will open. Copy this post and paste it into LinkedIn!`);
    
    // Open LinkedIn share popup after alert
    const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(cleanTitle)}&summary=${encodeURIComponent(cleanSummary)}`;
    window.open(linkedinShareUrl, '_blank', 'width=520,height=570');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      // Simple feedback - you could enhance this with a toast notification later
      const button = document.activeElement as HTMLButtonElement;
      const originalText = button.innerHTML;
      button.innerHTML = '✓ Copied!';
      button.classList.add('text-green-600');
      setTimeout(() => {
        button.innerHTML = originalText;
        button.classList.remove('text-green-600');
      }, 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  // Size configurations
  const sizeConfig = {
    small: {
      iconSize: 'h-4 w-4',
      buttonPadding: 'p-1.5',
      textSize: 'text-xs',
      gap: 'gap-1'
    },
    medium: {
      iconSize: 'h-5 w-5',
      buttonPadding: 'p-2',
      textSize: 'text-sm',
      gap: 'gap-2'
    },
    large: {
      iconSize: 'h-6 w-6',
      buttonPadding: 'p-3',
      textSize: 'text-base',
      gap: 'gap-3'
    }
  };

  const config = sizeConfig[size];

  return (
    <div className={`flex items-center ${config.gap} ${className}`}>
      <span className={`text-gray-600 font-medium ${config.textSize} flex items-center ${config.gap}`}>
        <Share2 className={`${config.iconSize} text-gray-500`} />
        Share:
      </span>
      
      <button
        onClick={shareToTwitter}
        className={`${config.buttonPadding} rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300`}
        title="Share on Twitter"
        aria-label="Share on Twitter"
      >
        <Twitter className={config.iconSize} />
      </button>

      <button
        onClick={shareToFacebook}
        className={`${config.buttonPadding} rounded-full bg-blue-50 text-blue-800 hover:bg-blue-100 hover:text-blue-900 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300`}
        title="Share on Facebook"
        aria-label="Share on Facebook"
      >
        <Facebook className={config.iconSize} />
      </button>

      <button
        onClick={shareToLinkedIn}
        className={`${config.buttonPadding} rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300`}
        title="Share on LinkedIn"
        aria-label="Share on LinkedIn"
      >
        <Linkedin className={config.iconSize} />
      </button>

      <button
        onClick={copyToClipboard}
        className={`${config.buttonPadding} rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-300 ${config.textSize} font-medium`}
        title="Copy link"
        aria-label="Copy link to clipboard"
      >
        Copy Link
      </button>
    </div>
  );
};

export default SocialShare;
