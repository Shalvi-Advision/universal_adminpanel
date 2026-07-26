import { apiClient } from 'src/utils/api-client';

// The mobile app's home layout: which sections exist, in what order, and what
// backs each one. Content stays in the collections it always lived in — a
// section only points at one.

export interface HomeSectionSource {
  collection_name: string;
  sequence: number | null;
  filter?: Record<string, unknown>;
}

export interface HomeSection {
  _id: string;
  type: string;
  title: string;
  source: HomeSectionSource;
  sequence: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  audience: string;
  store_codes: string[];
  style: { background_color: string };
  config: Record<string, unknown>;
}

export interface SourceOption {
  sequence: number | null;
  title: string;
  is_active: boolean;
}

export interface HomeSectionsResponse {
  success: boolean;
  count: number;
  data: HomeSection[];
  meta: {
    section_types: string[];
    personalized_types: string[];
    audiences: string[];
    sources: Record<string, SourceOption[]>;
  };
}

export type HomeSectionInput = Partial<
  Omit<HomeSection, '_id' | 'source'> & { source: HomeSectionSource }
>;

export async function getHomeSections(): Promise<HomeSectionsResponse> {
  return apiClient.get<HomeSectionsResponse>('/api/admin/home-sections');
}

export async function createHomeSection(section: HomeSectionInput) {
  return apiClient.post<{ success: boolean; data: HomeSection }>(
    '/api/admin/home-sections',
    section
  );
}

export async function updateHomeSection(id: string, section: HomeSectionInput) {
  return apiClient.put<{ success: boolean; data: HomeSection }>(
    `/api/admin/home-sections/${id}`,
    section
  );
}

export async function deleteHomeSection(id: string) {
  return apiClient.delete<{ success: boolean }>(`/api/admin/home-sections/${id}`);
}

export async function reorderHomeSections(ids: string[]) {
  return apiClient.put<{ success: boolean; data: HomeSection[] }>(
    '/api/admin/home-sections/reorder',
    { ids }
  );
}

/** Turns the app's built-in arrangement into editable rows. Visually a no-op. */
export async function adoptCurrentLayout() {
  return apiClient.post<{ success: boolean; message: string; data: HomeSection[] }>(
    '/api/admin/home-sections/adopt',
    {}
  );
}

// ----------------------------------------------------------------------
// Preview
//
// The panel calls the same public endpoint the mobile app calls, so the
// preview shows what the app will actually draw — real banners, real category
// tiles, real products — rather than a guess assembled in the browser.

export interface FeedSection {
  id: string;
  type: string;
  slot: number;
  title: string;
  style: { background_color?: string };
  personalized: boolean;
  ends_at: string | null;
  audience: string;
  config: Record<string, unknown>;
  items: Record<string, any>[];
}

export interface HomeFeedResponse {
  success: boolean;
  schema_version: number;
  count: number;
  data: FeedSection[];
}

/** The feed for one store, exactly as the app receives it. */
export async function previewHomeFeed(storeCode: string): Promise<HomeFeedResponse> {
  return apiClient.post<HomeFeedResponse>('/api/home/feed', { store_code: storeCode });
}
