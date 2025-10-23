import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from 'next-themes';

const LoginPage = () => {
  const { theme } = useTheme(); // Get current theme from next-themes

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
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                  // Adjust other colors to match your theme if needed
                  // For example, if you want to match shadcn's dark mode:
                  // inputBackground: theme === 'dark' ? 'hsl(var(--input))' : 'hsl(var(--background))',
                  // defaultButtonBackground: theme === 'dark' ? 'hsl(var(--primary))' : 'hsl(var(--primary))',
                  // defaultButtonText: theme === 'dark' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--primary-foreground))',
                },
              },
            },
          }}
          theme={theme === 'dark' ? 'dark' : 'light'} // Pass the current theme to Auth UI
          redirectTo={window.location.origin} // Redirects to the current origin after auth
        />
      </div>
    </div>
  );
};

export default LoginPage;