"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from 'next-themes';

const AuthPage = () => {
  const { theme } = useTheme(); // Get current theme from next-themes

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-140px)] p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-foreground">Welcome to MeeTube</h1>
        <p className="text-center text-muted-foreground">Sign in or create an account to continue.</p>
        <Auth
          key={theme} {/* Add key prop to force re-render on theme change */}
          supabaseClient={supabase}
          providers={[]} // You can add 'google', 'github', etc. here if configured in Supabase
          appearance={{
            theme: ThemeSupa,
          }}
          theme={theme === 'dark' ? 'dark' : 'light'} // Pass the current theme to Auth UI
          redirectTo={window.location.origin} // Redirects to the current origin after auth
        />
      </div>
    </div>
  );
};

export default AuthPage;