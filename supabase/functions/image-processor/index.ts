// Supabase Edge Function: image-processor
//
// Reads the original from Storage, generates two derivatives (optimized + thumb)
// as WebP, and writes them to public folders. Originals are never modified.
//
// Invoked by backend POST /api/media/finalize via supabase.functions.invoke().
//
// Deploy:
//   supabase functions deploy image-processor

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import sharp from 'npm:sharp@0.33.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
})

const ENTITY_FOLDER: Record<string, string> = {
  product: 'products',
  category: 'categories',
}

Deno.serve(async (req) => {
  try {
    const { entityType, entityId, objectPath } = await req.json()
    const folder = ENTITY_FOLDER[entityType]
    if (!folder || !entityId || !objectPath) {
      return json({ error: 'bad_request' }, 400)
    }
    const expectedPrefix = `${folder}/original/${entityId}/`
    if (!objectPath.startsWith(expectedPrefix)) {
      return json({ error: 'path_mismatch' }, 400)
    }

    // 1. Download the original.
    const { data: blob, error: dlErr } = await supabase
      .storage.from('media').download(objectPath)
    if (dlErr || !blob) return json({ error: 'download_failed', detail: dlErr?.message }, 500)

    const buf = new Uint8Array(await blob.arrayBuffer())

    // 2. Format guard via magic bytes.
    const meta = await sharp(buf).metadata()
    if (!['jpeg', 'png', 'webp'].includes(meta.format ?? '')) {
      return json({ error: 'unsupported_format' }, 400)
    }

    // 3. Generate derivatives.
    const optimized = await sharp(buf, { failOn: 'none' })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90 })
      .toBuffer()

    const thumb = await sharp(buf, { failOn: 'none' })
      .rotate()
      .resize({ width: 450, height: 450, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()

    // 4. Upload derivatives to public folders.
    const baseName = objectPath.split('/').pop()!.replace(/\.[^.]+$/, '')
    const optimizedPath = `${folder}/optimized/${entityId}/${baseName}.webp`
    const thumbPath     = `${folder}/thumb/${entityId}/${baseName}.webp`

    const upOpt = await supabase.storage.from('media').upload(
      optimizedPath, optimized,
      { contentType: 'image/webp', upsert: true, cacheControl: '31536000, immutable' },
    )
    if (upOpt.error)
      return json({ error: 'upload_optimized_failed', detail: upOpt.error.message }, 500)

    const upThumb = await supabase.storage.from('media').upload(
      thumbPath, thumb,
      { contentType: 'image/webp', upsert: true, cacheControl: '31536000, immutable' },
    )
    if (upThumb.error)
      return json({ error: 'upload_thumb_failed', detail: upThumb.error.message }, 500)

    return json({ optimizedPath, thumbPath })
  } catch (e) {
    return json({ error: 'unexpected', detail: String(e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
