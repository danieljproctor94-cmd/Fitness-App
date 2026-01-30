import { supabase } from './supabase';

/**
 * Uploads a file to the 'avatars' bucket in Supabase Storage.
 * Returns the public URL of the uploaded file.
 * 
 * @param file The file object to upload
 * @param userId The user's ID (used for folder structure)
 * @returns The public URL string or null if upload failed
 */
export const uploadAvatar = async (file: File, userId: string): Promise<{ url: string | null, error: any | null }> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Error uploading avatar:', uploadError);
            return { url: null, error: uploadError };
        }

        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return { url: data.publicUrl, error: null };
    } catch (error) {
        console.error('Unexpected error during avatar upload:', error);
        return { url: null, error };
    }
};
