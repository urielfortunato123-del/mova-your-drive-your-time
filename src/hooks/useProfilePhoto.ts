import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useProfilePhoto() {
  const [uploading, setUploading] = useState(false);

  const uploadPhoto = async (file: File, userId: string): Promise<string | null> => {
    try {
      setUploading(true);

      // Validate file
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem');
        return null;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error('Imagem deve ter no máximo 2MB');
        return null;
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Erro ao fazer upload da foto');
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update driver profile with photo URL
      const { error: updateError } = await supabase
        .from('driver_profiles')
        .update({ photo: publicUrl })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Update error:', updateError);
        toast.error('Erro ao atualizar perfil');
        return null;
      }

      toast.success('Foto atualizada com sucesso!');
      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Erro ao fazer upload da foto');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadPhoto, uploading };
}
