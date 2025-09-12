import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Search, FileText, Calendar, User, ExternalLink } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  content: string;
  file_type: string;
  file_size: number;
  metadata: {
    author?: string;
    date?: string;
    source?: string;
    notes?: string;
  };
  created_at: string;
}

const BACKEND_URL = 'https://microplastics-pulse-backend-production.up.railway.app';

const DocumentViewerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [highlightedText, setHighlightedText] = useState<string | null>(null);

  // Get highlight text from URL params
  const highlightText = searchParams.get('highlight');

  useEffect(() => {
    if (id) {
      fetchDocument();
    }
  }, [id]);

  useEffect(() => {
    if (highlightText) {
      setHighlightedText(highlightText);
      // Scroll to first occurrence of highlighted text
      setTimeout(() => {
        scrollToHighlight(highlightText);
      }, 500);
    }
  }, [highlightText, document]);

  const fetchDocument = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${BACKEND_URL}/api/rag-documents/public/${id}`);
      if (!response.ok) {
        throw new Error('Document not found');
      }
      
      const data = await response.json();
      setDocument(data);
      
      // Calculate total pages (500 words per page)
      const wordCount = data.content.split(/\s+/).length;
      setTotalPages(Math.ceil(wordCount / 500));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToHighlight = (text: string) => {
    const element = document.querySelector(`[data-highlight="${text}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const getCurrentPageContent = () => {
    if (!document) return '';
    
    const words = document.content.split(/\s+/);
    const wordsPerPage = 500;
    const startIndex = (currentPage - 1) * wordsPerPage;
    const endIndex = Math.min(startIndex + wordsPerPage, words.length);
    
    return words.slice(startIndex, endIndex).join(' ');
  };

  const highlightSearchTerm = (text: string, searchTerm: string | null): React.ReactNode => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <mark 
            key={index} 
            className="bg-yellow-200 text-yellow-900 px-1 rounded font-medium"
            data-highlight={searchTerm}
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of content
      const contentElement = document.getElementById('document-content');
      if (contentElement) {
        contentElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'docx':
        return '📝';
      case 'txt':
        return '📃';
      default:
        return '📄';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Document Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested document could not be found.'}</p>
          <button
            onClick={() => navigate('/research-library')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Research Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/research-library')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Research Library
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getFileTypeIcon(document.file_type)}</span>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{document.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(document.created_at)}
                    </span>
                    {document.metadata.author && (
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {document.metadata.author}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Page</span>
                <input
                  type="number"
                  value={currentPage}
                  onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                  min={1}
                  max={totalPages}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center"
                />
                <span className="text-sm text-gray-600">of {totalPages}</span>
              </div>
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div id="document-content" className="prose prose-lg max-w-none">
            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {highlightSearchTerm(getCurrentPageContent(), highlightedText)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerPage;
