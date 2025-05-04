import React from 'react';
import { CircleDot, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import WhitepaperSection from '../components/WhitepaperSection'; // Path relative to src/pages/

// Define chapter titles for the homepage links
const chapterTitles = [
  "Chapter 1: Microplastics and Human Health – Introduction",
  "Chapter 2: Pathways into Human Biology",
  "Chapter 3: Human Health Impacts of Microplastics",
  "Chapter 4: Environmental Context: Exposure Pathways and Contamination Sources",
  "Chapter 5: Wellness Industry Blindspot – Prevention, Reduction, and Wellness Programming",
  "Chapter 6: Framework for Action",
  "Chapter 7: Conclusion and Future Directions",
  // "Chapter 8: Bibliography" // Removed Bibliography for now
];

// Simple function to create slugs (IDs) - General purpose
// Needs to match the slugify function in WhitepaperPage.tsx
const slugify = (text: string): string => {
  // // Match "Chapter ", followed by digits, followed by ":" at the start
  // const match = text.trim().match(/^Chapter\\s+(\\d+):/i); 
  // if (match && match[1]) {
  //   return match[1]; // Return just the number, e.g., "6"
  // }
  
  // // Fallback for titles that DON'T match "Chapter N:" (like Bibliography)
  // // Use the standard slugification logic here
  // return text
  //   .toLowerCase()
  //   .replace(/\s+/g, '-')
  //   .replace(/[^\w\-]+/g, '') // Keep word chars and hyphens
  //   .replace(/\-\-+/g, '-')   // Collapse multiple hyphens
  //   .replace(/^-+/, '')       // Trim leading hyphen
  //   .replace(/-+$/, '');      // Trim trailing hyphen

  // Revert to the general purpose slugify logic
   return text
    .toLowerCase()
    .replace(/\s+/g, '-')       // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '') // Keep word chars and hyphens
    .replace(/\-\-+/g, '-')      // Collapse multiple hyphens
    .replace(/^-+/, '')          // Trim leading hyphen
    .replace(/-+$/, '');         // Trim trailing hyphen
};

const HomePage: React.FC = () => {
  return (
    <div className="bg-[#F8FAFC]">
      {/* Hero Section */}
      <section className="py-24 text-center bg-gradient-to-b from-[#F8FAFC] to-white">
        <h1 className="text-5xl font-bold mb-4">
          MicroPlastic<span className="text-[#3B82F6]">Pulse</span>
        </h1>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          A living whitepaper on the growing threat of microplastics to human health and wellbeing
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/whitepaper" className="bg-[#3B82F6] text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors no-underline">
            <CircleDot size={20} />
            Read Whitepaper
          </Link>
          <Link to="/latest-news" className="bg-white text-gray-800 px-6 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors no-underline">
            Latest News
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-4">
             <Newspaper className="text-blue-500" size={20} />
           </div>
           <h3 className="text-xl font-semibold mb-2">Featured News Story 1</h3>
           <p className="text-gray-600">
             Summary of the first featured news story will go here. Click 'Latest News' to see all updates.
           </p>
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-4">
             <Newspaper className="text-blue-500" size={20} />
           </div>
           <h3 className="text-xl font-semibold mb-2">Featured News Story 2</h3>
           <p className="text-gray-600">
             Summary of the second featured news story will go here. Stay informed on recent developments.
           </p>
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-4">
             <Newspaper className="text-blue-500" size={20} />
           </div>
           <h3 className="text-xl font-semibold mb-2">Featured News Story 3</h3>
           <p className="text-gray-600">
             Summary of the third featured news story. The latest findings and articles updated regularly.
           </p>
         </div>
      </section>

      {/* Whitepaper Sections (Homepage version - Links) */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-2">The Whitepaper</h2>
        <p className="text-gray-600 text-center mb-12">
          Explore our comprehensive analysis of microplastics, their impact on human health, and prevention strategies.
        </p>
        <div className="space-y-4">
          {chapterTitles.map((title, index) => {
            const anchorId = slugify(title); // Generate the ID (should be just the number)
            // Link to the whitepaper page, using only the chapter number as the hash
            return (
              <Link to={`/whitepaper#${anchorId}`} key={index} className="block no-underline">
                <WhitepaperSection 
                  title={title} // Display the full title
                />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default HomePage; 