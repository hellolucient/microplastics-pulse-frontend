import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download, Search } from 'lucide-react';

// Set up PDF.js worker - use local worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PDFViewerProps {
  pdfUrl: string;
  initialPage?: number;
  searchTerm?: string;
  onPageChange?: (page: number) => void;
  onError?: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  pdfUrl, 
  initialPage = 1, 
  searchTerm, 
  onPageChange,
  onError
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [searchInput, setSearchInput] = useState(searchTerm || '');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadPDF();
  }, [pdfUrl]);

  useEffect(() => {
    if (pdf && currentPage) {
      renderPage();
    }
  }, [pdf, currentPage, scale, rotation]);


  useEffect(() => {
    if (searchTerm && pdf) {
      setSearchInput(searchTerm);
      searchInPDF(searchTerm);
    }
  }, [searchTerm, pdf]);

  const loadPDF = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdfDoc = await loadingTask.promise;
      
      setPdf(pdfDoc);
      setTotalPages(pdfDoc.numPages);
      setCurrentPage(initialPage);
      
    } catch (err) {
      setError('Failed to load PDF');
      console.error('PDF loading error:', err);
      if (onError) {
        onError();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderPage = async () => {
    if (!pdf || !canvasRef.current) return;

    try {
      const page = await pdf.getPage(currentPage);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      const viewport = page.getViewport({ scale, rotation });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      
      // Render text layer for search highlighting
      await renderTextLayer(page, viewport);
      
      if (onPageChange) {
        onPageChange(currentPage);
      }
    } catch (err) {
      console.error('Page rendering error:', err);
    }
  };

  const renderTextLayer = async (page: any, viewport: any) => {
    try {
      const textContent = await page.getTextContent();
      const textLayerDiv = document.getElementById(`text-layer-${currentPage}`);
      
      if (textLayerDiv) {
        textLayerDiv.innerHTML = '';
        
        // Create text layer
        const textLayer = new pdfjsLib.TextLayerBuilder({
          textLayerDiv: textLayerDiv,
          pageIndex: currentPage - 1,
          viewport: viewport,
        });
        
        textLayer.setTextContent(textContent);
        textLayer.render();
        
        // Highlight search terms if searchInput exists
        if (searchInput.trim()) {
          highlightSearchTermsInTextLayer(textLayerDiv, searchInput);
        }
      }
    } catch (err) {
      console.error('Text layer rendering error:', err);
    }
  };

  const highlightSearchTermsInTextLayer = (textLayerDiv: HTMLElement, searchTerm: string) => {
    const textSpans = textLayerDiv.querySelectorAll('span');
    let foundMatches = 0;
    let firstMatchElement: HTMLElement | null = null;
    
    textSpans.forEach((span) => {
      const text = span.textContent || '';
      const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      
      if (regex.test(text)) {
        const highlightedText = text.replace(regex, '<mark class="pdf-search-highlight">$1</mark>');
        span.innerHTML = highlightedText;
        foundMatches++;
        
        // Store reference to first match for scrolling
        if (foundMatches === 1) {
          firstMatchElement = span as HTMLElement;
        }
      }
    });
    
    if (foundMatches > 0) {
      console.log(`Highlighted ${foundMatches} instances of "${searchTerm}" on page ${currentPage}`);
      
      // Scroll to first match with better timing and positioning
      if (firstMatchElement) {
        setTimeout(() => {
          try {
            // Method 1: Standard scrollIntoView
            firstMatchElement!.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'center'
            });
            
            // Method 2: Scroll the entire page to the PDF viewer
            setTimeout(() => {
              const pdfViewer = document.querySelector('.pdf-viewer-container');
              if (pdfViewer) {
                pdfViewer.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'start' 
                });
              }
            }, 500);
            
            // Method 3: Manual scroll calculation
            setTimeout(() => {
              const rect = firstMatchElement!.getBoundingClientRect();
              const viewportHeight = window.innerHeight;
              const elementTop = rect.top + window.pageYOffset;
              const scrollPosition = elementTop - (viewportHeight / 2);
              
              window.scrollTo({
                top: scrollPosition,
                behavior: 'smooth'
              });
            }, 1000);
            
          } catch (error) {
            console.log('Scroll error:', error);
          }
        }, 1000); // Increased delay to ensure text layer is fully rendered
      }
    }
  };


  const searchInPDF = async (term: string) => {
    if (!pdf || !term.trim()) return;

    try {
      setIsSearching(true);
      const results = [];
      
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        
        // Use PDF.js search functionality
        const textContent = await page.getTextContent();
        const textItems = textContent.items;
        
        // Search for term in text items
        textItems.forEach((item: any, index: number) => {
          if (item.str && item.str.toLowerCase().includes(term.toLowerCase())) {
            results.push({
              page: pageNum,
              text: item.str,
              index: index,
              transform: item.transform // Store position info for highlighting
            });
          }
        });
      }
      
      setSearchResults(results);
      setCurrentSearchIndex(0);
      
      // Jump to the specified initial page and highlight search term
      if (initialPage !== 1) {
        goToPage(initialPage);
        // Highlight search term on the current page after rendering
        setTimeout(() => {
          highlightSearchTermsInTextLayer(document.getElementById(`text-layer-${initialPage}`), term);
        }, 1500);
      } else if (results.length > 0) {
        // Go to first match
        goToPage(results[0].page);
        setTimeout(() => {
          highlightSearchTermsInTextLayer(document.getElementById(`text-layer-${results[0].page}`), term);
        }, 1500);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const highlightSearchTermOnPage = async (term: string, pageNum: number) => {
    if (!pdf || !term.trim()) return;
    
    try {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const textItems = textContent.items;
      
      // Find all instances of the search term on this page
      const matches = textItems.filter((item: any) => 
        item.str && item.str.toLowerCase().includes(term.toLowerCase())
      );
      
      if (matches.length > 0) {
        // Create a visual indicator that search terms are highlighted
        console.log(`Found ${matches.length} instances of "${term}" on page ${pageNum}`);
        
        // You could add visual highlighting here if needed
        // For now, we'll rely on the search results display
      }
    } catch (err) {
      console.error('Highlight error:', err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      await searchInPDF(searchInput.trim());
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const nextSearchResult = () => {
    if (searchResults.length > 0) {
      const nextIndex = (currentSearchIndex + 1) % searchResults.length;
      setCurrentSearchIndex(nextIndex);
      goToPage(searchResults[nextIndex].page);
      // Re-highlight search term on new page
      setTimeout(() => {
        const textLayerDiv = document.getElementById(`text-layer-${searchResults[nextIndex].page}`);
        if (textLayerDiv) {
          highlightSearchTermsInTextLayer(textLayerDiv, searchInput);
        }
      }, 1500);
    }
  };

  const prevSearchResult = () => {
    if (searchResults.length > 0) {
      const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
      setCurrentSearchIndex(prevIndex);
      goToPage(searchResults[prevIndex].page);
      // Re-highlight search term on new page
      setTimeout(() => {
        const textLayerDiv = document.getElementById(`text-layer-${searchResults[prevIndex].page}`);
        if (textLayerDiv) {
          highlightSearchTermsInTextLayer(textLayerDiv, searchInput);
        }
      }, 1500);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">📄</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading PDF</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-viewer-container bg-white rounded-lg shadow-sm border border-gray-200">
      {/* PDF Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          {/* Page Navigation */}
          <button
            onClick={prevPage}
            disabled={currentPage <= 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
            onClick={nextPage}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Search Box */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search in PDF..."
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={isSearching || !searchInput.trim()}
              className="p-1 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={prevSearchResult}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">
              {currentSearchIndex + 1} of {searchResults.length} matches
            </span>
            <button
              onClick={nextSearchResult}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {searchResults[currentSearchIndex] && (
              <span className="text-xs text-gray-500 bg-yellow-100 px-2 py-1 rounded">
                Page {searchResults[currentSearchIndex].page}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <button
            onClick={zoomOut}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          
          <span className="text-sm text-gray-600 min-w-[3rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <button
            onClick={zoomIn}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          
          {/* Rotate */}
          <button
            onClick={rotate}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100"
          >
            <RotateCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="p-4 bg-gray-100">
        <div className="flex justify-center relative">
          <canvas
            ref={canvasRef}
            className="shadow-lg border border-gray-300 bg-white"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          {/* Text layer for search highlighting */}
          <div
            id={`text-layer-${currentPage}`}
            className="absolute top-0 left-0 pointer-events-none"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: '100%',
              height: '100%'
            }}
          />
        </div>
      </div>
      
      {/* CSS for search highlighting */}
      <style jsx>{`
        .pdf-search-highlight {
          background-color: rgba(255, 255, 0, 0.3) !important;
          color: #000 !important;
          font-weight: bold !important;
          border-radius: 2px !important;
          padding: 1px 2px !important;
        }
      `}</style>
    </div>
  );
};

export default PDFViewer;
