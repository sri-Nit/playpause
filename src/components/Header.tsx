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
import { toast } from 'sonner';
import { useSound } from '@/hooks/useSound'; // Import the new hook

const Header = () => {
  const { user, isLoading } = useSession();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { play: playBellSound } = useSound('https://hpaptqudnjycydruqdpy.supabase.co/storage/v1/object/public/sounds/sound-effect.mp3', { volume: 0.2 }); // Updated URL and volume

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

  const handleNotificationsClick = () => {
    playBellSound();
    toast.info('No new notifications for now!');
    // In a real app, you'd open a notification panel or navigate to a notifications page here.
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md shadow-lg">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left section: Home and PlayPause */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2 group">
            <span className="font-extrabold text-xl text-primary group-hover:text-primary/80 transition-colors">PlayPause</span>
          </Link>
          <Link to="/" className="hidden md:inline-block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
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
              className="w-full pl-9 pr-3 py-2 rounded-full border border-input bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        {/* Right section: Upload, Search (mobile), Notifications, Account */}
        <nav className="flex items-center space-x-2 md:space-x-4">
          <Link to="/upload">
            <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors rounded-full px-3 py-2">
              <Upload className="h-4 w-4" />
              <span className="hidden md:inline">Upload Video</span>
            </Button>
          </Link>
          {/* Mobile search icon */}
          <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors rounded-full">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
          <Button variant="ghost" size="icon" className="hidden md:flex text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors rounded-full" onClick={handleNotificationsClick}>
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>

          {isLoading ? (
            <Button variant="ghost" size="icon" disabled className="rounded-full">
              <User className="h-4 w-4" />
              <span className="sr-only">Loading...</span>
            </Button>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors">
                  <User className="h-4 w-4" />
                  <span className="sr-only">Account Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
                <DropdownMenuLabel className="text-primary">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={() => navigate('/you')} className="hover:bg-secondary/50 focus:bg-secondary/50 cursor-pointer">
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>You</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/dashboard')} className="hover:bg-secondary/50 focus:bg-secondary/50 cursor-pointer">
                  <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Creator Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('Switch Account clicked')} className="hover:bg-secondary/50 focus:bg-secondary/50 cursor-pointer">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Switch Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('Settings clicked')} className="hover:bg-secondary/50 focus:bg-secondary/50 cursor-pointer">
                  <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive hover:bg-destructive/20 focus:bg-destructive/20 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors">
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