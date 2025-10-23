"use client";

import React from 'react'; // Explicitly import React

const LoginPage = () => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-140px)] p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-foreground">Login Page Test</h1>
        <p className="text-center text-muted-foreground">If you see this, JSX parsing is working!</p>
      </div>
    </div>
  );
};

export default LoginPage;