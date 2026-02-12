import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import loginBg from '@/assets/login-bg.jpg';
import appIcon from '@/assets/app-icon.png';

const LoginPage = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);

  // Redirect when authenticated
  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'tecnico') {
        navigate('/tech', { replace: true });
      } else {
        navigate('/manager', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(email, password);

    if (!success) {
      setLoading(false);
      setError('E-mail ou senha inválidos');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
    // If success, the useEffect above will handle navigation once user state updates
  };

  // Signup via app foi desativado; usuários são criados apenas por administradores.

  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={loginBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 brand-gradient opacity-85" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg overflow-hidden">
              <img src={appIcon} alt="Stellar Print" className="w-full h-full" />
            </div>
            <span className="text-lg font-bold tracking-tight">Stellar Print</span>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Gestão Técnica<br />
              <span className="font-light opacity-90">inteligente e eficiente</span>
            </h1>
            <p className="text-lg opacity-80 leading-relaxed">
              Gerencie ordens de serviço, acompanhe técnicos em campo e garanta a melhor experiência para seus clientes.
            </p>
          </div>

          <div className="flex gap-8">
            {[
              { value: '2.4k+', label: 'OS concluídas' },
              { value: '98%', label: 'Satisfação' },
              { value: '45min', label: 'Tempo médio' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm opacity-70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-lg overflow-hidden">
              <img src={appIcon} alt="Stellar Print" className="w-full h-full" />
            </div>
            <span className="text-lg font-bold tracking-tight">Stellar Print</span>
          </div>

          <h2 className="text-2xl font-bold mb-1">
            Bem-vindo de volta
          </h2>
          <p className="text-muted-foreground mb-8">
            Entre com suas credenciais para continuar
          </p>

          <form onSubmit={handleLogin} className={`space-y-5 ${shaking ? 'animate-shake' : ''}`}>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Senha</Label>
                {!isSignup && (
                  <button type="button" className="text-xs text-accent hover:underline">
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 brand-gradient text-primary-foreground font-semibold"
              disabled={loading}
            >
              {loading ? (isSignup ? 'Criando...' : 'Entrando...') : (isSignup ? 'Criar Conta' : 'Entrar')}
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>

          {/* Signup disabled - users created by admin only */}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
