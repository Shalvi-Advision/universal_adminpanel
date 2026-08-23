import type { ApiResponse, PaginatedResponse } from 'src/types/api';
import type {
  LoyaltyTier,
  LoyaltyRule,
  LoyaltyReward,
  LoyaltyCampaign,
  LoyaltyAuditLog,
  LoyaltyReferral,
  LoyaltyChallenge,
  LoyaltyTierPayload,
  LoyaltyRulePayload,
  LoyaltyTransaction,
  LoyaltyCardSettings,
  LoyaltyRewardPayload,
  LoyaltyDashboardStats,
  LoyaltyAccountSummary,
  LoyaltyCampaignPayload,
  LoyaltyChallengePayload,
} from 'src/types/loyalty';

import { apiClient } from 'src/utils/api-client';

// ----------------------------------------------------------------------
// Dashboard
// ----------------------------------------------------------------------

export const getLoyaltyDashboard = (): Promise<ApiResponse<LoyaltyDashboardStats>> =>
  apiClient.get('/api/admin/loyalty/dashboard');

// ----------------------------------------------------------------------
// Rules
// ----------------------------------------------------------------------

export const getLoyaltyRules = (): Promise<ApiResponse<LoyaltyRule[]>> =>
  apiClient.get('/api/admin/loyalty/rules');
export const createLoyaltyRule = (payload: LoyaltyRulePayload): Promise<ApiResponse<LoyaltyRule>> =>
  apiClient.post('/api/admin/loyalty/rules', payload);
export const updateLoyaltyRule = (
  id: string,
  payload: Partial<LoyaltyRulePayload>
): Promise<ApiResponse<LoyaltyRule>> => apiClient.put(`/api/admin/loyalty/rules/${id}`, payload);
export const setLoyaltyRuleStatus = (
  id: string,
  status: 'ACTIVE' | 'INACTIVE'
): Promise<ApiResponse<LoyaltyRule>> => apiClient.patch(`/api/admin/loyalty/rules/${id}/status`, { status });

// ----------------------------------------------------------------------
// Rewards
// ----------------------------------------------------------------------

