import React, { useState, useEffect } from 'react';
import { Search, FileText, Calendar, User, ExternalLink, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ContentMatch {
  snippet: string;
  page: number;
  position: number;
}

interface Document {
  id: string;
  title: string;
  content: string;
  file_type: string;
  metadata: {
    author?: string;
    date?: string;
    source?: string;
    notes?: string;
  };
  created_at: string;
  relevanceScore?: number;
  titleMatch?: boolean;
  contentMatches?: ContentMatch[];
  totalMatches?: number;
}

interface SearchResult {
  documents: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  searchTerm: string;
}

interface DocumentOption {
  id: string;
  title: string;
  file_type: string;
  created_at: string;
}

const BACKEND_URL = import.meta.env.DEV ? 'http://localhost:3001' : 'https://microplastics-pulse-backend-production.up.railway.app';

// Function to highlight search terms in text
const highlightSearchTerm = (text: string, searchTerm: string): React.ReactNode => {
  if (!searchTerm.trim()) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    if (regex.test(part)) {
      return (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded font-medium">
          {part}
        </mark>
      );
    }
    return part;
  });
};

const ResearchLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [showAllDocuments, setShowAllDocuments] = useState(true);
  const [availableDocuments, setAvailableDocuments] = useState<DocumentOption[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [showDocumentFilter, setShowDocumentFilter] = useState(false);

  // Fetch all public documents on component mount
  useEffect(() => {
    fetchAllDocuments();
    fetchAvailableDocuments();
  }, []);

  const fetchAllDocuments = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rag-documents/public`);
      if (response.ok) {
        const data = await response.json();
        setAllDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchAvailableDocuments = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rag-documents/public/list`);
      if (response.ok) {
        const data = await response.json();
        setAvailableDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching available documents:', error);
    }
  };

  const handleSearch = async (page: number = 1) => {
    if (!searchTerm.trim()) {
      setSearchResults(null);
      setShowAllDocuments(true);
      setCurrentPage(1);
      return;
    }

    setIsLoading(true);
    setCurrentPage(page);

    try {
      let searchUrl = `${BACKEND_URL}/api/rag-documents/public/search?q=${encodeURIComponent(searchTerm)}&page=${page}&limit=10`;
      
      // Add document filter if documents are selected
      if (selectedDocumentIds.length > 0) {
        searchUrl += `&documentIds=${selectedDocumentIds.join(',')}`;
      }
      
      const response = await fetch(searchUrl);
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setShowAllDocuments(false);
      } else {
        console.error('Search failed');
        setSearchResults(null);
      }
    } catch (error) {
      console.error('Error searching documents:', error);
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(1);
  };

  const handlePageChange = (newPage: number) => {
    if (searchTerm.trim()) {
      handleSearch(newPage);
    } else {
      setCurrentPage(newPage);
    }
  };

  const handleViewDocument = (documentId: string, page: number, searchTerm: string) => {
    // Navigate to document viewer with highlight parameter
    const url = `/document/${documentId}?highlight=${encodeURIComponent(searchTerm)}&page=${page}`;
    navigate(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return '📄';
      case 'docx':
        return '📝';
      case 'txt':
        return '📃';
      case 'url':
        return '🔗';
      default:
        return '📄';
    }
  };

  const documentsToShow = showAllDocuments ? allDocuments : (searchResults?.documents || []);
  const totalPages = showAllDocuments ? Math.ceil(allDocuments.length / 10) : (searchResults?.pagination?.totalPages || 1);
  const totalCount = showAllDocuments ? allDocuments.length : (searchResults?.pagination?.total || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Research Library</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our curated collection of microplastics research documents, reports, and studies.
            </p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSearchSubmit} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search research documents..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </form>
          
          {/* Document Filter Section */}
          {availableDocuments.length > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Filter by Document</h3>
                <button
                  type="button"
                  onClick={() => setShowDocumentFilter(!showDocumentFilter)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showDocumentFilter ? 'Hide Filter' : 'Show Filter'}
                </button>
              </div>
              
              {showDocumentFilter && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="all-documents"
                      checked={selectedDocumentIds.length === 0}
                      onChange={() => setSelectedDocumentIds([])}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="all-documents" className="text-sm text-gray-700">
                      Search all documents ({availableDocuments.length} available)
                    </label>
                  </div>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {availableDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`doc-${doc.id}`}
                          checked={selectedDocumentIds.includes(doc.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDocumentIds([...selectedDocumentIds, doc.id]);
                            } else {
                              setSelectedDocumentIds(selectedDocumentIds.filter(id => id !== doc.id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`doc-${doc.id}`} className="text-sm text-gray-700 flex-1">
                          <span className="font-medium">{doc.title}</span>
                          <span className="text-gray-500 ml-2">({doc.file_type.toUpperCase()})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                  
                  {selectedDocumentIds.length > 0 && (
                    <div className="text-sm text-gray-600">
                      Searching in {selectedDocumentIds.length} selected document{selectedDocumentIds.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Results Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {showAllDocuments ? 'All Documents' : 'Search Results'}
          </h2>
          <p className="text-gray-600">
            {showAllDocuments 
              ? `${allDocuments.length} documents available`
              : `${totalCount} results found for "${searchTerm}"`
            }
          </p>
        </div>

        {/* Documents Grid */}
        {documentsToShow.length > 0 ? (
          <div className="space-y-6">
            {documentsToShow.map((document) => (
              <div key={document.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFileTypeIcon(document.file_type)}</span>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {!showAllDocuments && document.titleMatch 
                          ? highlightSearchTerm(document.title, searchTerm)
                          : document.title
                        }
                      </h3>
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
                        {document.metadata.source && (
                          <span className="flex items-center gap-1">
                            <ExternalLink className="w-4 h-4" />
                            {document.metadata.source}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {document.file_type.toUpperCase()}
                  </span>
                </div>

                {/* Enhanced content display for search results */}
                {showAllDocuments ? (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      {truncateContent(document.content, 300)}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Show snippets for search results */}
                    {document.contentMatches && document.contentMatches.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium">
                            Found {document.totalMatches} matching snippet{document.totalMatches !== 1 ? 's' : ''}
                          </span>
                          {document.titleMatch && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                              Title Match
                            </span>
                          )}
                        </div>
                        <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                          {document.contentMatches.map((match, index) => (
                            <div key={index} className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-md">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-blue-800">Page {match.page}</span>
                                  <span className="text-xs text-blue-600">Match {index + 1}</span>
                                </div>
                                <button
                                  onClick={() => handleViewDocument(document.id, match.page, searchTerm)}
                                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                                >
                                  <Eye className="w-3 h-3" />
                                  View Document
                                </button>
                              </div>
                              <p className="text-gray-700 text-sm leading-relaxed">
                                ...{highlightSearchTerm(match.snippet, searchTerm)}...
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Fallback to truncated content if no matches */}
                    {(!document.contentMatches || document.contentMatches.length === 0) && (
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 leading-relaxed">
                          {truncateContent(document.content, 300)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {document.metadata.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">
                      <strong>Notes:</strong> {document.metadata.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {showAllDocuments ? 'No documents available' : 'No results found'}
            </h3>
            <p className="text-gray-600">
              {showAllDocuments 
                ? 'Check back later for new research documents.'
                : 'Try different search terms or browse all documents.'
              }
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchLibraryPage;
