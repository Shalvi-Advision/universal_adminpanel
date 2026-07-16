import type { ReactNode } from 'react';

import { useState, useContext, useCallback, createContext } from 'react';

import {
  DEFAULT_PROJECT_CODE,
  getSelectedProjectCode,
  PROJECT_CODE_STORAGE_KEY,
} from 'src/utils/project-code';

// Context type definition
interface ProjectContextType {
  projectCode: string;
  setProjectCode: (code: string) => void;
}

// Create context with default values
const ProjectContext = createContext<ProjectContextType>({
  projectCode: DEFAULT_PROJECT_CODE,
  setProjectCode: () => {},
});

// Custom hook to use the context
export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
};

// Provider component props
interface ProjectProviderProps {
  children: ReactNode;
}

// Provider component
export function ProjectProvider({ children }: ProjectProviderProps) {
  const [projectCode, setProjectCodeState] = useState<string>(getSelectedProjectCode);

  // Update project code, persist it and reset the store selection —
  // store codes belong to the previous client and are no longer valid.
  const setProjectCode = useCallback((code: string) => {
    try {
      localStorage.setItem(PROJECT_CODE_STORAGE_KEY, code);
      localStorage.removeItem('selected_store_code');
    } catch (error) {
      console.error('Error saving project code to localStorage:', error);
    }
    setProjectCodeState(code);
  }, []);

  const value = {
    projectCode,
    setProjectCode,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}
