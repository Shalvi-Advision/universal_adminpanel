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
    title: 'Admin Permissions',
    path: '/admin-permissions',
    icon: iconify('solar:shield-keyhole-bold-duotone'),
    superAdminOnly: true,
  },
];
