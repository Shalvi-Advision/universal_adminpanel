import type { ReactNode } from 'react';
import type { StoreCode } from 'src/types/api';

import { useRef, useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import { usePathname } from 'src/routes/hooks';

import { getAllStoreCodes } from 'src/services/stores';

// Context type definition
interface StoreCodeContextType {
  storeCode: string | null;
  setStoreCode: (code: string | null) => void;
  storeCodes: StoreCode[];
  isLoading: boolean;
  error: string;
}

// Create context with default values
const StoreCodeContext = createContext<StoreCodeContextType>({
  storeCode: null,
  setStoreCode: () => {},
  storeCodes: [],
  isLoading: true,
  error: '',
});

// Custom hook to use the context
export const useStoreCode = () => {
  const context = useContext(StoreCodeContext);
  if (!context) {
    throw new Error('useStoreCode must be used within StoreCodeProvider');
  }
  return context;
};

// Provider component props
interface StoreCodeProviderProps {
  children: ReactNode;
}

// LocalStorage key
const STORAGE_KEY = 'selected_store_code';

function readSavedStoreCode(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error loading store code from localStorage:', error);
    return null;
  }
}

// The store-codes endpoint is authenticated: calling it before sign-in returns
// 401, which the api client turns into a logout redirect.
function isSignedIn(): boolean {
  try {
    return Boolean(sessionStorage.getItem('authToken'));
  } catch {
    return false;
  }
}

// Provider component
export function StoreCodeProvider({ children }: StoreCodeProviderProps) {
  const [storeCode, setStoreCodeState] = useState<string | null>(readSavedStoreCode);
  const [storeCodes, setStoreCodes] = useState<StoreCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const pathname = usePathname();
  const hasFetched = useRef(false);

  // Update store code and persist to localStorage
  const setStoreCode = useCallback((code: string | null) => {
    setStoreCodeState(code);
    try {
      if (code) {
        localStorage.setItem(STORAGE_KEY, code);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error_) {
      console.error('Error saving store code to localStorage:', error_);
    }
  }, []);

  // Load the tenant's store codes once per project (the provider is remounted on
  // client switch). Sign-in is a client-side navigation, so pathname is the
  // trigger that re-runs this once the auth token exists.
  useEffect(() => {
    if (hasFetched.current) return undefined;

    if (!isSignedIn()) {
      setIsLoading(false);
      return undefined;
    }

    // Guarded by a ref rather than an effect-cleanup flag: under StrictMode the
    // effect is mounted twice, and cancelling the first run would discard the
    // only request the guard lets through.
    hasFetched.current = true;

    const fetchStoreCodes = async () => {
      try {
        setIsLoading(true);
        setError('');

        const response = await getAllStoreCodes();

        const list = response.success && Array.isArray(response.data) ? response.data : [];
        setStoreCodes(list);

        if (list.length === 1) {
          // Only one store code exists — there is nothing to choose, so select it.
          setStoreCode(list[0].store_code);
        } else if (list.length > 1) {
          // Drop a persisted selection that no longer exists for this tenant.
          const saved = readSavedStoreCode();
          if (saved && !list.some((store) => store.store_code === saved)) {
            setStoreCode(null);
          }
        }
      } catch (err: any) {
        hasFetched.current = false; // allow a retry on the next navigation
        setError(err?.message || 'Failed to load store codes');
        console.error('Error fetching store codes:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreCodes();
    return undefined;
  }, [pathname, setStoreCode]);

  const value = useMemo(
    () => ({ storeCode, setStoreCode, storeCodes, isLoading, error }),
    [storeCode, setStoreCode, storeCodes, isLoading, error]
  );

  return <StoreCodeContext.Provider value={value}>{children}</StoreCodeContext.Provider>;
}
