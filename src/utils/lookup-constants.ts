// Dropdown/multi-select-population calls want the full list, not a paginated
// page — the by-store endpoints default to limit=20, which would silently
// truncate any tenant with more departments/categories/subcategories than
// that.
export const LOOKUP_LIST_LIMIT = 500;
