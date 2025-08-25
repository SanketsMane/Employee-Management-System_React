import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import NotificationDropdown from './notifications/NotificationDropdown';
import BugReportDialog from './BugReportDialog';
import { 
  Sun, 
  Moon, 
  Bell, 
  User, 
  LogOut, 
  Settings,
  ChevronDown,
  Bug
} from 'lucide-react';
import { cn } from '../lib/utils';

const Navbar = () => {
  const { user, logout, darkMode, toggleDarkMode } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBugReportDialog, setShowBugReportDialog] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Update time every minute
  const [currentTime, setCurrentTime] = React.useState(formatTime());
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(formatTime());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Date and Time */}
        <div className="flex items-center gap-6">
          <div className="hidden md:block">
            <p className="text-sm font-medium">{formatDate()}</p>
            <p className="text-xs text-muted-foreground">{currentTime}</p>
          </div>
        </div>

        {/* Right side - Actions and User Menu */}
        <div className="flex items-center gap-4">
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="h-9 w-9"
          >
            {darkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Bug Report Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowBugReportDialog(true)}
            className="h-9 w-9"
            title="Report a Bug"
          >
            <Bug className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <NotificationDropdown />

          {/* User Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 px-3"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-3 w-3 text-primary" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-md shadow-lg z-50">
                <div className="p-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user?.role} • {user?.employeeId}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <button className="flex items-center gap-2 w-full px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm">
                    <User className="h-4 w-4" />
                    Profile
                  </button>
                  <button className="flex items-center gap-2 w-full px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm">
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <hr className="my-2 border-border" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}

      {/* Bug Report Dialog */}
      <BugReportDialog 
        open={showBugReportDialog} 
        onOpenChange={setShowBugReportDialog}
      />
    </header>
  );
};

export default Navbar;
