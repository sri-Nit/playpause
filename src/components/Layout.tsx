import React from 'react';
import Header from './Header';
import { MadeWithDyad } from './made-with-dyad';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto py-6 px-4">
        {children}
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Layout;