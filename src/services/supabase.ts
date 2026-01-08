import { createClient } from '@supabase/supabase-js';

// Supabase configuration (public keys - safe to expose)
const SUPABASE_URL = 'https://gvsbrkvrqjlptzlvbaax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2c2Jya3ZycWpscHR6bHZiYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NzgzNTIsImV4cCI6MjA4MzQ1NDM1Mn0.vnPyynhhl56znsJQPpqEbB-B4b4aideMDE5Jp8_MQK0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BUCKET_NAME = 'images';

/**
 * Get the public URL for an image in Supabase storage
 * @param imageName - The name of the image file (e.g., "chat.webp")
 * @returns The public URL of the image
 */
export const getImageUrl = (imageName: string): string => {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(imageName);
  return data.publicUrl;
};

/**
 * Preload an image by creating an Image object
 * @param url - The URL of the image to preload
 * @returns A promise that resolves when the image is loaded
 */
export const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};

/**
 * Preload multiple images
 * @param urls - Array of image URLs to preload
 */
export const preloadImages = async (urls: string[]): Promise<void> => {
  await Promise.allSettled(urls.map(preloadImage));
};
