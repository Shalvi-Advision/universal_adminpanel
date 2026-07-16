import { apiClient } from 'src/utils/api-client';

export interface Project {
  project_code: string;
  client_name: string;
  config?: {
    app_name?: string;
  };
}

export interface ProjectsResponse {
  success: boolean;
  count: number;
  data: Project[];
}

// List active clients from the tenant registry (JWT-protected)
export const getProjects = (): Promise<ProjectsResponse> =>
  apiClient.get<ProjectsResponse>('/api/projects');
