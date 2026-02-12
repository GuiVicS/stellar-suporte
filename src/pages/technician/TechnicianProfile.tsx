import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AvatarUpload from '@/components/AvatarUpload';

const TechnicianProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="animate-fade-in">
      <div className="brand-gradient px-5 pt-6 pb-10 text-primary-foreground text-center">
        <div className="mx-auto mb-3">
          <AvatarUpload
            currentUrl={user?.avatar_url}
            userId={user?.user_id || ''}
            name={user?.name}
            size="lg"
          />
        </div>
        <h1 className="text-xl font-bold">{user?.name}</h1>
        <p className="text-sm opacity-70 capitalize">{user?.role}</p>
      </div>

      <div className="px-5 -mt-5 space-y-3">
        <Card className="p-4 shadow-elevated border-border/50 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-accent" />
            <span>{user?.email}</span>
          </div>
          {user?.phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-accent" />
              <span>{user.phone}</span>
            </div>
          )}
        </Card>

        <Button variant="outline" onClick={handleLogout} className="w-full h-11 text-destructive border-destructive/30">
          <LogOut className="w-4 h-4 mr-2" />
          Sair da conta
        </Button>
      </div>
    </div>
  );
};

export default TechnicianProfile;
