// Selected project (tenant) code — shared between the React context and the
// non-React API layer. The universal backend routes every request to the
// matching client DB via the X-Project-Code header.

export const PROJECT_CODE_STORAGE_KEY = 'selected_project_code';

export const DEFAULT_PROJECT_CODE = 'RET5677'; // Pagariya Mart

export const getSelectedProjectCode = (): string => {
  try {
    return localStorage.getItem(PROJECT_CODE_STORAGE_KEY) || DEFAULT_PROJECT_CODE;
  } catch {
    return DEFAULT_PROJECT_CODE;
  }
};
