import React, { useState } from 'react';
import { ChevronDown, BookOpen, Brain, Heart, Droplets, Factory, Users, FileText, Link2, ChevronRight } from 'lucide-react';

interface SectionItem {
  id: string;
  title: string;
  isNew?: boolean;
  isUpdated?: boolean;
  subsections?: { id: string; title: string; isNew?: boolean; isUpdated?: boolean }[];
}

const Sidebar: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['health-impacts']);

  const toggleSection = (id: string) => {
    if (expandedSections.includes(id)) {
      setExpandedSections(expandedSections.filter((sectionId) => sectionId !== id));
    } else {
      setExpandedSections([...expandedSections, id]);
    }
  };

  const sections: SectionItem[] = [
    {
      id: 'introduction',
      title: 'Introduction to Microplastics',
      icon: BookOpen,
    },
    {
      id: 'health-impacts',
      title: 'Health Impacts',
      icon: Brain,
      subsections: [
        { id: 'digestive-system', title: 'Digestive System', isNew: true },
        { id: 'respiratory-system', title: 'Respiratory System' },
        { id: 'circulation', title: 'Circulation & Blood' },
        { id: 'endocrine-system', title: 'Endocrine System', isUpdated: true },
        { id: 'neurological-impacts', title: 'Neurological Impacts' },
      ],
    },
    {
      id: 'prevention',
      title: 'Prevention & Avoidance',
      icon: Heart,
      subsections: [
        { id: 'drinking-water', title: 'Drinking Water' },
        { id: 'food-sources', title: 'Food Sources' },
        { id: 'air-quality', title: 'Air Quality' },
        { id: 'personal-care', title: 'Personal Care Products' },
      ],
    },
    {
      id: 'environmental-impact',
      title: 'Environmental Impact',
      icon: Droplets,
    },
    {
      id: 'sources',
      title: 'Sources & Production',
      icon: Factory,
    },
    {
      id: 'research',
      title: 'Latest Research',
      icon: FileText,
      isUpdated: true,
    },
    {
      id: 'expert-opinions',
      title: 'Expert Opinions',
      icon: Users,
    },
    {
      id: 'resources',
      title: 'Resources & Links',
      icon: Link2,
    },
  ];

  return (
    <aside className="hidden md:block w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto transition-all duration-300">
      <div className="mb-6">
        <h2 className="text-sm uppercase font-semibold text-gray-500 tracking-wider mb-2">Table of Contents</h2>
        <div className="space-y-1">
          {sections.map((section) => (
            <div key={section.id} className="mb-2">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <div className="flex items-center">
                  <span className="mr-2 text-blue-600">
                    {section.icon && <section.icon size={18} />}
                  </span>
                  <span className="font-medium text-sm">{section.title}</span>
                  {section.isNew && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">New</span>
                  )}
                  {section.isUpdated && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">Updated</span>
                  )}
                </div>
                <span>
                  {section.subsections ? (
                    expandedSections.includes(section.id) ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )
                  ) : null}
                </span>
              </button>
              
              {section.subsections && expandedSections.includes(section.id) && (
                <div className="pl-7 mt-1 space-y-1">
                  {section.subsections.map((subsection) => (
                    <a
                      key={subsection.id}
                      href={`#${subsection.id}`}
                      className="block p-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-blue-600 rounded-md transition-colors"
                    >
                      <div className="flex items-center">
                        <span>{subsection.title}</span>
                        {subsection.isNew && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">New</span>
                        )}
                        {subsection.isUpdated && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">Updated</span>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm uppercase font-semibold text-gray-500 tracking-wider mb-3">Stay Updated</h3>
        <form className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email address</label>
            <input 
              type="email" 
              placeholder="your@email.com" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex items-start">
            <input 
              id="consent" 
              type="checkbox" 
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              required
            />
            <label htmlFor="consent" className="ml-2 text-xs text-gray-500">
              I agree to receive email updates about new research and content.
            </label>
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors text-sm font-medium"
          >
            Subscribe
          </button>
        </form>
      </div>
    </aside>
  );
};

export default Sidebar;