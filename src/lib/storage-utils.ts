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

/** Uploads a progress photo to the 'progress-photos' bucket. */
export const uploadProgressPhoto = async (file: File, userId: string): Promise<{ url: string | null, error: any | null }> => {
    try {
        const fileExt = file.name.split('.').pop();
        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = userId + '/' + dateStr + '_' + Math.random().toString(36).substring(7) + '.' + fileExt;
        const { error } = await supabase.storage.from('progress-photos').upload(fileName, file, { cacheControl: '3600', upsert: false });
        if (error) { console.error('Error uploading:', error); return { url: null, error }; }
        const { data } = supabase.storage.from('progress-photos').getPublicUrl(fileName);
        return { url: data.publicUrl, error: null };
    } catch (error) {
        console.error('Unexpected error:', error);
        return { url: null, error };
    }
};
