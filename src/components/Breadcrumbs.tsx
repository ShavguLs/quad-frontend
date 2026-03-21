import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-2 text-sm ${className}`}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            {item.path && !isLast ? (
              <Link
                to={item.path}
                className="font-black uppercase text-xs tracking-wider text-gray-500 hover:text-[#FFFF2E] transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`font-black uppercase text-xs tracking-wider ${
                  isLast ? 'text-white' : 'text-gray-500'
                }`}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}

            {!isLast && (
              <ChevronRight className="w-3 h-3 text-gray-700" aria-hidden="true" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
