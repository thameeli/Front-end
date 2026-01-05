/**
 * Upload Progress Hook
 * Tracks upload progress for file uploads
 */

import { useState, useCallback } from 'react';

interface UseUploadProgressReturn {
  progress: number; // 0-100
  isUploading: boolean;
  error: Error | null;
  startUpload: (uploadFn: (onProgress: (progress: number) => void) => Promise<any>) => Promise<any>;
  reset: () => void;
}

export function useUploadProgress(): UseUploadProgressReturn {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const startUpload = useCallback(async (
    uploadFn: (onProgress: (progress: number) => void) => Promise<any>
  ) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      const result = await uploadFn((uploadProgress) => {
        setProgress(uploadProgress);
      });
      setProgress(100);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed');
      setError(error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProgress(0);
    setIsUploading(false);
    setError(null);
  }, []);

  return {
    progress,
    isUploading,
    error,
    startUpload,
    reset,
  };
}

