import { apiClient } from 'src/utils/api-client';

// Mirrors the fixed icon set in the backend's utils/promoBulletIcons.js —
// keep these two lists in sync.
export const PROMO_BULLET_ICONS = ['diamond', 'search', 'gift', 'star', 'truck', 'percent'] as const;
export type PromoBulletIcon = (typeof PROMO_BULLET_ICONS)[number];

export interface PromoBullet {
  icon: PromoBulletIcon;
  title: string;
  subtitle: string;
}

export interface PromoPageValues {
  is_enabled: boolean;
  headline: string;
  subheadline: string;
  hero_image_url: string;
  bullets: PromoBullet[];
  android_url: string;
  ios_url: string;
}

export interface PromoPageResponse {
  success: boolean;
  message?: string;
  data: PromoPageValues;
}

export async function getPromoPage(): Promise<PromoPageResponse> {
  return apiClient.get<PromoPageResponse>('/api/admin/promo-page');
}

export async function updatePromoPage(
  values: Partial<PromoPageValues>
): Promise<PromoPageResponse> {
  return apiClient.put<PromoPageResponse>('/api/admin/promo-page', values);
}
