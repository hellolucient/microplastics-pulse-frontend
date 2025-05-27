import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import DownloadWhitepaperForm from './DownloadWhitepaperForm';
import NewsCard from './NewsCard';
import SearchBar from './SearchBar';
import SearchResultsCarousel from './SearchResultsCarousel';

// Assume BACKEND_URL is available, e.g., from import.meta.env.VITE_BACKEND_API_URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';

// Define NewsItem interface (copied from HomePage.tsx for now)
export interface NewsItem {
  id: string;
  created_at: string;
  url: string;
  title: string | null;
  source: string | null;
  published_date: string | null; 
  ai_summary: string | null;
  ai_image_url?: string | null;
}

const NUM_CARDS_PER_PAGE = 50; // Number of cards to display on the globe at once
const GLOBE_RADIUS = 10;   // Radius of the sphere, increased for more cards
const PAGE_ROTATION_INTERVAL_MS = 120000; // 2 minutes in milliseconds

// New component to handle individual card group and its orientation
const GlobeCard = ({ item, position, onDoubleClick }: { 
  item: NewsItem, 
  position: [number, number, number], 
  onDoubleClick: (item: NewsItem) => void // Removed position from here as it's not used for snap anymore
}) => {
  const groupRef = useRef<THREE.Group>(null!); 

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.lookAt(0, 0, 0); // Make the group (and thus the card) face the origin
    }
  });

  return (
    <group ref={groupRef} position={position}> 
      {/* REMOVED inner group rotation for inside view */}
      <Html center transform>
        <div 
          style={{
            width: '320px',
            height: '400px',
            pointerEvents: 'auto',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            cursor: 'pointer' // Indicate clickable
          }}
          onDoubleClick={() => onDoubleClick(item)} // Pass item and its position
        >
          <NewsCard item={item} />
        </div>
      </Html>
    </group>
  );
};

// New component to handle the spinning group
const SpinningGlobeGroup = ({ children, targetYRotation, globeRef }: { 
  children: React.ReactNode, 
  targetYRotation: number | null, // If set, globe snaps/moves to this Y rotation and pauses auto-spin
  globeRef: React.Ref<THREE.Group>
}) => {
  useFrame((state, delta) => {
    const group = (globeRef as React.MutableRefObject<THREE.Group>).current;
    if (!group) return;

    if (targetYRotation !== null) { // If a target rotation is set, snap/move to it
      group.rotation.y = targetYRotation;
    } else { // Else (targetYRotation is null), do auto-spin
      group.rotation.y += delta * 0.1;
    }
  });

  return <group ref={globeRef}>{children}</group>;
};

const dummyFocusedItem: NewsItem = {
  id: 'dummy-123', created_at: new Date().toISOString(), url: '#dummy',
  title: 'DUMMY TEST ITEM', source: 'Test Source', published_date: null,
  ai_summary: 'This is a dummy item for testing modal visibility.', ai_image_url: null
};

// Component to access GL and manage canvas zIndex
const CanvasZIndexManager = ({ isModalFocused }: { isModalFocused: boolean }) => {
  const { gl } = useThree();
  useEffect(() => {
    if (gl.domElement) {
      // if (isModalFocused) {
      //   gl.domElement.style.zIndex = '-1';
      //   console.log("[CanvasZIndexManager] Canvas zIndex set to -1 (now commented out)");
      // } else {
      //   gl.domElement.style.zIndex = ''; // Or 'auto' or initial value if known
      //   console.log("[CanvasZIndexManager] Canvas zIndex reset (now commented out)");
      // }
    }
    // Optional: return a cleanup function to reset zIndex on unmount
    // return () => {
    //   if (gl.domElement) {
    //     gl.domElement.style.zIndex = '';
    //     console.log("[CanvasZIndexManager] Canvas zIndex reset on unmount (now commented out)");
    //   }
    // };
  }, [isModalFocused, gl]);
  return null; // This component doesn't render anything itself
};

