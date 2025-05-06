import React, { useState, useEffect } from 'react';
import WhitepaperSection from '../components/WhitepaperSection'; // Path relative to src/pages/
import MainContent from '../components/MainContent'; // Path relative to src/pages/
import whitepaperContent from '../content/whitepaper.md?raw'; // Path relative to src/pages/

// Define Chapter type
interface Chapter {
  id: string;
  title: string;
  content: string;
}

// Simple function to create slugs (IDs)
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '') // Keep word chars and hyphens
    .replace(/\-\-+/g, '-')      // Collapse multiple hyphens
    .replace(/^-+/, '')          // Trim leading hyphen
    .replace(/-+$/, '');         // Trim trailing hyphen
};

// Helper function to get title from filename
const getTitleFromFilename = (filename: string): string => {
  let title = filename.replace(/\.md$/i, ''); // Remove .md extension
  title = title.replace(/-/g, ' '); // Replace hyphens with spaces
  // Optionally: Capitalize words? For now, keep simple.
  return title;
};

const WhitepaperPage: React.FC = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Define the chapter files in order - Updated with hyphenated names
  const chapterFiles = [
    'Foreword.md',
    'Chapter-1.md',
    'Chapter-2.md',
    'Chapter-3.md',
    'Chapter-4.md',
    'Chapter-5.md',
    'Chapter-6.md',
    'Chapter-7.md',
    // Add any future chapter files here
  ];

  useEffect(() => {
    const fetchAndProcessChapters = async () => {
      setLoading(true); 
      setError(null);
      console.log('[WhitepaperPage Load] Starting fetch for chapters:', chapterFiles);

      try {
        const fetchPromises = chapterFiles.map(file =>
          fetch(`/whitepaper-chapters/${file}?v=${Date.now()}`)
            .then(async res => {
              if (!res.ok) {
                 console.warn(`Failed to fetch ${file}: ${res.status} ${res.statusText}`);
                 return { filename: file, content: '' }; // Return object with filename
              }
              const content = await res.text(); 
              return { filename: file, content }; // Return object with filename and content
            })
            .catch(fetchError => {
                console.error(`Network error fetching ${file}:`, fetchError);
                return { filename: file, content: '' }; // Return object on network error
            })
        );

        const fetchedChaptersData = await Promise.all(fetchPromises);

        // CORRECT: Map fetched data to Chapter objects using filename for title
        const processedChapters: Chapter[] = fetchedChaptersData
          .filter(data => data.content !== null) // Filter out any potential nulls (though we return '')
          .map(data => {
            const title = getTitleFromFilename(data.filename);
            const id = slugify(title);
            console.log(`[WhitepaperPage Load] Processing: filename='${data.filename}', title='${title}', id='${id}'`);
            return {
              id,
              title,
              content: data.content, // Store the raw markdown content
            };
          });

        setChapters(processedChapters);
        console.log('[WhitepaperPage Load] Chapters processed from files:', processedChapters.length);

        // --- Start: Existing hash handling logic (uses processedChapters) ---
        const hash = window.location.hash.substring(1);
        console.log('[WhitepaperPage Load] Initial hash (Full Slug):', hash);
        
        const isValidHash = hash && processedChapters.some(ch => ch.id === hash); 
        console.log('[WhitepaperPage Load] Is hash valid (comparing full slugs)?', isValidHash);
        
        let initialChapterId = null;
        if (isValidHash) {
          initialChapterId = hash;
        } else if (processedChapters.length > 0) {
          initialChapterId = processedChapters[0].id; 
          if (!hash) { 
            window.history.replaceState(null, '', `#${initialChapterId}`);
          }
        }
        setActiveChapterId(initialChapterId);
        console.log('[WhitepaperPage Load] Setting activeChapterId to (Full Slug):', initialChapterId);
        // --- End: Existing hash handling logic ---

      } catch (err) {
          console.error("Error fetching or processing whitepaper chapters:", err);
          if (err instanceof Error) {
            setError(`Failed to load whitepaper content: ${err.message}`);
          } else {
            setError('An unknown error occurred while loading the whitepaper.');
          }
      } finally {
        setLoading(false);
        console.log('[WhitepaperPage Load] Fetch/process complete. Loading set to false.');
      }
    };

    fetchAndProcessChapters(); 

  }, []); // Keep empty dependency array

  const handleChapterClick = (id: string) => {
    console.log('[handleChapterClick] Clicked ID (Full Slug):', id);
    setActiveChapterId(id); // Set the full slug ID directly
    window.history.pushState(null, '', `#${id}`); 
  };

  // Effect to listen for hash changes (e.g., back/forward button)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      console.log('[handleHashChange] Hash changed to (Full Slug):', hash);
      const chapterExists = chapters.some(ch => ch.id === hash);
      console.log('[handleHashChange] Does chapter exist for this hash?', chapterExists);

      if (chapterExists) {
        setActiveChapterId(hash);
        console.log('[handleHashChange] Setting activeChapterId from hash (Full Slug):', hash);
      } else if (!hash && chapters.length > 0) { 
         // If hash is empty, maybe default to first chapter?
         const firstId = chapters[0].id;
         setActiveChapterId(firstId);
         window.history.replaceState(null, '', `#${firstId}`); 
         console.log('[handleHashChange] Hash cleared, defaulting activeChapterId to first chapter:', firstId);
      } 
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [chapters]);

  // Effect to scroll to active chapter heading ID (using full slug)
  useEffect(() => {
    if (activeChapterId) { // activeChapterId is now the full slug
      setTimeout(() => { 
        const element = document.getElementById(activeChapterId); // Target the heading ID directly
        console.log(`[Scroll Effect] Trying to scroll to element with ID (Full Slug): ${activeChapterId}`, element);
        if (element) {
          // Restore simple scrollIntoView - CSS handles the offset
          // Change behavior to 'auto' for testing
          element.scrollIntoView({ behavior: 'auto', block: 'start' }); 
        } else {
           console.warn(`[Scroll Effect] Could not find element (${activeChapterId}).`);
        }
      }, 100); // Reverted delay back to 100ms
    }
  }, [activeChapterId]); // Run whenever activeChapterId (the full slug) changes

  // Find the active chapter object
  const activeChapter = chapters.find((ch: Chapter) => ch.id === activeChapterId);
  // Get RAW content, default to null if no chapter found
  const activeChapterContent = activeChapter?.content || null;
  // Get title, default to null
  const activeChapterTitle = activeChapter?.title || null;

  return (
    // Apply consistent max-width and padding to the overall container
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex">
        {/* Sidebar */}
        {/* Adjusted width, padding, border color, top offset to match new header height */}
        <aside className="w-80 flex-shrink-0 overflow-y-auto bg-white border-r border-slate-200 p-6 hidden md:block sticky top-[80px] h-[calc(100vh-80px)]">
          <h2 className="text-base font-semibold mb-4 text-slate-800">Whitepaper Chapters</h2>
          <nav className="space-y-1">
            {chapters.map((chapter: Chapter) => (
              <WhitepaperSection 
                key={chapter.id}
                title={chapter.title}
                isActive={activeChapterId === chapter.id}
                onClick={() => handleChapterClick(chapter.id)}
              />
            ))}
          </nav>
        </aside>

        {/* Main Content Area - Remove unused ref */}
        <div className="flex-1 overflow-y-auto py-8 md:pl-12">
           {/* Pass both content and title */}
           <MainContent 
              activeChapterContent={activeChapterContent} 
              activeChapterTitle={activeChapterTitle} 
           />
        </div>
      </div>
    </div>
  );
};

export default WhitepaperPage; 