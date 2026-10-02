// Product photos must already be optimized .webp files of 100KB or less —
// enforced here on the client so a bad file never reaches the backend at
// all, rather than relying on the server to catch or silently re-encode it.
export const PRODUCT_IMAGE_MAX_BYTES = 100 * 1024;
export const PRODUCT_IMAGE_ACCEPT = 'image/webp,.webp';

// null means the file is acceptable; otherwise a user-facing reason.
export function validateProductImageFile(file: File): string | null {
  const isWebp = file.type === 'image/webp' || /\.webp$/i.test(file.name);
  if (!isWebp) {
    return `${file.name}: only .webp images are accepted`;
  }
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    return `${file.name}: must be 100KB or smaller (this file is ${(file.size / 1024).toFixed(1)}KB)`;
  }
  return null;
}

// Splits a FileList/array into files that pass validation and the reasons
// for the ones that don't, so a bulk picker can proceed with the valid ones
// and surface the rest as errors instead of all-or-nothing rejecting the
// whole batch.
export function partitionProductImageFiles(files: File[]): { valid: File[]; errors: string[] } {
  const valid: File[] = [];
  const errors: string[] = [];
  for (const file of files) {
    const error = validateProductImageFile(file);
    if (error) {
      errors.push(error);
    } else {
      valid.push(file);
    }
  }
  return { valid, errors };
}
