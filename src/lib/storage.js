import { supabase } from './supabase'

const BUCKET = 'pointage-photos'

export async function uploadPointagePhoto(file, name) {
  const safeName = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const path = `${safeName || 'employe'}-${Date.now()}.jpg`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'image/jpeg',
  })
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
