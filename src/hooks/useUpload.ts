import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = async (file: File, bucket: string, path: string) => {
    setUploading(true)
    setError(null)

    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setError(errorMessage)
      throw error
    } finally {
      setUploading(false)
    }
  }

  const getPublicUrl = (bucket: string, path: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    
    return data.publicUrl
  }

  const getSignedUrl = async (bucket: string, path: string, expiresIn: number = 3600) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) {
      throw error
    }

    return data.signedUrl
  }

  return {
    uploadFile,
    getPublicUrl,
    getSignedUrl,
    uploading,
    error
  }
}
