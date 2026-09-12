import type {
  TopSellerProduct,
  BestSellerProduct,
  PopularCategoryItem,
  AdvertisementProduct,
  SeasonalCategoryItem,
} from 'src/types/api';

/**
 * Parse CSV file content into rows
 */
export function parseCSV(content: string): string[][] {
  const lines = content.split('\n').filter((line) => line.trim());
  return lines.map((line) => {
    // Handle CSV with quoted fields
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const fields: string[] = [];
    let match;

    while ((match = regex.exec(line)) !== null) {
      let field = match[1];
      // Remove quotes and handle escaped quotes
      if (field.startsWith('"') && field.endsWith('"')) {
        field = field.slice(1, -1).replace(/""/g, '"');
      }
      fields.push(field.trim());
    }

    return fields.filter((f) => f !== '');
  });
}

/**
 * Convert CSV rows to object array using headers
 */
export function csvToObjects<T>(rows: string[][]): T[] {
  if (rows.length < 2) return [];

  const headers = rows[0];
  const dataRows = rows.slice(1);

  return dataRows.map((row) => {
    const obj: any = {};
    headers.forEach((header, index) => {
      const value = row[index]?.trim() || '';
      obj[header] = value;
    });
    return obj as T;
  });
}

/**
 * Parse Best Seller products from CSV
 */
export function parseBestSellerProducts(content: string): BestSellerProduct[] {
  const rows = parseCSV(content);
  const objects = csvToObjects<any>(rows);

  return objects.map((obj, index) => ({
    p_code: obj.p_code || '',
    position: obj.position ? Number(obj.position) : index + 1,
    metadata: {
      badge: obj.badge || undefined,
      tagline: obj.tagline || undefined,
      highlight: obj.highlight === 'true' || obj.highlight === '1',
    },
    redirect_url: obj.redirect_url || '',
  }));
}

/**
 * Parse Top Seller products from CSV
 */
export function parseTopSellerProducts(content: string): TopSellerProduct[] {
  const rows = parseCSV(content);
  const objects = csvToObjects<any>(rows);

  return objects.map((obj, index) => ({
    p_code: obj.p_code || '',
    position: obj.position ? Number(obj.position) : index + 1,
    metadata: {
      badge: obj.badge || undefined,
      tagline: obj.tagline || undefined,
      highlight: obj.highlight === 'true' || obj.highlight === '1',
    },
    redirect_url: obj.redirect_url || '',
  }));
}

/**
 * Parse Advertisement products from CSV
 */
export function parseAdvertisementProducts(content: string): AdvertisementProduct[] {
  const rows = parseCSV(content);
  const objects = csvToObjects<any>(rows);

  return objects.map((obj, index) => ({
    p_code: obj.p_code || '',
    position: obj.position ? Number(obj.position) : index + 1,
    redirect_url: obj.redirect_url || '',
    metadata: {},
  }));
}

/**
 * Parse Popular Category subcategories from CSV
 */
export function parsePopularCategoryItems(content: string): PopularCategoryItem[] {
  const rows = parseCSV(content);
  const objects = csvToObjects<any>(rows);

  return objects.map((obj, index) => ({
    sub_category_id: obj.sub_category_id || '',
    reference_type: obj.reference_type === 'category' ? 'category' : 'subcategory',
    position: obj.position ? Number(obj.position) : index + 1,
    metadata: {
      badge: obj.badge || undefined,
      highlight: obj.highlight === 'true' || obj.highlight === '1',
    },
    redirect_url: obj.redirect_url || '',
    store_code: obj.store_code || undefined,
  }));
}

/**
 * Parse Seasonal Category subcategories from CSV
 */
export function parseSeasonalCategoryItems(content: string): SeasonalCategoryItem[] {
  const rows = parseCSV(content);
  const objects = csvToObjects<any>(rows);

  return objects.map((obj, index) => ({
    sub_category_id: obj.sub_category_id || '',
    reference_type: obj.reference_type === 'category' ? 'category' : 'subcategory',
    position: obj.position ? Number(obj.position) : index + 1,
    redirect_url: obj.redirect_url || '',
    metadata: {},
    store_code: obj.store_code || undefined,
  }));
}

/**
 * Validate CSV headers
 */
export function validateCSVHeaders(content: string, requiredHeaders: string[]): boolean {
  const rows = parseCSV(content);
  if (rows.length === 0) return false;

  const headers = rows[0].map((h) => h.toLowerCase().trim());
  return requiredHeaders.every((required) => headers.includes(required.toLowerCase()));
}

/**
 * Download CSV template
 */
export function downloadCSVTemplate(templateName: string): void {
  const link = document.createElement('a');
  link.href = `/templates/${templateName}`;
  link.download = templateName;
  link.click();
}
