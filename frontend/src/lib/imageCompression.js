// Client-side image compression for the admin product image flow.
//
// Why:
//   We accept high-quality originals (up to 50 MB) from the admin UI, but the
//   menu app and Supabase storage should never see anything that large. This
//   helper rejects files above the 50 MB hard cap and otherwise compresses
//   the image to a small WebP (or JPEG fallback) suitable for upload.
//
// Output target:
//   - maxSizeMB: 2
//   - maxWidthOrHeight: 1600
//   - fileType: image/webp (with non-forced fallback if WebP fails)
//   - useWebWorker: true so the UI thread stays responsive on big inputs
//
// The original filename is preserved (with a `.webp` extension when we
// successfully convert to WebP) so the eventual storage object keeps a
// human-readable name.

import imageCompression from 'browser-image-compression';

export const MAX_ORIGINAL_IMAGE_MB = 50;
export const MAX_ORIGINAL_IMAGE_BYTES = MAX_ORIGINAL_IMAGE_MB * 1024 * 1024;

const ACCEPTED_INPUT_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

// Error messages are Uzbek because the admin UI is Uzbek-first.
export const ERR_TOO_LARGE =
  'Rasm hajmi juda katta. 50MB gacha rasm yuklang.';
export const ERR_UNSUPPORTED =
  'Noto\u2018g\u2018ri fayl turi. JPG, PNG yoki WEBP yuklang.';
export const ERR_UPLOAD_FAILED =
  'Rasmni yuklashda xatolik yuz berdi.';

function withExtension(name, ext) {
  if (!name) return 'image.' + ext;
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  return base + '.' + ext;
}

// browser-image-compression returns a Blob (or File on modern browsers).
// Wrap it as a File so multipart/form-data uploads keep a usable filename
// and the right content-type.
function rewrap(blob, originalName, preferredExt) {
  if (typeof File !== 'undefined') {
    const name = withExtension(
      (blob && blob.name) || originalName || 'image',
      preferredExt
    );
    try {
      return new File([blob], name, {
        type: blob.type || ('image/' + preferredExt),
        lastModified: Date.now(),
      });
    } catch (_) {
      // Older browsers fail the File constructor; fall through to the blob.
    }
  }
  return blob;
}

/**
 * Compress an admin-selected product image down to <=2 MB / <=1600 px.
 *
 * Rules:
 *   - Returns null when the input is null/undefined.
 *   - Throws ERR_UNSUPPORTED when the input has a non-image mime that is not
 *     JPEG / PNG / WEBP.
 *   - Throws ERR_TOO_LARGE when the original file is bigger than 50 MB.
 *   - Otherwise returns a File / Blob suitable for direct upload.
 *
 * Anything in between (8 MB, 15 MB, 20 MB \u2026) is accepted and compressed.
 */
export async function compressProductImage(file) {
  if (!file) return null;

  if (file.type && !ACCEPTED_INPUT_TYPES.has(file.type)) {
    throw new Error(ERR_UNSUPPORTED);
  }
  if (file.size > MAX_ORIGINAL_IMAGE_BYTES) {
    throw new Error(ERR_TOO_LARGE);
  }

  const baseOptions = {
    maxSizeMB: 2,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    initialQuality: 0.82,
  };

  // First pass: try to convert to WebP. Smaller and well supported on every
  // browser we care about (the customer menu PWA + tablet PWA).
  try {
    const webp = await imageCompression(file, {
      ...baseOptions,
      fileType: 'image/webp',
    });
    return rewrap(webp, file.name, 'webp');
  } catch (webpErr) {
    // Some inputs fail the WebP encode (e.g. CMYK PNG sources). Retry
    // without forcing the output type so the compressor can keep the
    // original format.
    // eslint-disable-next-line no-console
    console.warn(
      '[imageCompression] WebP compression failed, retrying without forced fileType',
      webpErr
    );
    try {
      const compressed = await imageCompression(file, baseOptions);
      const ext = (file.type || '').split('/')[1] || 'jpg';
      return rewrap(compressed, file.name, ext);
    } catch (fallbackErr) {
      // eslint-disable-next-line no-console
      console.error(
        '[imageCompression] Fallback compression failed',
        fallbackErr
      );
      throw new Error(ERR_UPLOAD_FAILED);
    }
  }
}

export default compressProductImage;
