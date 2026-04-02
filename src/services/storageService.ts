import { supabase } from '../lib/supabase';

export const ensureBucketExists = async (bucketName: string) => {
  try {
    // First check if it exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      // If we can't even list buckets, we might have a connection issue or major permission issue
    } else {
      const exists = buckets?.some(b => b.id === bucketName);
      if (exists) return true;
    }

    // If not found or couldn't list, try to get it directly
    const { data, error } = await supabase.storage.getBucket(bucketName);
    
    if (error) {
      // If bucket is not found, try to create it
      if (error.message.toLowerCase().includes('not found') || (error as any).status === 404) {
        console.log(`Bucket ${bucketName} not found, attempting to create...`);
        
        // Try with minimal options first
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true
        });
        
        if (createError) {
          // If creation fails (likely due to RLS), throw a helpful, localized error
          console.warn(`Could not create bucket ${bucketName} automatically (RLS).`, createError);
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
