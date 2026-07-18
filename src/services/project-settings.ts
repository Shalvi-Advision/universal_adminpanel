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
