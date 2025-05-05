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
        "group rounded-lg p-3 transition-colors duration-150 cursor-pointer",
        isActive 
          ? "bg-blue-50 border border-blue-200"
          : "border border-transparent hover:bg-slate-100"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isActive ? (
            <CheckCircle2 size={18} className="text-blue-600 flex-shrink-0" />
          ) : (
            <CircleDot size={18} className="text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
          )}
          <h3 className={clsx(
              "text-sm",
              isActive ? "font-semibold text-blue-700" : "font-medium text-slate-700 group-hover:text-slate-900"
             )}>
              {title}
            </h3>
          {isUpdated && (
            <span className={clsx(
              "ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium",
              isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
            )}>
              Upd
            </span>
          )}
        </div>
        {date && !isActive && (
          <div className="flex items-center gap-1 text-slate-400 text-sm flex-shrink-0 ml-2">
            <span>{date}</span>
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        )}
      </div>
    </div>
  );
};

export default WhitepaperSection;