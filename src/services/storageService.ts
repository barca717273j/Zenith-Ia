import { supabase } from '../supabase';

export const ensureBucketExists = async (bucketName: string) => {
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName);
    
    if (error) {
      // If bucket is not found, try to create it silently
      if (error.message.toLowerCase().includes('not found') || (error as any).status === 404) {
        console.log(`Bucket ${bucketName} not found, attempting to create...`);
        
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (createError) {
          // If creation fails (likely due to RLS), throw a helpful, localized error
          console.warn(`Could not create bucket ${bucketName} automatically (RLS).`);
          throw new Error(`A pasta de armazenamento '${bucketName}' não existe. Por favor, crie-a no seu Painel Supabase (Storage -> New Bucket) com o nome '${bucketName}' e defina como 'Public'.`);
        }
        
        console.log(`Bucket ${bucketName} created successfully.`);
        return true;
      }
      
      // For other errors, re-throw
      throw error;
    }
    
    return true;
  } catch (error: any) {
    // If it's already our custom error, just re-throw it
    if (error.message.includes('Painel Supabase')) {
      throw error;
    }
    
    // Check for RLS error specifically
    if (error.message?.toLowerCase().includes('row-level security') || error.message?.toLowerCase().includes('policy')) {
      throw new Error(`Erro de permissão: A pasta '${bucketName}' não pôde ser criada automaticamente. Por favor, crie-a manualmente no seu Painel Supabase (Storage -> New Bucket) e defina como 'Public'.`);
    }

    // Otherwise, wrap it in a more helpful message if it's a "Bucket not found" error
    if (error.message?.toLowerCase().includes('not found')) {
      throw new Error(`A pasta '${bucketName}' não foi encontrada. Por favor, crie-a no seu Painel Supabase (Storage -> New Bucket) e defina como 'Public'.`);
    }
    
    console.error(`Error ensuring bucket ${bucketName} exists:`, error);
    throw error;
  }
};
