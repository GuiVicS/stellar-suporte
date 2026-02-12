import React, { useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { apiPatch } from '@/integrations/api/client';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  currentUrl?: string | null;
  userId: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
}

const sizes = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-16 h-16 text-xl',
  lg: 'w-24 h-24 text-3xl',
};

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentUrl,
  userId,
  name = '',
  size = 'md',
  editable = true,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { refreshProfile } = useAuth();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const displayUrl = preview || currentUrl;
  const initial = name?.charAt(0)?.toUpperCase() || '?';

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Selecione uma imagem', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      // Para simplificar, não fazemos upload binário aqui.
      // Em uma próxima iteração, poderíamos adicionar um endpoint de upload.
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      await apiPatch(`/api/profiles/${userId}`, { avatar_url: objectUrl });
      qc.invalidateQueries({ queryKey: ['profiles'] });
      await refreshProfile();
      toast({ title: 'Foto atualizada!' });
    } catch (e: any) {
      toast({ title: 'Erro ao enviar foto', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group inline-block">
      <div
        className={cn(
          "rounded-full flex items-center justify-center overflow-hidden bg-primary/10 font-bold text-primary",
          sizes[size],
          editable && "cursor-pointer"
        )}
        onClick={() => editable && fileRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        ) : displayUrl ? (
          <img src={displayUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{initial}</span>
        )}
      </div>

      {editable && !uploading && (
        <div
          className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          <Camera className="w-4 h-4 text-white" />
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
};

export default AvatarUpload;
