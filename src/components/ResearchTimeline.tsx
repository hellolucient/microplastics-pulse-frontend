import React from 'react';
import { Clock, FileText, Users, Link } from 'lucide-react';

interface TimelineItem {
  id: string;
  date: string;
  title: string;
  institution: string;
  summary: string;
  link: string;
  isNew?: boolean;
}

const ResearchTimeline: React.FC = () => {
  const timelineItems: TimelineItem[] = [
    {
      id: 'study-8',
      date: '2025-05-02',
      title: 'Nanoplastics Found in Human Brain Tissue',
      institution: 'University of Vienna',
      summary: 'Researchers detected nanoplastic particles in human brain tissue samples for the first time, raising concerns about potential neurological effects.',
      link: '#',
      isNew: true,
    },
    {
      id: 'study-7',
      date: '2025-03-15',
      title: 'Microplastic Interaction with Gut Microbiome',
      institution: 'Stanford University',
      summary: 'New study reveals how certain microplastics can alter gut bacteria composition, potentially contributing to inflammatory conditions.',
      link: '#',
      isNew: true,
    },
    {
      id: 'study-6',
      date: '2025-01-22',
      title: 'Effective Filtration Methods for Removing Microplastics from Drinking Water',
      institution: 'ETH Zurich',
      summary: 'Researchers evaluated various filtration technologies for their effectiveness in removing different types and sizes of microplastics from drinking water.',
      link: '#',
    },
    {
      id: 'study-5',
      date: '2024-11-10',
      title: 'Microplastics in Food Chain: From Soil to Plants',
      institution: 'Wageningen University',
      summary: 'This study traced the movement of microplastics from agricultural soils into food crops, providing evidence of bioaccumulation in plant tissues.',
      link: '#',
    },
    {
      id: 'study-4',
      date: '2024-09-05',
      title: 'Airborne Microplastics in Urban Environments',
      institution: 'Imperial College London',
      summary: 'Study quantified the concentration of airborne microplastics in various urban settings and assessed potential respiratory exposure.',
      link: '#',
    },
    {
      id: 'study-3',
      date: '2024-07-18',
      title: 'Endocrine Disrupting Effects of Common Plastic Additives',
      institution: 'Harvard T.H. Chan School of Public Health',
      summary: 'Research identified several plastic additives that can function as endocrine disruptors at concentrations found in human blood samples.',
      link: '#',
    },
    {
      id: 'study-2',
      date: '2024-05-20',
      title: 'Placental Transfer of Microplastics During Pregnancy',
      institution: 'University of California, San Francisco',
      summary: 'This study provided the first evidence of microplastic particles crossing the placental barrier, raising concerns about fetal exposure.',
      link: '#',
    },
    {
      id: 'study-1',
      date: '2024-03-02',
      title: 'Global Assessment of Microplastic Contamination in Drinking Water',
      institution: 'World Health Organization',
      summary: 'Comprehensive review of microplastic contamination in drinking water sources worldwide, including bottled and tap water.',
      link: '#',
    },
  ];

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 h-full w-0.5 bg-blue-200" aria-hidden="true"></div>
      
      <div className="space-y-8">
        {timelineItems.map((item) => (
          <div key={item.id} className="relative">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center z-10 border-4 border-white shadow">
                <FileText size={15} className="text-white" />
              </div>
              
              <div className="ml-4 bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex-1 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock size={14} className="mr-1" />
                    <span>{new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  {item.isNew && (
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full font-medium">
                      New
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                
                <div className="flex items-center text-sm text-gray-600 mb-3">
                  <Users size={14} className="mr-1" />
                  <span>{item.institution}</span>
                </div>
                
                <p className="text-gray-700 mb-3">{item.summary}</p>
                
                <a 
                  href={item.link}
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  <span>Read full study</span>
                  <Link size={14} className="ml-1" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResearchTimeline;