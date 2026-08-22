import { apiClient } from 'src/utils/api-client';

// One row of the procurement report — how much of a product to buy in for
// restocking, based on everything ordered on a given day.
export interface ProcurementReportRow {
  sr_no: number;
  p_code: string;
  product_name: string;
  pack_size: string;
  ordered_qty: number;
  total_required_qty: string;
}

export interface ProcurementReportResponse {
  success: boolean;
  date: string;
  order_count: number;
  product_count: number;
  data: ProcurementReportRow[];
}

// GET /api/admin/reports/procurement?date=YYYY-MM-DD
export async function getProcurementReport(date: string): Promise<ProcurementReportResponse> {
  const params = new URLSearchParams({ date });
  return apiClient.get<ProcurementReportResponse>(
    `/api/admin/reports/procurement?${params.toString()}`
  );
}