export default function NewsGlobe() {
  const [allNewsData, setAllNewsData] = useState<NewsItem[]>([]);
  const [currentNewsBatch, setCurrentNewsBatch] = useState<NewsItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchResults, setSearchResults] = useState<NewsItem[] | null>(null);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [focusedNewsItem, setFocusedNewsItem] = useState<NewsItem | null>(null);
  const [targetYRotation, setTargetYRotation] = useState<number | null>(null);
  const globeGroupRef = useRef<THREE.Group>(null!); 

  const handleSearch = (query: string) => {
    console.log("Search submitted:", query);
    if (query.trim() === '' || allNewsData.length === 0) {
      setSearchResults(null); // Clear results if query is empty or no data
      return;
    }
    const filtered = allNewsData.filter(item => 
      item.title?.toLowerCase().includes(query.toLowerCase()) || 
      item.ai_summary?.toLowerCase().includes(query.toLowerCase())
    );
    console.log(`Search for "${query}" found ${filtered.length} items.`);
    setSearchResults(filtered.length > 0 ? filtered : []); // Set to empty array if no results to show 'no results' in carousel if designed for it
    setFocusedNewsItem(null); // Ensure main modal is closed if it was open
  };

  const handleCloseSearchResults = () => {
    setSearchResults(null);
    // Optionally, you might want to clear the SearchBar input here if you had a ref to it
  };

  // This function will be passed to the carousel for when a card is selected
  const handleCarouselCardSelect = (item: NewsItem) => {
    console.log("[handleCarouselCardSelect] item:", item?.title);
    setFocusedNewsItem(item); // This will open the main article modal
    // We might want to hide the carousel when a card is selected for the main modal
    // setSearchResults(null); // Option 1: Hide carousel when main modal opens
  };

  // 1. Fetch all news data once
  useEffect(() => {
    const fetchAllNews = async () => {
      setNewsLoading(true);
      setNewsError(null);
      try {
        const response = await axios.get<NewsItem[]>(`${BACKEND_URL}/api/latest-news`);
        setAllNewsData(response.data); 
      } catch (error: unknown) {
        console.error('Error fetching all news for globe:', error);
        let message = 'An unknown error occurred loading news.';
        if (error && typeof error === 'object') {
            let extracted = false;
            if ('response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data) {
                const data = error.response.data as any;
                if (data.error) {
                    message = `Failed to load news: ${String(data.error)}`;
                    extracted = true;
                } else if (data.details) {
                    message = `Failed to load news: ${String(data.details)}`;
                    extracted = true;
                }
            }
            if (!extracted && 'message' in error) {
                message = `Failed to load news: ${String(error.message)}`;
            }
        }
        setNewsError(message);
      } finally {
        setNewsLoading(false);
      }
    };
    fetchAllNews();
  }, []);

  // 2. Update currentNewsBatch for the globe (no longer directly affected by search query)
  useEffect(() => {
    if (allNewsData.length > 0) {
      const startIndex = currentPage * NUM_CARDS_PER_PAGE;
      const endIndex = startIndex + NUM_CARDS_PER_PAGE;
      setCurrentNewsBatch(allNewsData.slice(startIndex, endIndex));
      console.log(`Globe: Displaying page ${currentPage + 1} of all news. Items: ${startIndex} to ${Math.min(endIndex, allNewsData.length) -1 }`);
    }
  }, [allNewsData, currentPage]);

  // 3. Set up interval to rotate pages (pauses if search results or modal is up)
  useEffect(() => {
    if (allNewsData.length === 0 || focusedNewsItem !== null || searchResults !== null) return; 

    const totalPages = Math.ceil(allNewsData.length / NUM_CARDS_PER_PAGE);
    if (totalPages <= 1) return; 

    const intervalId = setInterval(() => {
      setCurrentPage(prevPage => (prevPage + 1) % totalPages);
    }, PAGE_ROTATION_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [allNewsData.length, focusedNewsItem, searchResults]);

  useEffect(() => {
    if (newsLoading) {
      // console.log('NewsGlobe: News loading...');
    } else if (newsError) {
      console.error('NewsGlobe: News error:', newsError);
    } else {
      // console.log('NewsGlobe: All news loaded:', allNewsData.length, 'items. Current batch:', currentNewsBatch.length, 'items on page', currentPage + 1);
    }
  }, [allNewsData, currentNewsBatch, currentPage, newsLoading, newsError]);

  const handleCardDoubleClick = (item: NewsItem) => {
    console.log("[handleCardDoubleClick] item (from globe double click):", item?.title);
    setTargetYRotation(null); 
    setFocusedNewsItem(item); 
    console.log("[handleCardDoubleClick] focusedNewsItem set to:", item?.title, "targetYRotation ensured to be null.");
  };

  const handleCloseModal = () => {
    console.log("[handleCloseModal] Closing modal. Current focusedNewsItem:", focusedNewsItem?.title);
    setFocusedNewsItem(null);
    setTargetYRotation(null); 
    console.log("[handleCloseModal] focusedNewsItem and targetYRotation reset.");
  };

  const isGlobeInteractive = targetYRotation === null && focusedNewsItem === null && searchResults === null;

  console.log("[NewsGlobe Render] focusedNewsItem:", focusedNewsItem?.title, "targetYRotation:", targetYRotation, "searchResults:", searchResults ? `${searchResults.length} items` : null);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      
      {/* Conditionally render SearchBar portal */} 
      {searchResults === null && (
        createPortal(
          <>
            {/* Test buttons were here, now removed */}
            <SearchBar onSearch={handleSearch} />
          </>,
          document.body
        )
      )}

      <div style={{ 
          height: '100vh',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: focusedNewsItem || searchResults ? 1 : 0, // Keep canvas behind if modal or carousel is up
          pointerEvents: focusedNewsItem || searchResults ? 'none' : 'auto' 
      }} > 
        <Canvas camera={{ position: [0, 0, 0.1], fov: 75 }}> 
            <ambientLight intensity={1.5} />
            <pointLight position={[10, 10, 10]} intensity={Math.PI} />
            <OrbitControls 
              enabled={isGlobeInteractive}
              enableZoom={true} 
              enablePan={false} 
              minDistance={0.1} 
              maxDistance={GLOBE_RADIUS - 1} 
            /> 
            {!newsLoading && currentNewsBatch.length > 0 && (
              <SpinningGlobeGroup 
                targetYRotation={targetYRotation} 
                globeRef={globeGroupRef}
              >
                {currentNewsBatch.map((item) => {
                  if (!item || !item.id) {
                    console.error("Invalid item in currentNewsBatch:", item);
                    return null;
                  }
                  const itemIndex = currentNewsBatch.findIndex(i => i.id === item.id);
                  if (itemIndex === -1) {
                      console.error("Item not found in currentNewsBatch for positioning:", item.title);
                      return null; 
                  }
                  const phi = Math.acos(-1 + (2 * itemIndex + 1) / NUM_CARDS_PER_PAGE );
                  const theta = Math.sqrt(NUM_CARDS_PER_PAGE * Math.PI) * phi;
                  const x = GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta);
                  const y = GLOBE_RADIUS * Math.cos(phi);
                  const z = GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta);
                  const cardPosition: [number, number, number] = [x, y, z];
                  return (
                    <GlobeCard 
                      key={`${item.id}-page-${currentPage}`}
                      item={item} 
                      position={cardPosition} 
                      onDoubleClick={handleCardDoubleClick} // Globe cards still use this
                    />
                  );
                })}
              </SpinningGlobeGroup> 
            )}
          </Canvas>
        </div>

      {/* Search Results Carousel Portal */} 
      {searchResults && (
        createPortal(
          <SearchResultsCarousel 
            results={searchResults} 
            onClose={handleCloseSearchResults} 
            onCardSelect={handleCarouselCardSelect} // Use new handler for carousel card clicks
          />,
          document.body
        )
      )}

      {/* Main Article Modal Portal */} 
      {focusedNewsItem && createPortal(
        (() => {
          console.log('[Modal JSX Render with Portal] Rendering simplified modal for:', focusedNewsItem?.title);
          return (
            <div 
              style={{
                position: 'fixed', top: '0px', left: '0px', width: '100vw', height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'block',
                zIndex: 99999 
              }}
              onClick={handleCloseModal}
            >
              <div 
                style={{ 
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  padding: '20px', background: 'white', color: 'black', textAlign: 'left',
                  borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  width: '90%', maxWidth: '600px', cursor: 'default' 
                }}
                onClick={(e) => e.stopPropagation()} 
              >
                <NewsCard item={focusedNewsItem} isModalVersion={true} /> 
                <button 
                    onClick={handleCloseModal}
                    style={{
                        position: 'absolute', top: '10px', right: '10px',
                        background: 'transparent', border: 'none', fontSize: '1.5rem',
                        color: '#333', cursor: 'pointer'
                    }}
                >
                    &times; 
                </button>
              </div>
            </div>
          );
        })(),
        document.body 
      )}

      {/* Other UI elements (Download form, 2D previews) - only show if no modal and no search results carousel */}
      {!focusedNewsItem && !targetYRotation && !searchResults && (
        <div style={{
          position: 'absolute',
          bottom: '2%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10, 
        }}>
          <DownloadWhitepaperForm />
        </div>
      )}
      {!focusedNewsItem && !targetYRotation && !searchResults && (
        <div className="p-4 min-h-0" style={{ 
          position: 'absolute', 
          bottom: 'calc(2% + 70px)',
          left: '50%', 
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '1200px',
          zIndex: 5 
        }}>
          <h2 className="text-xl font-semibold mb-2 text-center text-white">News Previews (2D) - Batch {currentPage + 1}</h2>
          {newsLoading && <p className="text-center text-gray-300">Loading news...</p>}
          {newsError && <p className="text-center text-red-400">Error: {newsError}</p>}
          {!newsLoading && !newsError && (
            <div className="flex flex-wrap justify-center gap-4 overflow-y-auto" style={{ maxHeight: '150px' }}>
              {currentNewsBatch.slice(0, 5).map(item => ( 
                <NewsCard key={`2d-${item.id}-page-${currentPage}`} item={item} />
              ))}
              {currentNewsBatch.length === 0 && !newsLoading && <p className="text-center text-gray-300">No news items in current batch.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 