import type {
  WebSearchJob,
  ImageSyncRun,
  ImageSuggestion,
  ImageCdnSettings,
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
  limit = 200,
  page = 1
): Promise<{
  success: boolean;
  count: number;
  total: number;
  page: number;
  pages: number;
  data: ImageCdnMissingProduct[];
}> {
  return apiClient.get(`/api/admin/image-cdn/missing?limit=${limit}&page=${page}`);
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

export interface BulkMissingUploadResult {
  saved: { filename: string; p_code: string; suffix: 1 | 2; url: string }[];
  skipped: { filename: string; reason: string }[];
}

// One request's worth of files (server caps a single call at 25) against a
// given bulk-upload endpoint.
async function postBulkImages<T>(endpoint: string, files: File[]): Promise<T> {
  const token = sessionStorage.getItem('authToken');
  if (!token) throw new Error('Authentication required');

  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
// whole selection), posts them one at a time against `endpoint`, and
// accumulates each batch's saved/skipped list into one summary.
async function chunkedBulkUpload<R extends { saved: unknown[]; skipped: unknown[] }>(
  endpoint: string,
  files: File[],
  batchSize: number,
  onProgress?: (done: number, total: number) => void
): Promise<R> {
  const result = { saved: [], skipped: [] } as unknown as R;

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchResult = await postBulkImages<R>(endpoint, batch);
    (result.saved as unknown[]).push(...batchResult.saved);
    (result.skipped as unknown[]).push(...batchResult.skipped);
    onProgress?.(Math.min(i + batchSize, files.length), files.length);
  }

  return result;
}

// Restocks the shared pool only — tenant-agnostic, no project_code
// involved, run "Sync now" per tenant afterwards to pick up what these
// newly-added barcodes match. Files named <barcode>_1.<ext> (or _2, or
// bare <barcode>.<ext>).
export async function bulkUploadToPool(
  files: File[],
  batchSize = 15,
  onProgress?: (done: number, total: number) => void
): Promise<BulkPoolUploadResult> {
  return chunkedBulkUpload<BulkPoolUploadResult>(
    '/api/admin/image-cdn/pool/bulk-upload',
    files,
    batchSize,
    onProgress
  );
}

// Bulk version of uploadImageCdnImage — closes this tenant's missing-list
// gaps immediately (no separate sync needed). Files named <p_code>_1.<ext>
// (or _2, or bare <p_code>.<ext>) — THIS tenant's own product codes, not
// barcodes.
export async function bulkUploadMissingImages(
  files: File[],
  batchSize = 15,
  onProgress?: (done: number, total: number) => void
): Promise<BulkMissingUploadResult> {
  return chunkedBulkUpload<BulkMissingUploadResult>(
    '/api/admin/image-cdn/missing/bulk-upload',
    files,
    batchSize,
    onProgress
  );
}

// ----------------------------------------------------------------------
// Image Match Suggestions — platform-wide Gemini key + the two suggestion
// sources (free cross-tenant matching, paid web search) + the review
// queue. See the "Image Match Suggestions" architecture plan.

export async function getImageCdnSettings(): Promise<{ success: boolean; data: ImageCdnSettings }> {
  return apiClient.get('/api/admin/image-cdn/settings');
}

// Write-only — the key is never read back. Pass '' to clear it.
export async function setGeminiApiKey(geminiApiKey: string): Promise<{ success: boolean; message: string }> {
  return apiClient.post('/api/admin/image-cdn/settings', { gemini_api_key: geminiApiKey });
}

// Free — cross-tenant text matching + vision pre-filter.
export async function generateCrossTenantSuggestions(): Promise<{
  success: boolean;
  message: string;
  data: { total_missing: number; created: number; skipped_existing: number };
}> {
  return apiClient.post('/api/admin/image-cdn/suggestions/generate');
}

// Real cost — either search exactly the products the admin selected from
// the Missing Images list (pCodes, takes priority), or auto-pick the next
// N missing products without hand-picking (limit). Only ever spends on
// products with no existing web_search suggestion yet.
//
// Queued: this only starts the job and returns its id — the search itself
// runs in the background (see the route's own comment on why). Poll
// getWebSearchJob(jobId) for progress instead of awaiting a final result
// here. A 409 means one is already running for this tenant; its id comes
// back in the error's `data.data.job_id` (see ApiError) so the caller can
// just start polling that one instead of erroring out.
export async function startWebSearchJob(
  opts: { pCodes: string[] } | { limit: number }
): Promise<{
  success: boolean;
  message: string;
  data: { job_id: string; status: WebSearchJob['status']; requested: number };
}> {
  const body = 'pCodes' in opts ? { p_codes: opts.pCodes } : { limit: opts.limit };
  return apiClient.post('/api/admin/image-cdn/suggestions/web-search', body);
}

// Newest first, no per-product results (use getWebSearchJob for that) — for
// the "is one already running / what happened last time" checks.
export async function listWebSearchJobs(
  limit = 10
): Promise<{ success: boolean; count: number; data: WebSearchJob[] }> {
  return apiClient.get(`/api/admin/image-cdn/suggestions/web-search/jobs?limit=${limit}`);
}

export async function getWebSearchJob(jobId: string): Promise<{ success: boolean; data: WebSearchJob }> {
  return apiClient.get(`/api/admin/image-cdn/suggestions/web-search/jobs/${jobId}`);
}

export async function getImageSuggestions(
  status: 'pending' | 'accepted' | 'rejected' = 'pending',
  page = 1,
  limit = 20
): Promise<{
  success: boolean;
  count: number;
  total: number;
  page: number;
  pages: number;
  data: ImageSuggestion[];
}> {
  return apiClient.get(`/api/admin/image-cdn/suggestions?status=${status}&page=${page}&limit=${limit}`);
}

export interface ImageSuggestionStats {
  pending: number;
  accepted: number;
  rejected: number;
  pending_cross_tenant: number;
  pending_web_search: number;
}

export async function getImageSuggestionStats(): Promise<{ success: boolean; data: ImageSuggestionStats }> {
  return apiClient.get('/api/admin/image-cdn/suggestions/stats');
}

export async function acceptImageSuggestion(
  id: string
): Promise<{ success: boolean; message: string; data: { url: string } }> {
  return apiClient.post(`/api/admin/image-cdn/suggestions/${id}/accept`);
}

export async function rejectImageSuggestion(id: string): Promise<{ success: boolean; message: string }> {
  return apiClient.post(`/api/admin/image-cdn/suggestions/${id}/reject`);
}

// The preview endpoint requires auth (it streams straight from the pool,
// never a public CDN URL before acceptance — see the backend route's own
// comment), so a plain <img src="..."> can't carry the header. Fetch it as
// a blob and hand back an object URL instead; callers must revoke it when
// done with it (e.g. on unmount) to avoid leaking memory.
export async function getImageSuggestionPreviewUrl(id: string): Promise<string> {
  const token = sessionStorage.getItem('authToken');
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_BASE_URL}/api/admin/image-cdn/suggestions/${id}/preview`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Project-Code': getSelectedProjectCode(),
    },
  });

  if (!response.ok) throw new Error('Failed to load preview image');
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
