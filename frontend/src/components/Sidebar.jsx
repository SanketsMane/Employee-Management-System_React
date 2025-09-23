import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Clock, 
  FileText, 
  Calendar, 
  User, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
  Trophy,
  Building2,
  CheckCircle,
  UserCheck,
  ClipboardList,
  Timer,
  Bug,
  Megaphone,
  MessageSquare
} from 'lucide-react';
import { cn } from '../lib/utils';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, isAdmin, isHR, isManager, isTeamLead } = useAuth();
  const location = useLocation();

  const navigationItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['all']
    },
    {
      title: 'Attendance',
      href: '/attendance',
      icon: Clock,
      roles: ['all']
    },
    {
      title: 'Work Sheet',
      href: '/worksheets',
      icon: FileText,
      roles: ['all']
    },
    {
      title: 'Task Sheet',
      href: '/task-sheet',
      icon: ClipboardList,
      roles: ['Employee', 'Team Lead', 'Manager', 'HR', 'Software developer trainee', 'Associate software developer', 'Full stack developer', 'Dot net developer', 'UI UX designer', 'Flutter developer', 'React native developer', 'Java developer']
    },
    {
      title: 'Leaves',
      href: '/leaves',
      icon: Calendar,
      roles: ['all']
    },
    {
      title: 'Overtime',
      href: '/overtime',
      icon: Timer,
      roles: ['all']
    },
    {
      title: 'Announcements',
      href: '/announcements',
      icon: Megaphone,
      roles: ['all']
    },
    {
      title: 'Messages',
      href: '/chat',
      icon: MessageSquare,
      roles: ['all']
    },
    {
      title: 'Profile',
      href: '/profile',
      icon: User,
      roles: ['all']
    },
    // no need of this option as we already have team option to control team members
    // {
    //   title: 'Team Management',
    //   href: '/teams',
    //   icon: Users,
    //   roles: ['Manager', 'Team Lead', 'HR', 'Admin']
    // },
    {
      title: 'Team',
      href: '/team',
      icon: Users,
      roles: ['Manager', 'Team Lead', 'HR', 'Admin']
    },
    {
      title: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      roles: ['Admin', 'HR']
    },
    {
      title: 'Leaderboard',
      href: '/leaderboard',
      icon: Trophy,
      roles: ['Admin', 'HR']
    },
    {
      title: 'Company',
      href: '/company',
      icon: Building2,
      roles: ['Admin', 'HR']
    },
    {
      title: 'Pending Approvals',
      href: '/admin/approvals',
      icon: UserCheck,
      roles: ['Admin']
    },
    {
      title: 'User Management',
      href: '/admin/users',
      icon: Users,
      roles: ['Admin']
    },
    {
      title: 'Bug Reports',
      href: '/bug-reports',
      icon: Bug,
      roles: ['all']
    },
    {
      title: 'Assigned Bugs',
      href: '/assigned-bugs',
      icon: Bug,
      roles: ['all']
    },
    {
      title: 'Manage Bug Reports',
      href: '/admin/bug-reports',
      icon: Bug,
      roles: ['Admin']
    },
    {
      title: 'Manage Announcements',
      href: '/admin/announcements',
      icon: Megaphone,
      roles: ['Admin', 'HR']
    },
    {
      title: 'Company Settings',
      href: '/company-settings',
      icon: Building2,
      roles: ['Admin']
    },
    {
      title: 'System Config',
      href: '/system-config',
      icon: Settings,
      roles: ['Admin']
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: User,
      roles: ['all']
    }
  ];

  const canAccessRoute = (roles) => {
    if (roles.includes('all')) return true;
    return roles.includes(user?.role);
  };

  const filteredNavigation = navigationItems.filter(item => canAccessRoute(item.roles));

  return (
    <div className={cn(
      "bg-card border-r border-border flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">EMS</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* User Info */}
      {!collapsed && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {Array.isArray(filteredNavigation) && filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    collapsed ? "justify-center" : ""
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            <p>Developed by</p>
            <p className="font-medium">Sanket Mane</p>
            <p>contactsanket1@gmail.com</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
