import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Auth Callback Page
 * This page handles the OAuth redirect from Supabase
 * After successful OAuth, Supabase redirects here with the session
 * The AuthContext will automatically detect the session via onAuthStateChange
 */
const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Small delay to ensure auth state is updated
    const timer = setTimeout(() => {
      navigate("/", { replace: true });
    }, 500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="auth-callback">
      <div className="loading-container">
        <div className="spinner" />
        <p>Completing sign in...</p>
      </div>
      <style>{`
        .auth-callback {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .loading-container {
          text-align: center;
          color: white;
        }
        .spinner {
          width: 40px;
          height: 40px;
          margin: 0 auto 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        p {
          font-size: 16px;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default AuthCallbackPage;
