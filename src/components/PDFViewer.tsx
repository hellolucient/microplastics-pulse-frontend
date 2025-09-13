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
      console.log('PDF viewer: Search term received:', searchTerm);
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
      
      if (onPageChange) {
        onPageChange(currentPage);
      }
    } catch (err) {
      console.error('Page rendering error:', err);
    }
  };

  const renderTextLayer = async (page: any, viewport: any) => {
    try {
      console.log('Rendering text layer for page:', currentPage);
      const textContent = await page.getTextContent();
      const textLayerDiv = document.getElementById(`text-layer-${currentPage}`);
      
      console.log('Text layer div found:', !!textLayerDiv);
      console.log('Search input:', searchInput);
      
      if (textLayerDiv) {
        textLayerDiv.innerHTML = '';
        
        // Create a simple text layer manually instead of using TextLayerBuilder
        const textItems = textContent.items;
        let textLayerHTML = '';
        
        textItems.forEach((item: any, index: number) => {
          if (item.str) {
            const transform = item.transform;
            const fontSize = Math.abs(transform[0]);
            const x = transform[4];
            const y = transform[5];
            
            textLayerHTML += `
              <span 
                style="
                  position: absolute;
                  left: ${x}px;
                  top: ${y}px;
                  font-size: ${fontSize}px;
                  font-family: sans-serif;
                  color: transparent;
                  pointer-events: none;
                  user-select: text;
                "
                data-text="${item.str}"
              >
                ${item.str}
              </span>
            `;
          }
        });
        
        textLayerDiv.innerHTML = textLayerHTML;
        console.log('Simple text layer created with', textItems.length, 'items');
        
        // Highlight search terms if searchInput exists
        if (searchInput.trim()) {
          console.log('Highlighting search terms:', searchInput);
          highlightSearchTermsInTextLayer(textLayerDiv, searchInput);
        }
      }
    } catch (err) {
      console.error('Text layer rendering error:', err);
    }
  };

  const highlightSearchTermsInTextLayer = (textLayerDiv: HTMLElement, searchTerm: string) => {
    const textSpans = textLayerDiv.querySelectorAll('span[data-text]');
    let foundMatches = 0;
    let firstMatchElement: HTMLElement | null = null;
    
    console.log(`Searching ${textSpans.length} text spans for "${searchTerm}"`);
    
    textSpans.forEach((span) => {
      const text = span.getAttribute('data-text') || '';
      const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      
      if (regex.test(text)) {
        // Make text visible and highlight it
        span.style.color = '#000';
        span.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
        span.style.fontWeight = 'bold';
        span.style.borderRadius = '2px';
        span.style.padding = '1px 2px';
        
        foundMatches++;
        console.log(`Found match ${foundMatches}: "${text}"`);
        
        // Store reference to first match for scrolling
        if (foundMatches === 1) {
          firstMatchElement = span as HTMLElement;
        }
      }
    });
    
    if (foundMatches > 0) {
      console.log(`Highlighted ${foundMatches} instances of "${searchTerm}" on page ${currentPage}`);
      
      // Scroll to first match - get fresh reference after highlighting
      setTimeout(() => {
        try {
          console.log('Attempting to scroll to first match...');
          
          // Get fresh reference to the first highlighted element
          const highlightedElements = textLayerDiv.querySelectorAll('span[data-text]');
          let firstHighlightedElement: HTMLElement | null = null;
          
          // Find the first element that has highlighting styles applied
          for (const element of highlightedElements) {
            const htmlElement = element as HTMLElement;
            if (htmlElement.style.backgroundColor && htmlElement.style.backgroundColor.includes('255, 255, 0')) {
              firstHighlightedElement = htmlElement;
              break;
            }
          }
          
          if (firstHighlightedElement) {
            console.log('Found highlighted element for scrolling');
            
            // Method 1: Standard scrollIntoView
            firstHighlightedElement.scrollIntoView({ 
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
              const rect = firstHighlightedElement!.getBoundingClientRect();
              const viewportHeight = window.innerHeight;
              const elementTop = rect.top + window.pageYOffset;
              const scrollPosition = elementTop - (viewportHeight / 2);
              
              window.scrollTo({
                top: scrollPosition,
                behavior: 'smooth'
              });
            }, 1000);
          } else {
            console.log('Could not find highlighted element for scrolling');
          }
          
        } catch (error) {
          console.log('Scroll error:', error);
        }
      }, 1000);
    } else {
      console.log(`No matches found for "${searchTerm}"`);
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
              transform: item.transform
            });
          }
        });
      }
      
      setSearchResults(results);
      setCurrentSearchIndex(0);
      
      // Jump to the specified initial page
      if (initialPage !== 1) {
        goToPage(initialPage);
        // Scroll to search term
        setTimeout(() => {
          scrollToSearchTerm(term, initialPage);
        }, 1000);
      } else if (results.length > 0) {
        // Go to first match
        goToPage(results[0].page);
        setTimeout(() => {
          scrollToSearchTerm(term, results[0].page);
        }, 1000);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const scrollToSearchTerm = async (term: string, pageNum: number) => {
    console.log(`Scrolling to "${term}" on page ${pageNum}`);
    
    // Scroll to PDF viewer first
    const pdfViewer = document.querySelector('.pdf-viewer-container');
    if (pdfViewer) {
      pdfViewer.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      
      // Then scroll to the specific text position
      setTimeout(() => {
        scrollToTextPosition(term, pageNum);
      }, 1000);
    }
  };

  const scrollToTextPosition = async (term: string, pageNum: number) => {
    try {
      if (!pdf) return;
      
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale, rotation });
      
      // Find the first occurrence of the search term
      let foundPosition = null;
      
      for (const item of textContent.items) {
        if (item.str && item.str.toLowerCase().includes(term.toLowerCase())) {
          // Get the transform matrix
          const transform = item.transform;
          const x = transform[4];
          const y = transform[5];
          
          // Convert PDF coordinates to viewport coordinates
          const viewportX = x;
          const viewportY = viewport.height - y; // PDF coordinates are bottom-up
          
          foundPosition = { x: viewportX, y: viewportY };
          console.log(`Found "${term}" at position:`, foundPosition);
          break;
        }
      }
      
      if (foundPosition) {
        // Calculate scroll position to center the text
        const canvas = canvasRef.current;
        if (canvas) {
          const canvasRect = canvas.getBoundingClientRect();
          const scrollTop = window.pageYOffset + canvasRect.top + foundPosition.y - (window.innerHeight / 2);
          
          window.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
          });
          
          console.log(`Scrolled to position: ${scrollTop}`);
        }
      } else {
        console.log(`Could not find position for "${term}"`);
      }
    } catch (error) {
      console.error('Error scrolling to text position:', error);
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
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="shadow-lg border border-gray-300 bg-white"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
