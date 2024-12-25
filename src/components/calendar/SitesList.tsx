import React from 'react';
import { Tent, ChevronDown, ChevronRight } from 'lucide-react';
import { Site } from '../../types';
import { SiteGroupContext } from '../../contexts/SiteGroupContext';

interface SitesListProps {
  sites: Site[];
}

export function SitesList({ sites }: SitesListProps) {
  const { expandedTypes, toggleType } = React.useContext(SiteGroupContext);

  // Group sites by type
  const sitesByType = React.useMemo(() => {
    const grouped = sites.reduce((acc, site) => {
      const type = site.site_type || 'rv';
      if (!acc[type]) acc[type] = [];
      acc[type].push(site);
      return acc;
    }, {} as Record<string, Site[]>);

    return grouped;
  }, [sites]);

  return (
    <div className="absolute left-0 top-0 z-20 w-[200px] bg-white">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border-b border-r border-gray-200 bg-gray-50 items-center p-3 text-left font-bold min-w-[200px]">
              <div className="flex items-center h-[44px] pl-2">
                Site
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {sites.map((site) => (
            <tr key={site.id} className="group">
              <td className="border-b border-r border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center space-x-2 h-[23px]">
                  <Tent className="h-5 w-5 text-gray-400" />
                  <div className="font-medium">
                    <div className="text-gray-900">{site.name}</div>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}