import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Site } from '../../types';
import clsx from 'clsx';

interface SiteGroupProps {
  type: 'tent' | 'rv' | 'mobile_home';
  sites: Site[];
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const siteTypeLabels = {
  tent: 'Tent Sites',
  rv: 'RV Sites',
  mobile_home: 'Mobile Home Sites'
};

export function SiteGroup({ type, sites, isExpanded, onToggle, children }: SiteGroupProps) {
  return (
    <>
      <tr>
        <td 
          colSpan={1000}
          className={clsx(
            'bg-gray-100 border-y border-gray-200 cursor-pointer hover:bg-gray-200',
            'transition-colors duration-150'
          )}
          onClick={onToggle}
        >
          <div className="flex items-center gap-2 px-4 py-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            )}
            <span className="font-medium text-gray-700">
              {siteTypeLabels[type]} ({sites.length})
            </span>
          </div>
        </td>
      </tr>
      {isExpanded && children}
    </>
  );
}