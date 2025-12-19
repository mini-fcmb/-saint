// hooks/useAuthInitialization.ts
import { useEffect } from 'react';
import { useFirebaseStore } from '../stores/useFirebaseStore';

export const useAuthInitialization = () => {
  const initializeAuth = useFirebaseStore((state) => state.initializeAuth);
  const authInitialized = useFirebaseStore((state) => state.authInitialized);
  const loading = useFirebaseStore((state) => state.loading);
  const user = useFirebaseStore((state) => state.user);
  
  useEffect(() => {
    // Initialize auth on mount
    const cleanup = initializeAuth();
    
    // Clean up on unmount
    return cleanup;
  }, [initializeAuth]);
  
  return {
    authInitialized,
    loading,
    user,
    isReady: authInitialized && !loading,
  };
};
