import React from 'react';
// import ArticleSection from './ArticleSection';
import ResearchTimeline from './ResearchTimeline';
import { Clock, AlertTriangle, BookOpen } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
// import whitepaperContent from '../content/whitepaper.md?raw';

// Define props for MainContent
interface MainContentProps {
  activeChapterContent: string | null;
  activeChapterTitle: string | null;
}

const MainContent: React.FC<MainContentProps> = ({ activeChapterContent, activeChapterTitle }) => {
  const lastUpdated = formatDate(new Date());

  // Function to generate dynamic description
  const getTimelineDescription = () => {
    let baseText = "This timeline represents key research publications and findings related to microplastics and human health.";
    if (activeChapterTitle && activeChapterTitle !== 'Foreword') {
        // Extract the core topic from the chapter title if possible (simple extraction)
        const coreTopic = activeChapterTitle.split(':')[1]?.split('–')[0]?.trim() || activeChapterTitle;
        baseText = `This timeline represents key research publications and findings related to microplastics and ${coreTopic}.`;
    } 
    // Could add a specific message for Foreword if desired
    // else if (activeChapterTitle === 'Foreword') { ... }
    
    return `${baseText} It is continuously updated as new research emerges.`;
  };

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8 scroll-smooth">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="relative">
            <img 
              src="https://images.pexels.com/photos/3735218/pexels-photo-3735218.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
              alt="Plastic pollution in ocean" 
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
              <div className="p-6">
                <h1 className="text-white text-3xl md:text-4xl font-bold">Microplastics: A Growing Threat to Human Health</h1>
                <p className="text-white/80 mt-2 max-w-3xl">
                  A comprehensive review of research on microplastic contamination and its implications for human health
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center text-sm text-gray-500 mb-6 space-x-4 border-b border-gray-100 pb-4">
              <div className="flex items-center">
                <Clock size={16} className="mr-1" />
                <span>Last updated: {lastUpdated}</span>
              </div>
              <div className="flex items-center">
                <BookOpen size={16} className="mr-1" />
                <span>Living Whitepaper</span>
              </div>
            </div>
            
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-8 rounded-r-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">Research Update Notice</h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <p>
                      This is a living document that is regularly updated as new research emerges. The content reflects 
                      the current scientific understanding of microplastics and their health effects, but this field is rapidly evolving.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {activeChapterContent ? (
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
                  {activeChapterContent}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-10">
                <p>Select a chapter from the sidebar to view its content.</p>
              </div>
            )}
            
            <div id="research" className="my-12 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold mb-6">Latest News Timeline</h2>
              <p className="text-gray-700 mb-6">
                {getTimelineDescription()}
              </p>
              <ResearchTimeline filterCategory={activeChapterTitle} />
            </div>

          </div>
        </div>
      </div>
    </main>
  );
};

export default MainContent;