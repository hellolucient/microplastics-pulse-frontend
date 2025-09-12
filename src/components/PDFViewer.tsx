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
  const [highlightRects, setHighlightRects] = useState<any[]>([]);
  const [textLayerRef, setTextLayerRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    loadPDF();
  }, [pdfUrl]);

  useEffect(() => {
    if (pdf && currentPage) {
      renderPage();
    }
  }, [pdf, currentPage, scale, rotation]);

  useEffect(() => {
    if (searchInput.trim()) {
      highlightSearchTerms(searchInput.trim());
    }
  }, [currentPage, searchInput]);

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
      
      // Create text layer for highlighting
      await createTextLayer(page, viewport);
      
      if (onPageChange) {
        onPageChange(currentPage);
      }
    } catch (err) {
      console.error('Page rendering error:', err);
    }
  };

  const createTextLayer = async (page: any, viewport: any) => {
    if (!textLayerRef) return;

    // Clear previous text layer
    textLayerRef.innerHTML = '';

    const textContent = await page.getTextContent();
    const textLayer = document.createElement('div');
    textLayer.className = 'textLayer';
    textLayer.style.position = 'absolute';
    textLayer.style.left = '0';
    textLayer.style.top = '0';
    textLayer.style.right = '0';
    textLayer.style.bottom = '0';
    textLayer.style.overflow = 'hidden';
    textLayer.style.opacity = '0.2';
    textLayer.style.lineHeight = '1.0';

    // Create text items
    textContent.items.forEach((textItem: any) => {
      const textDiv = document.createElement('div');
      textDiv.style.position = 'absolute';
      textDiv.style.fontSize = `${textItem.height}px`;
      textDiv.style.fontFamily = textItem.fontName || 'sans-serif';
      textDiv.style.transformOrigin = '0% 0%';
      textDiv.style.left = `${textItem.transform[4]}px`;
      textDiv.style.top = `${viewport.height - textItem.transform[5] - textItem.height}px`;
      textDiv.style.color = 'transparent';
      textDiv.style.userSelect = 'none';
      textDiv.textContent = textItem.str;
      
      textLayer.appendChild(textDiv);
    });

    textLayerRef.appendChild(textLayer);
  };

  const highlightSearchTerms = (searchTerm: string) => {
    if (!textLayerRef || !searchTerm.trim()) return;

    const textDivs = textLayerRef.querySelectorAll('.textLayer div');
    textDivs.forEach((div: any) => {
      const text = div.textContent;
      if (text && text.toLowerCase().includes(searchTerm.toLowerCase())) {
        div.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
        div.style.color = 'transparent';
      } else {
        div.style.backgroundColor = 'transparent';
      }
    });
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
              index: index
            });
          }
        });
      }
      
      setSearchResults(results);
      setCurrentSearchIndex(0);
      
      // Highlight current page
      highlightSearchTerms(term);
      
      // Jump to first result
      if (results.length > 0) {
        goToPage(results[0].page);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
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
    }
  };

  const prevSearchResult = () => {
    if (searchResults.length > 0) {
      const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
      setCurrentSearchIndex(prevIndex);
      goToPage(searchResults[prevIndex].page);
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
          <div
            ref={setTextLayerRef}
            className="absolute inset-0 pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
