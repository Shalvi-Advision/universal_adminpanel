import type { Store, UserAddress, PaymentMode, PaginatedResponse } from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// A Razorpay payment captured with no matching order — flagged by the
// backend's webhook (routes/webhook-razorpay.js) or its reconciliation
// sweep (scripts/reconcile_razorpay_payments.js). See models/PaymentRecoveryCase.js.
export interface PaymentRecoveryHistoryEntry {
  status: string;
  changed_at: string;
  changed_by_role?: 'admin' | 'system';
  changed_by_id?: string;
  changed_by_name?: string;
  note?: string;
}

export type PaymentRecoveryStatus = 'open' | 'resolved' | 'dismissed';
export type PaymentRecoveryResolution = 'order_created' | 'refunded' | 'dismissed';
export type PaymentRecoverySource = 'webhook' | 'reconciliation';

export interface PaymentRecoveryCase {
  _id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  amount: number;
  currency: string;
  method?: string;
  captured_at?: string;
  mobile_no?: string;
  customer_name?: string;
  temp_order_id?: string;
  // Frozen at Razorpay-order-creation time, before payment — what's actually
  // being restored, immune to the customer having since changed their live
  // cart. Absent on cases whose Razorpay order predates this feature.
  cart_snapshot?: {
    store_code?: string;
    items: { p_code: string; product_name?: string; quantity: number; unit_price?: number; total_price?: number; store_code: string }[];
  };
  source: PaymentRecoverySource;
  status: PaymentRecoveryStatus;
  resolution?: PaymentRecoveryResolution;
  resolved_order_id?: string;
  resolved_order_number?: string;
  resolved_by?: string;
  resolved_at?: string;
  history?: PaymentRecoveryHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

// Suggested defaults for the Restore form — computed server-side from the
// case's mobile number so the admin isn't guessing at store/slot/address.
export interface PaymentRecoveryStoreSuggestion {
  store_code: Store['store_code'];
  name: string;
  delivery_start_offset_days: number;
  slots: { iddelivery_slot: number; delivery_slot_from: string; delivery_slot_to: string; store_code: string }[];
}

export interface PaymentRecoveryCaseDetail {
  case: PaymentRecoveryCase;
  suggestions: {
    stores: PaymentRecoveryStoreSuggestion[];
    addresses: UserAddress[];
    payment_modes: Pick<PaymentMode, 'idpayment_mode' | 'payment_mode_name'>[];
    cart_item_count: number;
    cart_subtotal: number;
  };
}

export interface PaymentRecoveryQueryParams {
  page?: number;
  limit?: number;
  status?: PaymentRecoveryStatus;
}

export interface RestorePaymentRecoveryBody {
  store_code: string;
  fulfillment_type?: 'delivery' | 'pickup';
  delivery_slot_id: number;
  delivery_date: string;
  address_id?: string;
  payment_mode_id: number;
}

export async function getPaymentRecoveryCases(
  params: PaymentRecoveryQueryParams = {}
): Promise<PaginatedResponse<PaymentRecoveryCase>> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', String(params.page));
  if (params.limit) queryParams.append('limit', String(params.limit));
  if (params.status) queryParams.append('status', params.status);

  const queryString = queryParams.toString();
  return apiClient.get<PaginatedResponse<PaymentRecoveryCase>>(
    `/api/admin/payment-recovery${queryString ? `?${queryString}` : ''}`
  );
}

export async function getPaymentRecoveryCase(
  id: string
): Promise<{ success: boolean; data: PaymentRecoveryCaseDetail }> {
  return apiClient.get<{ success: boolean; data: PaymentRecoveryCaseDetail }>(
    `/api/admin/payment-recovery/${id}`
  );
}

export async function restorePaymentRecoveryCase(
  id: string,
  body: RestorePaymentRecoveryBody
): Promise<{ success: boolean; message?: string; data: { order_number: string; order_id: string; case: PaymentRecoveryCase } }> {
  return apiClient.post(`/api/admin/payment-recovery/${id}/restore`, body);
}

export async function refundPaymentRecoveryCase(
  id: string,
  reason?: string
): Promise<{ success: boolean; message?: string; data: { case: PaymentRecoveryCase } }> {
  return apiClient.post(`/api/admin/payment-recovery/${id}/refund`, { reason });
}

export async function dismissPaymentRecoveryCase(
  id: string,
  reason: string
): Promise<{ success: boolean; message?: string; data: { case: PaymentRecoveryCase } }> {
  return apiClient.post(`/api/admin/payment-recovery/${id}/dismiss`, { reason });
}
