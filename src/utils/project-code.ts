// Selected project (tenant) code — shared between the React context and the
// non-React API layer. The universal backend routes every request to the
// matching client DB via the X-Project-Code header.

export const PROJECT_CODE_STORAGE_KEY = 'selected_project_code';

/// No tenant selected yet. Empty rather than a real client's code: the previous
/// default meant an admin scoped to another client sent RET5677 on every request
/// made before GET /api/projects resolved. ProjectSelector fills this in from
/// the API — the first project the signed-in admin is allowed on.
export const NO_PROJECT_CODE = '';

export const getSelectedProjectCode = (): string => {
  try {
    return localStorage.getItem(PROJECT_CODE_STORAGE_KEY) || NO_PROJECT_CODE;
  } catch {
    return NO_PROJECT_CODE;
  }
};