export const getLoyaltyRewards = (params: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<LoyaltyReward>> => {
  const q = new URLSearchParams();
  if (params.page) q.append('page', String(params.page));
  if (params.limit) q.append('limit', String(params.limit));
  const qs = q.toString();
  return apiClient.get(`/api/admin/loyalty/rewards${qs ? `?${qs}` : ''}`);
};
export const createLoyaltyReward = (payload: LoyaltyRewardPayload): Promise<ApiResponse<LoyaltyReward>> =>
  apiClient.post('/api/admin/loyalty/rewards', payload);
export const updateLoyaltyReward = (
  id: string,
  payload: Partial<LoyaltyRewardPayload>
): Promise<ApiResponse<LoyaltyReward>> => apiClient.put(`/api/admin/loyalty/rewards/${id}`, payload);
export const deleteLoyaltyReward = (id: string): Promise<ApiResponse<null>> =>
  apiClient.delete(`/api/admin/loyalty/rewards/${id}`);

// ----------------------------------------------------------------------
// Tiers
// ----------------------------------------------------------------------

export const getLoyaltyTiers = (): Promise<ApiResponse<LoyaltyTier[]>> =>
  apiClient.get('/api/admin/loyalty/tiers');
export const createLoyaltyTier = (payload: LoyaltyTierPayload): Promise<ApiResponse<LoyaltyTier>> =>
  apiClient.post('/api/admin/loyalty/tiers', payload);
export const updateLoyaltyTier = (
  id: string,
  payload: Partial<LoyaltyTierPayload>
): Promise<ApiResponse<LoyaltyTier>> => apiClient.put(`/api/admin/loyalty/tiers/${id}`, payload);

// ----------------------------------------------------------------------
// Loyalty Card settings
// ----------------------------------------------------------------------

export const getLoyaltyCardSettings = (): Promise<ApiResponse<LoyaltyCardSettings>> =>
  apiClient.get('/api/admin/loyalty/card-settings');
export const updateLoyaltyCardSettings = (
  payload: Partial<LoyaltyCardSettings>
): Promise<ApiResponse<LoyaltyCardSettings>> => apiClient.put('/api/admin/loyalty/card-settings', payload);

// ----------------------------------------------------------------------
// Campaigns
// ----------------------------------------------------------------------

export const getLoyaltyCampaigns = (): Promise<ApiResponse<LoyaltyCampaign[]>> =>
  apiClient.get('/api/admin/loyalty/campaigns');
export const createLoyaltyCampaign = (payload: LoyaltyCampaignPayload): Promise<ApiResponse<LoyaltyCampaign>> =>
  apiClient.post('/api/admin/loyalty/campaigns', payload);
export const updateLoyaltyCampaign = (
  id: string,
  payload: Partial<LoyaltyCampaignPayload>
): Promise<ApiResponse<LoyaltyCampaign>> => apiClient.put(`/api/admin/loyalty/campaigns/${id}`, payload);
export const deleteLoyaltyCampaign = (id: string): Promise<ApiResponse<null>> =>
  apiClient.delete(`/api/admin/loyalty/campaigns/${id}`);

// ----------------------------------------------------------------------
// Challenges
// ----------------------------------------------------------------------

export const getLoyaltyChallenges = (): Promise<ApiResponse<LoyaltyChallenge[]>> =>
  apiClient.get('/api/admin/loyalty/challenges');
export const createLoyaltyChallenge = (payload: LoyaltyChallengePayload): Promise<ApiResponse<LoyaltyChallenge>> =>
  apiClient.post('/api/admin/loyalty/challenges', payload);
export const updateLoyaltyChallenge = (
  id: string,
  payload: Partial<LoyaltyChallengePayload>
): Promise<ApiResponse<LoyaltyChallenge>> => apiClient.put(`/api/admin/loyalty/challenges/${id}`, payload);
export const deleteLoyaltyChallenge = (id: string): Promise<ApiResponse<null>> =>
  apiClient.delete(`/api/admin/loyalty/challenges/${id}`);

// ----------------------------------------------------------------------
// Accounts (customers)
// ----------------------------------------------------------------------

export const getLoyaltyAccounts = (
  params: { page?: number; limit?: number; search?: string; status?: string } = {}
): Promise<PaginatedResponse<LoyaltyAccountSummary>> => {
  const q = new URLSearchParams();
  if (params.page) q.append('page', String(params.page));
  if (params.limit) q.append('limit', String(params.limit));
  if (params.search) q.append('search', params.search);
  if (params.status) q.append('status', params.status);
  const qs = q.toString();
  return apiClient.get(`/api/admin/loyalty/accounts${qs ? `?${qs}` : ''}`);
};

export const getLoyaltyAccountDetail = (
  mobile: string
): Promise<ApiResponse<{ account: LoyaltyAccountSummary; user: unknown; transactions: LoyaltyTransaction[]; redemptions: unknown[] }>> =>
  apiClient.get(`/api/admin/loyalty/accounts/${mobile}`);

export const adjustLoyaltyPoints = (
  mobile: string,
  points: number,
  reason: string
): Promise<ApiResponse<{ balance: LoyaltyAccountSummary }>> =>
  apiClient.post(`/api/admin/loyalty/accounts/${mobile}/adjust`, { points, reason });

export const setLoyaltyAccountStatus = (
  mobile: string,
  status: 'ACTIVE' | 'SUSPENDED',
  reason?: string
): Promise<ApiResponse<LoyaltyAccountSummary>> =>
  apiClient.patch(`/api/admin/loyalty/accounts/${mobile}/status`, { status, reason });

// ----------------------------------------------------------------------
// Global ledger, referrals, audit logs
// ----------------------------------------------------------------------

export const getLoyaltyTransactions = (
  params: { page?: number; limit?: number; mobile?: string; type?: string; source?: string } = {}
): Promise<PaginatedResponse<LoyaltyTransaction>> => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) q.append(k, String(v)); });
  const qs = q.toString();
  return apiClient.get(`/api/admin/loyalty/transactions${qs ? `?${qs}` : ''}`);
};

export const getLoyaltyReferrals = (
  params: { page?: number; limit?: number; status?: string } = {}
): Promise<PaginatedResponse<LoyaltyReferral>> => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) q.append(k, String(v)); });
  const qs = q.toString();
  return apiClient.get(`/api/admin/loyalty/referrals${qs ? `?${qs}` : ''}`);
};

export const getLoyaltyAuditLogs = (
  params: { page?: number; limit?: number } = {}
): Promise<PaginatedResponse<LoyaltyAuditLog>> => {
  const q = new URLSearchParams();
  if (params.page) q.append('page', String(params.page));
  if (params.limit) q.append('limit', String(params.limit));
  const qs = q.toString();
  return apiClient.get(`/api/admin/loyalty/audit-logs${qs ? `?${qs}` : ''}`);
};
