import { apiClient } from 'src/utils/api-client';

// Onboarding carousel shown on first launch of the mobile app.
// Backed by a tenant-DB collection, not project.config — slides are an ordered
// list that admins add to, reorder and retire.
export interface OnboardingSlide {
  _id: string;
  title: string;
  description: string;
  image_url: string;
  sequence: number;
  is_active: boolean;
}

export type OnboardingSlideInput = {
  title: string;
  description: string;
  image_url: string;
  is_active?: boolean;
  sequence?: number;
};

interface ListResponse {
  success: boolean;
  count: number;
  data: OnboardingSlide[];
}

interface MutateResponse {
  success: boolean;
  message?: string;
  data: OnboardingSlide;
}

export async function getOnboardingSlides(): Promise<ListResponse> {
  return apiClient.get<ListResponse>('/api/admin/onboarding');
}

export async function createOnboardingSlide(slide: OnboardingSlideInput): Promise<MutateResponse> {
  return apiClient.post<MutateResponse>('/api/admin/onboarding', slide);
}

export async function updateOnboardingSlide(
  id: string,
  slide: Partial<OnboardingSlideInput>
): Promise<MutateResponse> {
  return apiClient.put<MutateResponse>(`/api/admin/onboarding/${id}`, slide);
}

export async function deleteOnboardingSlide(id: string): Promise<{ success: boolean }> {
  return apiClient.delete<{ success: boolean }>(`/api/admin/onboarding/${id}`);
}

/** Persists a whole new order in one write; `ids` is the desired sequence. */
export async function reorderOnboardingSlides(ids: string[]): Promise<ListResponse> {
  return apiClient.put<ListResponse>('/api/admin/onboarding/reorder', { ids });
}
