import type { RouteObject } from 'react-router';

import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { ProtectedRoute, PermissionGuard } from 'src/routes/components';

import { lazyWithRetry } from 'src/utils/lazy-with-retry';

import { AuthLayout } from 'src/layouts/auth';
import { DashboardLayout } from 'src/layouts/dashboard';

// ----------------------------------------------------------------------

export const DashboardPage = lazyWithRetry(() => import('src/pages/dashboard'));
export const SignInPage = lazyWithRetry(() => import('src/pages/sign-in'));
export const UsersPage = lazyWithRetry(() => import('src/pages/users'));
export const OrdersPage = lazyWithRetry(() => import('src/pages/orders'));
export const NotificationsPage = lazyWithRetry(() => import('src/pages/notifications'));
export const EcommerceDepartmentsPage = lazyWithRetry(() => import('src/pages/ecommerce/departments'));
export const EcommerceCategoriesPage = lazyWithRetry(() => import('src/pages/ecommerce/categories'));
export const EcommerceSubcategoriesPage = lazyWithRetry(() => import('src/pages/ecommerce/subcategories'));
export const EcommerceProductsPage = lazyWithRetry(() => import('src/pages/ecommerce/products'));
export const OutletPincodesPage = lazyWithRetry(() => import('src/pages/outlet/pincodes'));
export const OutletStoresPage = lazyWithRetry(() => import('src/pages/outlet/stores'));
export const OutletPaymentModesPage = lazyWithRetry(() => import('src/pages/outlet/payment-modes'));
export const OutletDeliverySlotsPage = lazyWithRetry(() => import('src/pages/outlet/delivery-slots'));
export const OutletDeliveryFeesPage = lazyWithRetry(() => import('src/pages/outlet/delivery-fees'));
export const DynamicBestSellersPage = lazyWithRetry(() => import('src/pages/dynamic/best-sellers'));
export const DynamicTopSellersPage = lazyWithRetry(() => import('src/pages/dynamic/top-sellers'));
export const DynamicAdvertisementsPage = lazyWithRetry(() => import('src/pages/dynamic/advertisements'));
export const DynamicPopularCategoriesPage = lazyWithRetry(() => import('src/pages/dynamic/popular-categories'));
export const DynamicBannersPage = lazyWithRetry(() => import('src/pages/dynamic/banners'));
export const DynamicSeasonalCategoriesPage = lazyWithRetry(() => import('src/pages/dynamic/seasonal-categories'));
export const OffersPage = lazyWithRetry(() => import('src/pages/offers'));
export const AdminPermissionsPage = lazyWithRetry(() => import('src/pages/admin-permissions'));
export const Page404 = lazyWithRetry(() => import('src/pages/page-not-found'));

const renderFallback = () => (
  <Box
    sx={{
      display: 'flex',
      flex: '1 1 auto',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <LinearProgress
      sx={{
        width: 1,
        maxWidth: 320,
        bgcolor: (theme) => varAlpha(theme.vars.palette.text.primaryChannel, 0.16),
        [`& .${linearProgressClasses.bar}`]: { bgcolor: 'text.primary' },
      }}
    />
  </Box>
);

export const routesSection: RouteObject[] = [
  {
    index: true,
    element: (
      <AuthLayout>
        <SignInPage />
      </AuthLayout>
    ),
  },
  {
    path: 'sign-in',
    element: (
      <AuthLayout>
        <SignInPage />
      </AuthLayout>
    ),
  },
  {
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <Suspense fallback={renderFallback()}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <PermissionGuard section="dashboard"><DashboardPage /></PermissionGuard> },
      { path: 'users', element: <PermissionGuard section="users"><UsersPage /></PermissionGuard> },
      { path: 'orders', element: <PermissionGuard section="orders"><OrdersPage /></PermissionGuard> },
      { path: 'notifications', element: <PermissionGuard section="notifications"><NotificationsPage /></PermissionGuard> },
      { path: 'offers', element: <PermissionGuard section="offers"><OffersPage /></PermissionGuard> },
      { path: 'ecommerce/departments', element: <PermissionGuard section="ecommerce"><EcommerceDepartmentsPage /></PermissionGuard> },
      { path: 'ecommerce/categories', element: <PermissionGuard section="ecommerce"><EcommerceCategoriesPage /></PermissionGuard> },
      { path: 'ecommerce/subcategories', element: <PermissionGuard section="ecommerce"><EcommerceSubcategoriesPage /></PermissionGuard> },
      { path: 'ecommerce/products', element: <PermissionGuard section="ecommerce"><EcommerceProductsPage /></PermissionGuard> },
      { path: 'outlet/pincodes', element: <PermissionGuard section="outlet"><OutletPincodesPage /></PermissionGuard> },
      { path: 'outlet/stores', element: <PermissionGuard section="outlet"><OutletStoresPage /></PermissionGuard> },
      { path: 'outlet/payment-modes', element: <PermissionGuard section="outlet"><OutletPaymentModesPage /></PermissionGuard> },
      { path: 'outlet/delivery-slots', element: <PermissionGuard section="outlet"><OutletDeliverySlotsPage /></PermissionGuard> },
      { path: 'outlet/delivery-fees', element: <PermissionGuard section="outlet"><OutletDeliveryFeesPage /></PermissionGuard> },
      { path: 'dynamic/best-sellers', element: <PermissionGuard section="dynamicSection"><DynamicBestSellersPage /></PermissionGuard> },
      { path: 'dynamic/top-sellers', element: <PermissionGuard section="dynamicSection"><DynamicTopSellersPage /></PermissionGuard> },
      { path: 'dynamic/advertisements', element: <PermissionGuard section="dynamicSection"><DynamicAdvertisementsPage /></PermissionGuard> },
      { path: 'dynamic/popular-categories', element: <PermissionGuard section="dynamicSection"><DynamicPopularCategoriesPage /></PermissionGuard> },
      { path: 'dynamic/banners', element: <PermissionGuard section="dynamicSection"><DynamicBannersPage /></PermissionGuard> },
      { path: 'dynamic/seasonal-categories', element: <PermissionGuard section="dynamicSection"><DynamicSeasonalCategoriesPage /></PermissionGuard> },
      { path: 'admin-permissions', element: <AdminPermissionsPage /> },
    ],
  },
  {
    path: '404',
    element: <Page404 />,
  },
  { path: '*', element: <Page404 /> },
];
