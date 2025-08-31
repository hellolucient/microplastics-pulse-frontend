import React, { useState } from 'react';
import { Share2, Twitter, Facebook, Linkedin, X, Copy, Check } from 'lucide-react';

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
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{title: string, content: string, platform: string, url: string} | null>(null);
  const [copied, setCopied] = useState(false);
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
    
    // Show our beautiful modal
    setModalContent({
      title: 'Facebook Post Ready to Copy',
      content: facebookPost,
      platform: 'Facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    });
    setIsModalOpen(true);
  };

  const shareToLinkedIn = () => {
    // Generate a professional LinkedIn post
    const cleanTitle = title.replace(/<[^>]*>/g, '');
    const cleanSummary = (summary || title).replace(/<[^>]*>/g, '');
    const linkedinPost = `🔬 New Research Alert: ${cleanTitle}\n\n${cleanSummary}\n\nThis study highlights the critical impact of microplastics on our health and environment. As researchers continue to uncover the extent of this crisis, it's crucial we stay informed and take action.\n\n#microplastics #health #environment #research\n\nRead the full article: ${shareUrl}`;
    
    // Show our beautiful modal
    setModalContent({
      title: 'LinkedIn Post Ready to Copy',
      content: linkedinPost,
      platform: 'LinkedIn',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    });
    setIsModalOpen(true);
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

  const copyModalContent = async () => {
    if (!modalContent) return;
    
    try {
      await navigator.clipboard.writeText(modalContent.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = modalContent.content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openSocialPlatform = () => {
    if (!modalContent) return;
    window.open(modalContent.url, '_blank', 'width=580,height=570');
    setIsModalOpen(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
    setCopied(false);
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
    <>
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

      {/* Beautiful Custom Modal */}
      {isModalOpen && modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={closeModal}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-brand-blue to-sky-600 text-white">
              <div className="flex items-center gap-3">
                {modalContent.platform === 'Facebook' ? (
                  <Facebook className="h-6 w-6" />
                ) : (
                  <Linkedin className="h-6 w-6" />
                )}
                <h3 className="text-xl font-bold">{modalContent.title}</h3>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="bg-gray-50 rounded-lg p-4 border">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                  {modalContent.content}
                </pre>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                Copy the post above, then click "Open {modalContent.platform}" to share
              </div>
              <div className="flex gap-3">
                <button
                  onClick={copyModalContent}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    copied 
                      ? 'bg-green-100 text-green-700 border border-green-300' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy Post'}
                </button>
                <button
                  onClick={openSocialPlatform}
                  className="flex items-center gap-2 px-6 py-2 bg-brand-blue text-white rounded-lg font-medium hover:bg-sky-700 transition-colors duration-200"
                >
                  Open {modalContent.platform}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SocialShare;
