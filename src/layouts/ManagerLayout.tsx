import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import appIcon from '@/assets/app-icon.png';
import {
  LayoutDashboard, Calendar, Kanban, Users, BarChart3,
  LogOut, Settings, ChevronLeft, Menu, Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/manager', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/manager/agenda', icon: Calendar, label: 'Agenda' },
  { to: '/manager/kanban', icon: Kanban, label: 'Kanban' },
  { to: '/manager/customers', icon: Building2, label: 'Clientes' },
  { to: '/manager/technicians', icon: Users, label: 'Usuários' },
  { to: '/manager/reports', icon: BarChart3, label: 'Relatórios' },
];

const ManagerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-200",
        collapsed ? "w-16" : "w-60",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className={cn("flex items-center gap-2.5 px-4 h-14 border-b border-sidebar-border", collapsed && "justify-center px-2")}>
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
            <img src={appIcon} alt="Stellar Print" className="w-full h-full" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-sm font-bold text-white tracking-tight">Stellar Print</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className={cn("px-2 py-3 border-t border-sidebar-border", collapsed && "px-1")}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs text-sidebar-foreground/40 hover:bg-sidebar-accent/30 transition-colors"
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
            {!collapsed && <span>Recolher</span>}
          </button>
          
          <div className={cn("flex items-center gap-2.5 px-3 py-2 mt-1", collapsed && "justify-center px-0")}>
            <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 bg-sidebar-accent">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-white">{user?.name?.charAt(0)}</span>
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-sidebar-foreground truncate">{user?.name}</div>
                <div className="text-[10px] text-sidebar-foreground/40 capitalize">{user?.role}</div>
              </div>
            )}
            {!collapsed && (
              <button onClick={handleLogout} className="text-sidebar-foreground/30 hover:text-sidebar-foreground transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-muted-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ManagerLayout;
