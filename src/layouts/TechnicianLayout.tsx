import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, Calendar, Archive, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/tech', icon: Home, label: 'Hoje', end: true },
  { to: '/tech/agenda', icon: Calendar, label: 'Agenda' },
  { to: '/tech/history', icon: Archive, label: 'Histórico' },
  { to: '/tech/profile', icon: User, label: 'Perfil' },
];

const TechnicianLayout = () => {
  const [isOnline] = React.useState(true);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 inset-x-0 bg-card border-t border-border flex items-center justify-around py-2 px-4 safe-bottom z-50">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors min-w-[56px]",
              isActive
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default TechnicianLayout;
