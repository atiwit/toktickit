import React, { createContext, useContext, useState, type ReactNode } from 'react';

export interface Requester {
  id: number;
  name: string;
  email: string;
}

interface RequesterContextType {
  selectedRequester: Requester | null;
  changeRequester: (requester: Requester | null) => void;
}

export const RequesterContext = createContext<RequesterContextType | undefined>(undefined);

export const RequesterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedRequester, setSelectedRequester] = useState<Requester | null>(() => {
    // Optionally load from localStorage here to persist across refreshes
    const stored = localStorage.getItem('selectedRequester');
    return stored ? JSON.parse(stored) : null;
  });

  const changeRequester = (requester: Requester | null) => {
    setSelectedRequester(requester);
    if (requester) {
      localStorage.setItem('selectedRequester', JSON.stringify(requester));
    } else {
      localStorage.removeItem('selectedRequester');
    }
  };

  return (
    <RequesterContext.Provider value={{ selectedRequester, changeRequester }}>
      {children}
    </RequesterContext.Provider>
  );
};

export const useRequester = () => {
  const context = useContext(RequesterContext);
  if (context === undefined) {
    throw new Error('useRequester must be used within a RequesterProvider');
  }
  return context;
};
