import { apiClient } from 'src/utils/api-client';

// Branding/app config of the currently selected project. Field list mirrors
// EDITABLE_FIELDS in the backend's routes/admin/project-settings.js.
export interface ProjectSettingsConfig {
  app_name: string;
  logo_url: string;
  splash_logo_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_primary_color: string;
  text_secondary_color: string;
  success_color: string;
  warning_color: string;
  error_color: string;
  info_color: string;
  font_family: string;
  contact_email: string;
  contact_phone: string;
  min_app_version: string;
  latest_app_version: string;
  android_store_url: string;
  ios_store_url: string;
  force_update_message: string;

  // Splash screen — edited on the Mobile App > App Settings page.
  splash_logo_size: string;
  splash_background_color: string;
  splash_background_image_url: string;
  splash_tagline: string;
  splash_tagline_color: string;
  splash_animation: string;
  splash_duration_ms: string;
  splash_show_loader: string;

  // Home screen rollout switch — 'true' renders home from the server feed.
  home_feed_enabled: string;
}

export interface ProjectSettingsResponse {
  success: boolean;
  message?: string;
  data: {
    project_code: string;
    client_name: string;
    config: Partial<ProjectSettingsConfig> & Record<string, unknown>;
  };
}

export async function getProjectSettings(): Promise<ProjectSettingsResponse> {
  return apiClient.get<ProjectSettingsResponse>('/api/admin/project-settings');
}

export async function updateProjectSettings(
  config: Partial<ProjectSettingsConfig>
): Promise<ProjectSettingsResponse> {
  return apiClient.put<ProjectSettingsResponse>('/api/admin/project-settings', config);
}

// ----------------------------------------------------------------------
// Integrations. Split from the branding/config endpoints because these are
// super-admin only: a wrong payment key id breaks checkout for everyone.

export interface IntegrationValues {
  razorpay_key_id: string;
  currency: string;
  google_maps_api_key: string;
}

export interface IntegrationsResponse {
  success: boolean;
  message?: string;
  data: {
    project_code: string;
    integrations: Partial<IntegrationValues>;
    // Presence only — secret values are never returned by the API.
    secrets_set?: Record<string, boolean>;
  };
}

export async function getIntegrations(): Promise<IntegrationsResponse> {
  return apiClient.get<IntegrationsResponse>('/api/admin/project-settings/integrations');
}

export async function updateIntegrations(
  values: Partial<IntegrationValues>
): Promise<IntegrationsResponse> {
  return apiClient.put<IntegrationsResponse>('/api/admin/project-settings/integrations', values);
}

/** Write-only: nothing is echoed back. Sending '' clears a secret. */
export async function updateSecrets(
  secrets: Record<string, string>
): Promise<{ success: boolean; message?: string }> {
  return apiClient.put<{ success: boolean; message?: string }>(
    '/api/admin/project-settings/secrets',
    secrets
  );
}
