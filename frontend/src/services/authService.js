/**
 * Authentication Service
 * Handles authentication using Supabase
 * Supports OAuth (Google/Gmail) and email/password authentication
 */

import supabase from "./supabaseClient";

/**
 * Get current authenticated user
 */
const getCurrentUser = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? formatUser(user) : null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

/**
 * Format Supabase user object to our standard format
 */
const formatUser = (supabaseUser) => {
  if (!supabaseUser) return null;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || "User",
    avatar: supabaseUser.user_metadata?.avatar_url || null,
    provider: supabaseUser.user_metadata?.provider || "email",
    createdAt: supabaseUser.created_at,
  };
};

/**
 * Sign in with Google OAuth (Gmail)
 * @see https://supabase.com/docs/guides/auth/oauth-providers/google
 */
const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;

    // Note: After successful OAuth, user will be redirected
    // Session will be restored automatically via redirect callback
    return data;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw new Error(error.message || "Failed to sign in with Google");
  }
};

/**
 * Get stored auth token
 */
const getAuthToken = async () => {
  try {
    const session = await getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

/**
 * Get current session
 */
const getSession = async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
};

/**
 * Sign in with email and password
 */
const signInWithEmail = async (email, password) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return formatUser(data.user);
  } catch (error) {
    console.error("Email sign-in error:", error);
    throw new Error(error.message || "Failed to sign in");
  }
};

/**
 * Sign up with email and password
 */
const signUpWithEmail = async (email, password, name) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split("@")[0],
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;

    // Supabase returns user but might need email verification
    if (data.user) {
      return formatUser(data.user);
    }

    throw new Error("Sign up failed");
  } catch (error) {
    console.error("Email sign-up error:", error);
    throw new Error(error.message || "Failed to sign up");
  }
};

/**
 * Sign out the current user
 */
const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error("Sign out error:", error);
    throw new Error(error.message || "Failed to sign out");
  }
};

/**
 * Subscribe to auth state changes
 * Returns unsubscribe function
 */
const onAuthStateChange = (callback) => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user ? formatUser(session.user) : null;
    callback(user, event);
  });

  return subscription?.unsubscribe || (() => {});
};

const authService = {
  getCurrentUser,
  getSession,
  getAuthToken,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  onAuthStateChange,
};

export default authService;





