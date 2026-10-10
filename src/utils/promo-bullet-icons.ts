import type { PromoBulletIcon } from 'src/services/promo-page';

// Maps each fixed bullet-icon key (stored in the backend) to an Iconify icon
// name + human label. Shared by the admin settings page (icon picker) and the
// public landing page (renderer) so they never drift apart.
export const PROMO_BULLET_ICON_META: Record<PromoBulletIcon, { iconify: string; label: string }> = {
  diamond: { iconify: 'solar:diamond-bold-duotone', label: 'Diamond (Luxury)' },
  search: { iconify: 'solar:magnifer-bold-duotone', label: 'Magnifier (Discover)' },
  gift: { iconify: 'solar:gift-bold-duotone', label: 'Gift (Savings)' },
  star: { iconify: 'solar:star-bold-duotone', label: 'Star (Curated)' },
  truck: { iconify: 'solar:delivery-bold-duotone', label: 'Truck (Delivery)' },
  percent: { iconify: 'solar:tag-price-bold-duotone', label: 'Percent (Discount)' }
};
