-- ============================================================================
-- VIDEO STORAGE MIGRATION
-- Date: 2026-01-06
-- Purpose: Add video support columns to assets table and create storage bucket
-- ============================================================================

-- Add video columns to assets table if they don't exist
DO $$ 
BEGIN
  -- Add has_video column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'assets' AND column_name = 'has_video'
  ) THEN
    ALTER TABLE public.assets ADD COLUMN has_video BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add video_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'assets' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE public.assets ADD COLUMN video_url TEXT;
  END IF;
END $$;

-- Create index for video filtering
CREATE INDEX IF NOT EXISTS idx_assets_has_video ON public.assets(has_video);

-- ============================================================================
-- STORAGE BUCKET SETUP
-- Run these commands in the Supabase Dashboard > Storage section:
-- 
-- 1. Create bucket: asset-videos
--    - Public: Yes (for video playback)
--    - File size limit: 250MB
--    - Allowed MIME types: video/mp4, video/quicktime
--
-- 2. Create bucket: asset-images  
--    - Public: Yes
--    - File size limit: 10MB
--    - Allowed MIME types: image/*
--
-- Or use the SQL below (requires service role):
-- ============================================================================

-- Note: Storage bucket creation via SQL requires the storage schema
-- If running as service role, uncomment below:

-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES 
--   ('asset-videos', 'asset-videos', true, 262144000, ARRAY['video/mp4', 'video/quicktime']),
--   ('asset-images', 'asset-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
-- ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE RLS POLICIES
-- These allow authenticated users to upload and public to view
-- ============================================================================

-- For asset-videos bucket (run in Supabase Dashboard > Storage > Policies):
-- 
-- Policy: Allow authenticated uploads
-- Operation: INSERT
-- Target roles: authenticated
-- Policy: (bucket_id = 'asset-videos')
--
-- Policy: Allow public reads  
-- Operation: SELECT
-- Target roles: public
-- Policy: (bucket_id = 'asset-videos')
--
-- Policy: Allow owners to delete
-- Operation: DELETE
-- Target roles: authenticated
-- Policy: (bucket_id = 'asset-videos' AND auth.uid()::text = (storage.foldername(name))[1])

-- ============================================================================
-- MIGRATION COMPLETE
-- 
-- Columns added to assets:
--   - has_video (boolean)
--   - video_url (text)
--
-- Manual steps required:
--   1. Create 'asset-videos' bucket in Supabase Dashboard
--   2. Create 'asset-images' bucket in Supabase Dashboard
--   3. Set up storage policies as described above
-- ============================================================================
