import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Validar arquivo
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Arquivo deve ter no máximo 5MB');
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Formato não suportado. Use JPG, PNG, GIF ou WebP');
      }

      // Simular progresso
      setUploadProgress(25);

      // Converter arquivo para base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsDataURL(file);
      });

      setUploadProgress(50);

      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileName = `${timestamp}-${randomString}.${file.name.split('.').pop()}`;
      const filePath = `products/${fileName}`;

      setUploadProgress(75);

      // Salvar no banco de dados
      const { data, error: dbError } = await supabase
        .from('product_images')
        .insert({
          file_name: fileName,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          public_url: base64, // Usar base64 como URL pública
          original_name: file.name
        })
        .select()
        .single();

      if (dbError) {
        console.error('Erro ao salvar no banco:', dbError);
        throw new Error(`Erro ao salvar imagem: ${dbError.message}`);
      }

      setUploadProgress(100);

      return {
        url: data.public_url,
        name: data.file_name,
        size: data.file_size,
        path: data.file_path
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido no upload';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const deleteImage = async (imageUrl: string) => {
    try {
      // Encontrar a imagem pelo URL
      const { data: images, error: findError } = await supabase
        .from('product_images')
        .select('*')
        .eq('public_url', imageUrl);

      if (findError) {
        throw new Error(`Erro ao buscar imagem: ${findError.message}`);
      }

      if (!images || images.length === 0) {
        throw new Error('Imagem não encontrada');
      }

      const image = images[0];

      // Deletar do banco de dados
      const { error: deleteError } = await supabase
        .from('product_images')
        .delete()
        .eq('id', image.id);

      if (deleteError) {
        throw new Error(`Erro ao deletar imagem: ${deleteError.message}`);
      }

      // Remover associações de produtos
      await supabase
        .from('product_image_associations')
        .delete()
        .eq('image_id', image.id);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao deletar';
      setError(errorMessage);
      throw err;
    }
  };

  const getUploadedImages = async () => {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erro ao carregar imagens: ${error.message}`);
      }

      return (data || []).map(image => ({
        url: image.public_url,
        name: image.file_name,
        size: image.file_size,
        path: image.file_path,
        originalName: image.original_name
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao carregar imagens';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    uploadImage,
    deleteImage,
    getUploadedImages,
    uploading,
    uploadProgress,
    error
  };
};