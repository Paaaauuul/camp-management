import React from 'react';

interface SiteGroupContextType {
  expandedTypes: Record<string, boolean>;
  toggleType: (type: string) => void;
}

export const SiteGroupContext = React.createContext<SiteGroupContextType>({
  expandedTypes: {},
  toggleType: () => {}
});

export function SiteGroupProvider({ children }: { children: React.ReactNode }) {
  const [expandedTypes, setExpandedTypes] = React.useState<Record<string, boolean>>({
    tent: true,
    rv: true,
    mobile_home: true
  });

  const toggleType = React.useCallback((type: string) => {
    setExpandedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  }, []);

  return (
    <SiteGroupContext.Provider value={{ expandedTypes, toggleType }}>
      {children}
    </SiteGroupContext.Provider>
  );
}