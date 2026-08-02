import { apiClient } from 'src/utils/api-client';

// Support content shown in the mobile app's drawer: About Us, Help & Support,
// Refund/Terms/Policies and the FAQ.
//
// Two shapes, because the app renders them differently:
//
//   * Content pages are HTML, keyed by a slug the app requests by name.
//   * FAQs are structured question/answer rows, because the FAQ screen
//     searches across them and renders each as an expandable row — both of
//     which flat HTML would cost.

// ---------------------------------------------------------------- content pages

export interface ContentPage {
  _id?: string;
  slug: string;
  title: string;
  html: string;
  is_active: boolean;
  updatedAt?: string;
}

/**
 * Slugs the mobile app actually requests, and where each one surfaces.
 *
 * The app asks for these by name, so they are a contract rather than a
 * suggestion — a page saved under any other slug is never fetched by anything.
 * `terms-conditions` in particular is easy to get wrong: the backend seeder
 * once wrote `terms`, and that tab 404'd whatever an admin typed into it.
 */
export const APP_CONTENT_SLUGS: { slug: string; title: string; where: string }[] = [
  { slug: 'about-us', title: 'About Us', where: 'Menu → About Us' },
  { slug: 'help-support', title: 'Help & Support', where: 'Menu → Help & Support' },
  { slug: 'terms-conditions', title: 'Terms & Conditions', where: 'Menu → Refund, Terms and Policies' },
  { slug: 'refund-policy', title: 'Refund Policy', where: 'Menu → Refund, Terms and Policies' },
  { slug: 'privacy-policy', title: 'Privacy Policy', where: 'Menu → Refund, Terms and Policies' },
  { slug: 'faq', title: 'FAQ (prose)', where: 'Fallback prose — the app uses the FAQ list below' },
];

interface ContentPageListResponse {
  success: boolean;
  data: ContentPage[];
}

interface ContentPageMutateResponse {
  success: boolean;
  message?: string;
  data: ContentPage;
}

export async function getContentPages(): Promise<ContentPageListResponse> {
  return apiClient.get<ContentPageListResponse>('/api/admin/content-pages');
}

/** Creates or updates by slug — the backend upserts. */
export async function saveContentPage(
  slug: string,
  page: { title: string; html: string; is_active?: boolean }
): Promise<ContentPageMutateResponse> {
  return apiClient.put<ContentPageMutateResponse>(`/api/admin/content-pages/${slug}`, page);
}

export async function deleteContentPage(slug: string): Promise<{ success: boolean }> {
  return apiClient.delete<{ success: boolean }>(`/api/admin/content-pages/${slug}`);
}

// ------------------------------------------------------------------------ FAQs

export interface Faq {
  _id: string;
  question: string;
  answer: string;
  category: string;
  sequence: number;
  is_active: boolean;
  store_codes?: string[];
}

export type FaqInput = {
  question: string;
  answer: string;
  category?: string;
  sequence?: number;
  is_active?: boolean;
};

interface FaqListResponse {
  success: boolean;
  count: number;
  data: Faq[];
}

interface FaqMutateResponse {
  success: boolean;
  message?: string;
  data: Faq;
}

export async function getFaqs(): Promise<FaqListResponse> {
  return apiClient.get<FaqListResponse>('/api/admin/faqs');
}

export async function createFaq(faq: FaqInput): Promise<FaqMutateResponse> {
  return apiClient.post<FaqMutateResponse>('/api/admin/faqs', faq);
}

export async function updateFaq(id: string, faq: Partial<FaqInput>): Promise<FaqMutateResponse> {
  return apiClient.put<FaqMutateResponse>(`/api/admin/faqs/${id}`, faq);
}

export async function deleteFaq(id: string): Promise<{ success: boolean }> {
  return apiClient.delete<{ success: boolean }>(`/api/admin/faqs/${id}`);
}

/**
 * Writes new sequence numbers in one call.
 *
 * The app orders groups by `sequence` across the whole list, not by category
 * name, so moving a question also moves its heading relative to the others.
 */
export async function reorderFaqs(
  items: { id: string; sequence: number }[]
): Promise<{ success: boolean; message?: string }> {
  return apiClient.put<{ success: boolean; message?: string }>('/api/admin/faqs/bulk/reorder', {
    items,
  });
}
