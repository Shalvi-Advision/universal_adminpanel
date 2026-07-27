import packageJson from '../package.json';

// ----------------------------------------------------------------------

export type ConfigValue = {
  appName: string;
  appVersion: string;
  apiBaseUrl: string;
  /**
   * Origin serving the Flutter Web build of the mobile app.
   *
   * Empty disables the live preview and leaves the wireframe in place, so a
   * deployment that has not published the Flutter build yet degrades to the
   * previous behaviour rather than showing a broken frame.
   */
  previewOrigin: string;
};

export const CONFIG: ConfigValue = {
  appName: 'Shalvi Advision',
  appVersion: packageJson.version,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5008',
  previewOrigin: import.meta.env.VITE_PREVIEW_ORIGIN || '',
};
