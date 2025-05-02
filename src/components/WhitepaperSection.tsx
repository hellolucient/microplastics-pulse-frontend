import React from 'react';
import { ChevronRight, CircleDot, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

interface WhitepaperSectionProps {
  title: string;
  date?: string;
  isUpdated?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

const WhitepaperSection: React.FC<WhitepaperSectionProps> = ({
  title,
  date,
  isUpdated,
  isActive,
  onClick
}) => {
  return (
    <div 
      className={clsx(
        "group bg-white rounded-xl border p-4 transition-colors cursor-pointer",
        isActive ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-200"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isActive ? (
            <CheckCircle2 size={20} className="text-blue-600" />
          ) : (
            <CircleDot size={20} className={clsx(isActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-500")} />
          )}
          <h3 className={clsx("font-medium", isActive ? "text-blue-700" : "text-gray-900")}>{title}</h3>
          {isUpdated && (
            <span className={clsx(
              "text-xs px-2 py-0.5 rounded-full",
              isActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
            )}>
              Updated
            </span>
          )}
        </div>
        {date && !isActive && (
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