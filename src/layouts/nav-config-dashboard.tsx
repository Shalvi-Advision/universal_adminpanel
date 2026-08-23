import type { PermissionSection } from 'src/types/permissions';

import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} />;
const iconify = (name: string) => <Iconify width={24} icon={name as any} />;

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
  children?: NavItem[];
  permissionSection?: PermissionSection;
  superAdminOnly?: boolean;
};

export const navData: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: icon('ic-analytics'),
    permissionSection: 'dashboard',
  },
  {
    title: 'Orders',
    path: '/orders',
    icon: iconify('solar:clipboard-list-bold-duotone'),
    permissionSection: 'orders',
  },
  {
    title: 'Users',
    path: '/users',
    icon: icon('ic-user'),
    permissionSection: 'users',
  },
  {
    title: 'Notifications',
    path: '/notifications',
    icon: iconify('solar:bell-bold-duotone'),
    permissionSection: 'notifications',
  },
  {
    title: 'Offers',
    path: '/offers',
    icon: iconify('solar:tag-price-bold-duotone'),
    permissionSection: 'offers',
  },
  {
    title: 'Reports',
    path: '/reports/procurement',
    icon: iconify('solar:chart-2-bold-duotone'),
    permissionSection: 'reports',
    children: [
      {
        title: 'Procurement',
        path: '/reports/procurement',
        icon: iconify('solar:cart-check-bold-duotone'),
      },
    ],
  },
  {
    title: 'Loyalty',
    path: '/loyalty/dashboard',
    icon: iconify('solar:medal-star-bold-duotone'),
    permissionSection: 'loyalty',
    children: [
      { title: 'Dashboard', path: '/loyalty/dashboard', icon: iconify('solar:chart-2-bold-duotone') },
      { title: 'Earning Rules', path: '/loyalty/rules', icon: iconify('solar:widget-add-bold-duotone') },
      { title: 'Rewards', path: '/loyalty/rewards', icon: iconify('solar:gift-bold-duotone') },
      { title: 'Tiers', path: '/loyalty/tiers', icon: iconify('solar:crown-star-bold-duotone') },
      { title: 'Loyalty Card', path: '/loyalty/card-settings', icon: iconify('solar:card-2-bold-duotone') },
      { title: 'Campaigns', path: '/loyalty/campaigns', icon: iconify('solar:fire-bold-duotone') },
      { title: 'Challenges', path: '/loyalty/challenges', icon: iconify('solar:flag-bold-duotone') },
      { title: 'Customers', path: '/loyalty/customers', icon: iconify('solar:users-group-rounded-bold-duotone') },
      { title: 'Referrals', path: '/loyalty/referrals', icon: iconify('solar:users-group-two-rounded-bold-duotone') },
      { title: 'Audit Logs', path: '/loyalty/audit-logs', icon: iconify('solar:document-text-bold-duotone') },
    ],
  },
  {
    title: 'Ecommerce',
    path: '/ecommerce/departments',
    icon: icon('ic-cart'),
    permissionSection: 'ecommerce',
    children: [
      {
        title: 'Departments',
        path: '/ecommerce/departments',
        icon: iconify('solar:buildings-bold-duotone'),
      },
      {
        title: 'Categories',
        path: '/ecommerce/categories',
        icon: iconify('solar:folder-bold-duotone'),
      },
      {
        title: 'Subcategories',
        path: '/ecommerce/subcategories',
        icon: iconify('solar:folder-with-files-bold-duotone'),
      },
      {
        title: 'Products',
        path: '/ecommerce/products',
        icon: iconify('solar:box-bold-duotone'),
      },
    ],
  },
  {
    title: 'Outlet',
    path: '/outlet/pincodes',
    icon: icon('ic-user'),
    permissionSection: 'outlet',
    children: [
      {
        title: 'Pincodes',
        path: '/outlet/pincodes',
        icon: iconify('solar:map-point-bold-duotone'),
      },
      {
        title: 'Stores',
        path: '/outlet/stores',
        icon: iconify('solar:shop-bold-duotone'),
      },
      {
        title: 'Payment Modes',
        path: '/outlet/payment-modes',
        icon: iconify('solar:card-bold-duotone'),
      },
      {
        title: 'Delivery Slots',
        path: '/outlet/delivery-slots',
        icon: iconify('solar:clock-circle-bold-duotone'),
      },
      {
        title: 'Delivery Fees',
        path: '/outlet/delivery-fees',
        icon: iconify('solar:delivery-bold-duotone'),
      },
    ],
  },
  {
    title: 'Dynamic Section',
    path: '/dynamic/best-sellers',
    icon: icon('ic-blog'),
    permissionSection: 'dynamicSection',
    children: [
      {
        title: 'Best Sellers',
        path: '/dynamic/best-sellers',
        icon: iconify('solar:star-bold-duotone'),
      },
      {
        title: 'Top Sellers',
        path: '/dynamic/top-sellers',
        icon: iconify('solar:medal-star-bold-duotone'),
      },
      {
        title: 'Advertisements',
        path: '/dynamic/advertisements',
        icon: iconify('solar:tv-bold-duotone'),
      },
      {
        title: 'Popular Categories',
        path: '/dynamic/popular-categories',
        icon: iconify('solar:fire-bold-duotone'),
      },
      {
        title: 'Banners',
        path: '/dynamic/banners',
        icon: iconify('solar:gallery-bold-duotone'),
      },
      {
        title: 'Seasonal Categories',
        path: '/dynamic/seasonal-categories',
        icon: iconify('solar:snowflake-bold-duotone'),
      },
    ],
  },
  {
    title: 'Digital Cart',
    path: '/digital-cart',
    icon: iconify('solar:cart-large-bold-duotone'),
    permissionSection: 'digitalCart',
    children: [
      {
        title: 'Products',
        path: '/digital-cart',
        icon: iconify('solar:box-bold-duotone'),
      },
      {
        title: 'Digital Cart UI',
        path: '/digital-cart/ui',
        icon: iconify('solar:palette-bold-duotone'),
      },
    ],
  },
  // Grouped by what a setting *is*, not by which screen shows it: theme
  // tokens apply to every screen at once, screen content is per-screen, and
  // integration keys are a different audience and blast radius entirely.
  {
    title: 'Mobile App',
    path: '/branding',
    icon: iconify('solar:smartphone-bold-duotone'),
    permissionSection: 'dynamicSection',
    children: [
      {
        title: 'Theme',
        path: '/branding',
        icon: iconify('solar:palette-bold-duotone'),
      },
      {
        title: 'Screens',
        path: '/screens/splash',
        icon: iconify('solar:widget-4-bold-duotone'),
        children: [
          {
            title: 'Splash',
            path: '/screens/splash',
            icon: iconify('solar:stars-bold-duotone'),
          },
          {
            title: 'Home',
            path: '/screens/home',
            icon: iconify('solar:home-2-bold-duotone'),
          },
          {
            title: 'Onboarding',
            path: '/screens/onboarding',
            icon: iconify('solar:slider-horizontal-bold-duotone'),
          },
          {
            title: 'Content',
            path: '/screens/content',
            icon: iconify('solar:document-text-bold-duotone'),
          },
        ],
      },
      {
        title: 'App Config',
        path: '/app-config',
        icon: iconify('solar:settings-bold-duotone'),
      },
      {
        title: 'Integrations',
        path: '/integrations',
        icon: iconify('solar:key-bold-duotone'),
        superAdminOnly: true,
      },
    ],
  },
  {
    title: 'Admin Permissions',
    path: '/admin-permissions',
    icon: iconify('solar:shield-keyhole-bold-duotone'),
    superAdminOnly: true,
  },
];
