
-- Add image_url column to proposals
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS image_url text;

-- Create storage bucket for proposal images
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposal_images', 'proposal_images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload proposal images
CREATE POLICY "Authenticated users can upload proposal images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'proposal_images');

-- Allow public read access to proposal images
CREATE POLICY "Public read access for proposal images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'proposal_images');

-- Allow users to delete their own proposal images
CREATE POLICY "Users can delete own proposal images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'proposal_images' AND (storage.foldername(name))[1] = auth.uid()::text);
