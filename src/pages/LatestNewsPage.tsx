import React from 'react';

const LatestNewsPage: React.FC = () => {
  // Placeholder for news items
  const newsItems = [
    {
      id: 'news-3',
      date: '2024-08-15',
      title: 'New Study Links Microplastic Exposure to Gut Inflammation',
      summary: 'Researchers find correlation between high levels of ingested microplastics and markers of intestinal inflammation...',
      link: '#',
    },
    {
      id: 'news-2',
      date: '2024-07-28',
      title: 'Airborne Microplastics: A Growing Concern in Urban Areas',
      summary: 'Recent measurements show increasing concentrations of airborne microplastics in major cities, raising respiratory health questions...',
      link: '#',
    },
    {
      id: 'news-1',
      date: '2024-06-10',
      title: 'Innovative Filter Technology Shows Promise for Removing Microplastics from Water',
      summary: 'A new filtration system demonstrates over 99% efficiency in removing microplastic particles down to 1 micron...',
      link: '#',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Latest News</h1>
      <div className="space-y-6">
        {newsItems.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">{new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
            <p className="text-gray-700 mb-3">{item.summary}</p>
            <a 
              href={item.link} 
              className="text-blue-600 hover:text-blue-800 font-medium"
              target="_blank" 
              rel="noopener noreferrer"
            >
              Read More
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LatestNewsPage; 