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
};

export const navData = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: icon('ic-analytics'),
  },
  {
    title: 'Orders',
    path: '/orders',
    icon: iconify('solar:clipboard-list-bold-duotone'),
  },
  {
    title: 'Users',
    path: '/users',
    icon: icon('ic-user'),
  },
  {
    title: 'Ecommerce',
    path: '/ecommerce/departments',
    icon: icon('ic-cart'),
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
    children: [
      {
        title: 'Best Sellers',
        path: '/dynamic/best-sellers',
        icon: iconify('solar:star-bold-duotone'),
      },
      {
        title: 'Top Sellers',
        path: '/dynamic/top-sellers',
        icon: iconify('solar:trophy-bold-duotone'),
      },
      {
        title: 'Advertisements',
        path: '/dynamic/advertisements',
        icon: iconify('solar:megaphone-bold-duotone'),
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
];
