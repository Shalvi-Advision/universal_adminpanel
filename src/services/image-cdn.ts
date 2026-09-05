import type {
  ImageSyncRun,
  ImageCdnCoverage,
  ImageCdnMissingProduct,
} from 'src/types/api';

import { apiClient } from 'src/utils/api-client';
import { getSelectedProjectCode } from 'src/utils/project-code';

// ----------------------------------------------------------------------
// Reads/writes for the currently-selected tenant (X-Project-Code, same as
// every other admin endpoint — apiClient attaches it automatically). All
// of these 403 for an admin without imageCdnAccess; the panel only shows
// this page's nav entry when that flag is set (see ImageCdnGuard), but the
// backend enforces it regardless.

export async function getImageCdnCoverage(): Promise<{ success: boolean; data: ImageCdnCoverage }> {
  return apiClient.get('/api/admin/image-cdn/coverage');
}

export async function getImageCdnMissing(
  limit = 200
): Promise<{ success: boolean; count: number; data: ImageCdnMissingProduct[] }> {
  return apiClient.get(`/api/admin/image-cdn/missing?limit=${limit}`);
}

export async function runImageCdnSync(): Promise<{
  success: boolean;
  message: string;
  data: ImageCdnCoverage & { run_id: string; missing_sample: ImageCdnMissingProduct[] };
}> {
  return apiClient.post('/api/admin/image-cdn/sync');
}

export async function getImageCdnRuns(
  limit = 20
): Promise<{ success: boolean; count: number; data: ImageSyncRun[] }> {
  return apiClient.get(`/api/admin/image-cdn/runs?limit=${limit}`);
}

// Multipart, so it bypasses apiClient (which always JSON-stringifies) and
// hand-rolls the fetch, same pattern as src/services/upload.ts.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export async function uploadImageCdnImage(
  pCode: string,
  suffix: 1 | 2,
  file: File
): Promise<{ success: boolean; message: string; data: { url: string | null } }> {
  const token = sessionStorage.getItem('authToken');
  if (!token) throw new Error('Authentication required');

  const formData = new FormData();
  formData.append('p_code', pCode);
  formData.append('suffix', String(suffix));
  formData.append('image', file);

  const response = await fetch(`${API_BASE_URL}/api/admin/image-cdn/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Project-Code': getSelectedProjectCode(),
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to upload image');
  }

  return data;
}

export interface BulkPoolUploadResult {
  saved: { filename: string; barcode: string; suffix: 1 | 2 }[];
  skipped: { filename: string; reason: string }[];
}

// One request's worth of files (server caps a single call at 25). Restocks
// the shared pool only — tenant-agnostic, no project_code involved, run
// "Sync now" per tenant afterwards to pick up what these newly-added
// barcodes match.
async function bulkUploadBatch(files: File[]): Promise<BulkPoolUploadResult> {
  const token = sessionStorage.getItem('authToken');
  if (!token) throw new Error('Authentication required');

  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));

  const response = await fetch(`${API_BASE_URL}/api/admin/image-cdn/pool/bulk-upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Project-Code': getSelectedProjectCode(),
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Bulk upload failed');
  }

  return data.data;
}

// Chunks a large file selection into batches of `batchSize` (well under the
// server's 25-per-request cap, so one oversized request never risks the
// whole selection) and posts them one at a time, reporting progress and
// accumulating each batch's saved/skipped list into one summary.
export async function bulkUploadToPool(
  files: File[],
  batchSize = 15,
  onProgress?: (done: number, total: number) => void
): Promise<BulkPoolUploadResult> {
  const result: BulkPoolUploadResult = { saved: [], skipped: [] };

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchResult = await bulkUploadBatch(batch);
    result.saved.push(...batchResult.saved);
    result.skipped.push(...batchResult.skipped);
    onProgress?.(Math.min(i + batchSize, files.length), files.length);
  }

  return result;
}
