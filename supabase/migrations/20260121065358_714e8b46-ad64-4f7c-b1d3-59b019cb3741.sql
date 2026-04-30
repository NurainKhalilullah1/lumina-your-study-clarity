-- Add columns to store extracted text content and extraction status
ALTER TABLE user_files
ADD COLUMN text_content TEXT,
ADD COLUMN extraction_status TEXT DEFAULT 'pending';

-- Add a comment for documentation
COMMENT ON COLUMN user_files.text_content IS 'Extracted text content from the uploaded file';
COMMENT ON COLUMN user_files.extraction_status IS 'Status of text extraction: pending, completed, failed';