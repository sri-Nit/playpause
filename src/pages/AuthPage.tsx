import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const AuthPage = () => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-140px)] p-4 bg-background">
      <div className="w-full max-w-md p-6 space-y-6 bg-card rounded-lg shadow-lg border border-border">
        <h1 className="text-3xl font-bold text-center text-foreground">Welcome to PlayPause</h1>
        <p className="text-center text-muted-foreground">Sign in or create an account to continue.</p>
        <Auth
          supabaseClient={supabase}
          providers={[]}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--accent))',
                  brandAccent: 'hsl(var(--accent-foreground))',
                  inputBackground: 'hsl(var(--background))',
                  inputBorder: 'hsl(var(--border))',
                  inputBorderHover: 'hsl(var(--ring))',
                  inputBorderFocus: 'hsl(var(--ring))',
                  inputText: 'hsl(var(--foreground))',
                  inputLabel: 'hsl(var(--muted-foreground))',
                  messageBackground: 'hsl(var(--destructive))',
                  messageText: 'hsl(var(--destructive-foreground))',
                  messageActionText: 'hsl(var(--destructive-foreground))',
                  anchorText: 'hsl(var(--accent))',
                  anchorHoverText: 'hsl(var(--accent))',
                },
              },
            },
          }}
          theme="light"
          redirectTo={window.location.origin}
          view="sign_in"
        />
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accent hover:underline transition-colors duration-200">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;