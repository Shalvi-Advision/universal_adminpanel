import type { Offer, OfferType } from 'src/types/api';

export const OFFER_TYPE_OPTIONS: { value: OfferType; label: string; hint: string }[] = [
  { value: 'cart_discount', label: 'Cart Discount', hint: 'Flat ₹ or % off the whole cart' },
  { value: 'category_discount', label: 'Category / Brand Discount', hint: 'Flat ₹ or % off selected departments, categories, brands or products' },
  { value: 'buy_x_get_y', label: 'Buy X Get Y', hint: 'Buy some units, get the cheapest ones free or discounted' },
  { value: 'product_deal', label: 'Product Deal (Steal Deal)', hint: 'Selected products at a special price' },
  { value: 'free_delivery', label: 'Free Delivery', hint: 'Waives the delivery charge' },
];

export const OFFER_TYPE_COLORS: Record<OfferType, 'primary' | 'secondary' | 'warning' | 'info' | 'success'> = {
  cart_discount: 'primary',
  category_discount: 'secondary',
  buy_x_get_y: 'info',
  product_deal: 'warning',
  free_delivery: 'success',
};

export const offerTypeOf = (offer: Offer): OfferType => offer.offer_type || 'cart_discount';

export const offerTypeLabel = (type: OfferType) =>
  OFFER_TYPE_OPTIONS.find((o) => o.value === type)?.label.replace(' (Steal Deal)', '') ?? type;

export const ordinal = (n: number) => {
  const suffix = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${suffix[(v - 20) % 10] || suffix[v] || suffix[0]}`;
};

/** "All customers", "1st order", "Joined ≤ 7 days" … */
export const eligibilityLabel = (offer: Offer) => {
  switch (offer.customer_eligibility) {
    case 'order_number':
      return `${[...(offer.eligible_order_numbers || [])].sort((a, b) => a - b).map(ordinal).join(', ')} order`;
    case 'new_user':
      return `New users (${offer.new_user_within_days} day${offer.new_user_within_days === 1 ? '' : 's'})`;
    default:
      return 'All customers';
  }
};

/** What the offer gives, for the list's Benefit column. */
export const benefitLabel = (offer: Offer) => {
  const type = offerTypeOf(offer);
  const value = offer.discount_type === 'percentage' ? `${offer.discount_amount}%` : `₹${offer.discount_amount}`;
  const cap = offer.discount_type === 'percentage' && offer.max_discount ? ` (max ₹${offer.max_discount})` : '';
  switch (type) {
    case 'product_deal':
      return `${offer.deal_products?.length || 0} product(s)`;
    case 'free_delivery':
      return 'Free delivery';
    case 'buy_x_get_y': {
      const pct = offer.get_discount_percent ?? 100;
      return `Buy ${offer.buy_quantity} get ${offer.get_quantity} ${pct >= 100 ? 'free' : `${pct}% off`}`;
    }
    case 'category_discount':
      return `${value} off selected items${cap}`;
    default:
      return `${value} off${cap}`;
  }
};
