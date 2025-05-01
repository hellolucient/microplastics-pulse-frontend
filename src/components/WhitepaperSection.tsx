import React from 'react';
import { ChevronRight, CircleDot } from 'lucide-react';
import clsx from 'clsx';

interface WhitepaperSectionProps {
  title: string;
  date?: string;
  isUpdated?: boolean;
}

const WhitepaperSection: React.FC<WhitepaperSectionProps> = ({
  title,
  date,
  isUpdated
}) => {
  return (
    <div className="group bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-200 transition-colors cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CircleDot size={20} className="text-blue-500" />
          <h3 className="font-medium">{title}</h3>
          {isUpdated && (
            <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
              Updated
            </span>
          )}
        </div>
        {date && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span>{date}</span>
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </div>
    </div>
  );
};

export default WhitepaperSection;