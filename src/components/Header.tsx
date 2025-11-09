import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Search, Bell, User, LogOut, Settings, LayoutDashboard, Users } from 'lucide-react';
import { useSession } from './SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Removed useTheme import

const Header = () => {
  const { user, isLoading } = useSession();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  // Removed setTheme function

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm(''); // Clear search term after navigating
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Left section: Home and PlayPause */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-lg">PlayPause</span>
          </Link>
          <Link to="/" className="hidden md:inline-block text-sm font-medium text-muted-foreground hover:text-foreground">
            Home
          </Link>
        </div>

        {/* Middle section: Search Bar */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search videos..."
              className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        {/* Right section: Upload, Search (mobile), Notifications, Account */}
        <nav className="flex items-center space-x-2 md:space-x-4">
          <Link to="/upload">
            <Button variant="ghost" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden md:inline">Upload Video</span>
            </Button>
          </Link>
          {/* Mobile search icon */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={handleSearch}>
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>

          {isLoading ? (
            <Button variant="ghost" size="icon" disabled>
              <User className="h-4 w-4" />
              <span className="sr-only">Loading...</span>
            </Button>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-4 w-4" />
                  <span className="sr-only">Account Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/you')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>You</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Creator Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('Switch Account clicked')}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Switch Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('Settings clicked')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* Removed Theme Label and Theme DropdownMenuItems */}
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="icon">
                <User className="h-4 w-4" />
                <span className="sr-only">Login</span>
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;