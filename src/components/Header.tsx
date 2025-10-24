import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Import Input component
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

const Header = () => {
  const { user, isLoading } = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Left section: Home and MeeTube */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-lg">MeeTube</span>
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
          <Button variant="ghost" size="icon" className="md:hidden">
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
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('Switch Account clicked')}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Switch Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('MeeTube Studio clicked')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>MeeTube Studio</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('Settings clicked')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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