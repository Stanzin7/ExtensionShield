import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Check for existing session and subscribe to auth changes on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for existing session
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChange((user, event) => {
      setUser(user);
      // Handle different auth events if needed
      console.log("Auth event:", event);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const result = await authService.signInWithGoogle();
      // With Supabase OAuth, the user will be set via onAuthStateChange
      // after redirect callback, so we just close the modal
      setIsSignInModalOpen(false);
      return result;
    } catch (error) {
      setAuthError(error.message);
      setIsLoading(false);
      throw error;
    }
  }, []);

  const signInWithEmail = useCallback(async (email, password) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const user = await authService.signInWithEmail(email, password);
      setUser(user);
      setIsSignInModalOpen(false);
      return user;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUpWithEmail = useCallback(async (email, password, name) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const user = await authService.signUpWithEmail(email, password, name);
      setUser(user);
      setIsSignInModalOpen(false);
      return user;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openSignInModal = useCallback(() => {
    setAuthError(null);
    setIsSignInModalOpen(true);
  }, []);

  const closeSignInModal = useCallback(() => {
    setAuthError(null);
    setIsSignInModalOpen(false);
  }, []);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    authError,
    isSignInModalOpen,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    openSignInModal,
    closeSignInModal,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;





