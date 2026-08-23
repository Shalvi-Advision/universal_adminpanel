// Types for the Loyalty & Rewards admin module. Kept in its own file rather
// than growing src/types/api.ts further - mirrors src/types/permissions.ts.

export interface LoyaltyDashboardStats {
  totalMembers: number;
  activeMembers: number;
  pointsIssued: number;
  pointsRedeemed: number;
  pointsExpired: number;
  outstandingPoints: number;
  rewardRedemptions: number;
  referralConversions: number;
  redemptionRate: number;
  topRewards: { name: string; count: number }[];
}

export type LoyaltyRuleEvent =
  | 'REGISTRATION' | 'FIRST_ORDER' | 'ORDER_DELIVERED' | 'PRODUCT_REVIEW'
  | 'PHOTO_REVIEW' | 'REFERRAL' | 'BIRTHDAY' | 'FIRST_APP_ORDER';

export interface LoyaltyRule {
  _id: string;
  code: string;
  name: string;
  event: LoyaltyRuleEvent;
  pointsType: 'FIXED' | 'FIXED_PER_AMOUNT';
  pointsValue: number;
  amountValue: number;
  multiplier: number;
  minimumOrderValue: number;
  maximumPoints: number | null;
  eligibleOrderStatuses: string[];
  pendingPeriodDays: number;
  status: 'ACTIVE' | 'INACTIVE';
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
}
export type LoyaltyRulePayload = Omit<LoyaltyRule, '_id' | 'createdAt'>;

export type LoyaltyRewardType =
  | 'FIXED_DISCOUNT' | 'PERCENTAGE_DISCOUNT' | 'FREE_SHIPPING'
  | 'CASHBACK' | 'FREE_PRODUCT' | 'SPECIAL_OFFER';

export interface LoyaltyReward {
  _id: string;
  name: string;
  description: string;
  image: string | null;
  type: LoyaltyRewardType;
  pointsRequired: number;
  discountValue: number;
  minimumOrderValue: number;
  maximumDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number | null;
  applicableTiers: string[];
  validFrom: string | null;
  validUntil: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}
export type LoyaltyRewardPayload = Omit<LoyaltyReward, '_id' | 'usedCount' | 'createdAt'>;

export interface LoyaltyTierBenefit {
  type: string;
  value: unknown;
}
export interface LoyaltyTier {
  _id: string;
  code: string;
  name: string;
  minimumSpend: number;
  maximumSpend: number | null;
  pointMultiplier: number;
  benefits: LoyaltyTierBenefit[];
  rank: number;
  status: 'ACTIVE' | 'INACTIVE';
  cardPrimaryColor: string;
  cardAccentColor: string;
  createdAt: string;
}
export type LoyaltyTierPayload = Omit<LoyaltyTier, '_id' | 'createdAt'>;

export interface LoyaltyCardBenefit {
  icon: string;
  title: string;
  subtitle: string;
}
export interface LoyaltyCardSettings {
  brand_title: string;
  brand_subtitle: string;
  member_label: string;
  card_number_prefix: string;
  thank_you_message: string;
  benefits: LoyaltyCardBenefit[];
  support_phone: string;
  website: string;
  terms_text: string;
}

export interface LoyaltyCampaign {
  _id: string;
  name: string;
  description: string;
  multiplier: number;
  minimumOrderValue: number;
  applicableProducts: string[];
  applicableTiers: string[];
  maximumBonusPoints: number | null;
  validFrom: string;
  validUntil: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}
export type LoyaltyCampaignPayload = Omit<LoyaltyCampaign, '_id' | 'createdAt'>;

export type LoyaltyChallengeType = 'PURCHASE_COUNT' | 'SPEND_AMOUNT' | 'CATEGORY_COUNT' | 'FIRST_APP_ORDER';
export interface LoyaltyChallenge {
  _id: string;
  name: string;
  description: string;
  type: LoyaltyChallengeType;
  targetValue: number;
  rewardPoints: number;
  validFrom: string;
  validUntil: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}
export type LoyaltyChallengePayload = Omit<LoyaltyChallenge, '_id' | 'createdAt'>;

export interface LoyaltyAccountSummary {
  _id: string;
  userId: string;
  mobile: string;
  availablePoints: number;
  pendingPoints: number;
  lifetimeEarnedPoints: number;
  lifetimeRedeemedPoints: number;
  lifetimeExpiredPoints: number;
  lifetimeReversedPoints: number;
  eligibleLifetimeSpend: number;
  currentTierCode: string | null;
  referralCode: string;
  status: 'ACTIVE' | 'SUSPENDED';
  suspendedReason: string | null;
  user: { name?: string; mobile: string; email?: string } | null;
}

export interface LoyaltyTransaction {
  _id: string;
  mobile: string;
  type: 'CREDIT' | 'DEBIT' | 'EXPIRATION' | 'REVERSAL' | 'ADJUSTMENT';
  source: string;
  points: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId: string | null;
  metadata: Record<string, unknown>;
  status: 'PENDING' | 'COMPLETED' | 'REVERSED';
  availableAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface LoyaltyRedemption {
  _id: string;
  mobile: string;
  rewardId: string;
  pointsSpent: number;
  couponCode: string;
  rewardSnapshot: { name: string; type: string; discountValue: number; maximumDiscount: number | null; minimumOrderValue: number };
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';
  orderId: string | null;
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface LoyaltyReferral {
  _id: string;
  referrerMobile: string;
  referredMobile: string;
  referralCode: string;
  status: 'PENDING' | 'QUALIFIED' | 'COMPLETED' | 'REJECTED';
  qualifyingOrderId: string | null;
  referrerReward: { points: number; status: 'PENDING' | 'CREDITED' };
  referredReward: { couponValue: number; status: 'PENDING' | 'CREDITED' };
  completedAt: string | null;
  createdAt: string;
}

export interface LoyaltyAuditLog {
  _id: string;
  action: string;
  targetType: string;
  targetId: string;
  performedBy: { name?: string; mobile: string; email?: string } | string;
  reason: string;
  before: unknown;
  after: unknown;
  createdAt: string;
}
