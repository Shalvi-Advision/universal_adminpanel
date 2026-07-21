import { apiClient } from 'src/utils/api-client';
import { getSelectedProjectCode } from 'src/utils/project-code';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5008';

export interface DigitalCartItem {
  _id: string;
  p_code: string;
  product_name: string;
  mrp: string;
  offer_price: string;
  mrp_value: number | null;
  offer_price_value: number | null;
  offer_text: string;
  position: number;
  is_active: boolean;
  source_file: string;
  createdAt: string;
  updatedAt: string;
}

export interface DigitalCartMeta {
  total: number;
  active: number;
  source_file: string | null;
  last_uploaded_at: string | null;
}

export interface DigitalCartResponse {
  success: boolean;
  data: DigitalCartItem[];
  meta: DigitalCartMeta;
}

export interface UploadCsvResponse {
  success: boolean;
  message: string;
  data: { imported: number; source_file: string };
}

export interface DigitalCartGroupStyle {
  color?: string;
  label?: string;
  line1?: string;
  line2?: string;
  ribbon?: string;
}

export interface DigitalCartUiSettings {
  group_styles?: Record<string, DigitalCartGroupStyle>;
  header_title: string;
  logo_url: string;
  show_logo: boolean;
  tagline: string;
  footer_note: string;
  home_heading: string;
  info_sub_text: string;
  valid_till_text: string;
  about_url: string;
  show_bottom_nav: boolean;
  primary_color: string;
  accent_color: string;
  background_color: string;
  card_color: string;
  text_color: string;
  card_radius: number;
  show_discount_percent: boolean;
  show_product_code: boolean;
  show_search: boolean;
  show_last_updated: boolean;
}

export async function getDigitalCartUiSettings(): Promise<{
  success: boolean;
  data: DigitalCartUiSettings;
}> {
  return apiClient.get('/api/admin/digital-cart/settings');
}

export async function updateDigitalCartUiSettings(
  settings: Partial<DigitalCartUiSettings>
): Promise<{ success: boolean; message: string; data: DigitalCartUiSettings }> {
  return apiClient.put('/api/admin/digital-cart/settings', settings);
}

export async function getDigitalCart(): Promise<DigitalCartResponse> {
  return apiClient.get<DigitalCartResponse>('/api/admin/digital-cart');
}

export async function uploadDigitalCartCsv(file: File): Promise<UploadCsvResponse> {
  const token = sessionStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication required');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/admin/digital-cart/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Project-Code': getSelectedProjectCode(),
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to upload CSV');
  }

  return data;
}

export async function toggleDigitalCartItem(id: string): Promise<{ success: boolean; data: DigitalCartItem }> {
  return apiClient.patch(`/api/admin/digital-cart/${id}/toggle`);
}

export async function deleteDigitalCartItem(id: string): Promise<{ success: boolean; message: string }> {
  return apiClient.delete(`/api/admin/digital-cart/${id}`);
}

export async function clearDigitalCart(): Promise<{ success: boolean; message: string }> {
  return apiClient.delete('/api/admin/digital-cart');
}
