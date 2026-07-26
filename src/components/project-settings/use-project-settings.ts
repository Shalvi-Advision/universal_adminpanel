import type { ProjectSettingsConfig } from 'src/services/project-settings';

import { useState, useEffect, useCallback } from 'react';

import { getProjectSettings, updateProjectSettings } from 'src/services/project-settings';

// ----------------------------------------------------------------------

type Config = Partial<ProjectSettingsConfig>;

/**
 * Load/edit/save the current project's config.
 *
 * Both settings pages (App Branding and App Settings) read and write the same
 * `config` document through /api/admin/project-settings, and the backend only
 * `$set`s the keys it is sent — so each page saves its own fields without
 * clobbering the other's.
 */
export function useProjectSettings() {
  const [config, setConfig] = useState<Config>({});
  const [clientName, setClientName] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getProjectSettings();
      if (response.success) {
        setConfig(response.data.config as Config);
        setClientName(response.data.client_name);
        setProjectCode(response.data.project_code);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load project settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /** Curried setter for a value-only field (colour picker, image upload). */
  const set = (key: keyof ProjectSettingsConfig) => (value: string) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  /** Curried setter for a text input's change event. */
  const setText = (key: keyof ProjectSettingsConfig) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setConfig((prev) => ({ ...prev, [key]: e.target.value }));

  /**
   * Saves [fields] only. Passing the page's own keys keeps a save on one page
   * from writing back stale values belonging to the other.
   */
  const save = async (fields: (keyof ProjectSettingsConfig)[]) => {
    try {
      setSaving(true);
      setError('');
      const payload: Config = {};
      fields.forEach((key) => {
        payload[key] = config[key] ?? '';
      });

      const response = await updateProjectSettings(payload);
      if (response.success) {
        setConfig(response.data.config as Config);
        setSaved(true);
      } else {
        setError(response.message || 'Failed to save');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save project settings');
    } finally {
      setSaving(false);
    }
  };

  return {
    config,
    clientName,
    projectCode,
    loading,
    saving,
    error,
    saved,
    set,
    setText,
    save,
    dismissSaved: () => setSaved(false),
  };
}
