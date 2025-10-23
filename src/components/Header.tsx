import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Upload, Search, Bell, User } from 'lucide-react';
import ThemeToggle from './ThemeToggle'; // Import ThemeToggle

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        {/* Left section: Home and MeeTube */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2">
            <span className="inline-block font-bold text-lg">MeeTube</span>
          </Link>
          <Link to="/" className="hidden sm:inline-block text-sm font-medium text-muted-foreground hover:text-foreground">
            Home
          </Link>
        </div>

        {/* Right section: Upload, Search, Notifications, Account, Theme Toggle */}
        <nav className="flex items-center space-x-2 sm:space-x-4">
          <Link to="/upload">
            <Button variant="ghost" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload Video</span>
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>
          <Button variant="ghost" size="icon">
            <User className="h-4 w-4" />
            <span className="sr-only">Account</span>
          </Button>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
};

export default Header;