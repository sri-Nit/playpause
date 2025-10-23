"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';

const AuthPage = () => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-140px)] p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-foreground">Welcome to MeeTube</h1>
        <p className="text-center text-muted-foreground">Sign in or create an account to continue.</p>
        <Auth
          supabaseClient={supabase}
          providers={[]} // You can add 'google', 'github', etc. here if configured in Supabase
          appearance={{
            theme: ThemeSupa,
          }}
          theme="light" // Defaulting to light theme after removing toggle
          redirectTo={window.location.origin} // Redirects to the current origin after auth
        />
      </div>
    </div>
  );
};

export default AuthPage;