import React from 'react';
import { Share2, Twitter, Facebook, Linkedin } from 'lucide-react';

interface SocialShareProps {
  title: string;
  url: string;
  summary?: string | null;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const SocialShare: React.FC<SocialShareProps> = ({ 
  title, 
  url, 
  summary, 
  className = '', 
  size = 'medium' 
}) => {
  const shareToTwitter = () => {
    const text = `${title} - Important microplastics research`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=microplastics,health,environment`;
    window.open(shareUrl, '_blank', 'width=550,height=420');
  };

  const shareToFacebook = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=580,height=296');
  };

  const shareToLinkedIn = () => {
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary || title)}`;
    window.open(shareUrl, '_blank', 'width=520,height=570');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
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
      textArea.value = url;
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
