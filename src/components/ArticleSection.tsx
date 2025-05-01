import React from 'react';
import { Clock } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

interface ArticleSectionProps {
  id: string;
  title: string;
  content: string;
  isNew?: boolean;
  isUpdated?: boolean;
  updateDate?: string;
}

const ArticleSection: React.FC<ArticleSectionProps> = ({ 
  id, 
  title, 
  content, 
  isNew = false, 
  isUpdated = false, 
  updateDate 
}) => {
  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <div className="flex items-center mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        {isNew && (
          <span className="ml-3 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
            New Content
          </span>
        )}
        {isUpdated && (
          <span className="ml-3 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium flex items-center">
            <Clock size={12} className="mr-1" />
            Updated {updateDate ? formatDate(new Date(updateDate)) : 'Recently'}
          </span>
        )}
      </div>
      <div 
        className="prose prose-blue max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </section>
  );
};

export default ArticleSection;