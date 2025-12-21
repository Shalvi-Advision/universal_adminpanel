import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { ProtectedRoute } from 'src/routes/components';

import { AuthLayout } from 'src/layouts/auth';
import { DashboardLayout } from 'src/layouts/dashboard';

// ----------------------------------------------------------------------

export const DashboardPage = lazy(() => import('src/pages/dashboard'));
export const SignInPage = lazy(() => import('src/pages/sign-in'));
export const UsersPage = lazy(() => import('src/pages/users'));
export const OrdersPage = lazy(() => import('src/pages/orders'));
export const EcommerceDepartmentsPage = lazy(() => import('src/pages/ecommerce/departments'));
export const EcommerceCategoriesPage = lazy(() => import('src/pages/ecommerce/categories'));
export const EcommerceSubcategoriesPage = lazy(() => import('src/pages/ecommerce/subcategories'));
export const EcommerceProductsPage = lazy(() => import('src/pages/ecommerce/products'));
export const OutletPincodesPage = lazy(() => import('src/pages/outlet/pincodes'));
export const OutletStoresPage = lazy(() => import('src/pages/outlet/stores'));
export const OutletPaymentModesPage = lazy(() => import('src/pages/outlet/payment-modes'));
export const OutletDeliverySlotsPage = lazy(() => import('src/pages/outlet/delivery-slots'));
export const DynamicBestSellersPage = lazy(() => import('src/pages/dynamic/best-sellers'));
export const DynamicTopSellersPage = lazy(() => import('src/pages/dynamic/top-sellers'));
export const DynamicAdvertisementsPage = lazy(() => import('src/pages/dynamic/advertisements'));
export const DynamicPopularCategoriesPage = lazy(() => import('src/pages/dynamic/popular-categories'));
export const DynamicBannersPage = lazy(() => import('src/pages/dynamic/banners'));
export const DynamicSeasonalCategoriesPage = lazy(() => import('src/pages/dynamic/seasonal-categories'));
export const Page404 = lazy(() => import('src/pages/page-not-found'));

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
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'ecommerce/departments', element: <EcommerceDepartmentsPage /> },
      { path: 'ecommerce/categories', element: <EcommerceCategoriesPage /> },
      { path: 'ecommerce/subcategories', element: <EcommerceSubcategoriesPage /> },
      { path: 'ecommerce/products', element: <EcommerceProductsPage /> },
      { path: 'outlet/pincodes', element: <OutletPincodesPage /> },
      { path: 'outlet/stores', element: <OutletStoresPage /> },
      { path: 'outlet/payment-modes', element: <OutletPaymentModesPage /> },
      { path: 'outlet/delivery-slots', element: <OutletDeliverySlotsPage /> },
      { path: 'dynamic/best-sellers', element: <DynamicBestSellersPage /> },
      { path: 'dynamic/top-sellers', element: <DynamicTopSellersPage /> },
      { path: 'dynamic/advertisements', element: <DynamicAdvertisementsPage /> },
      { path: 'dynamic/popular-categories', element: <DynamicPopularCategoriesPage /> },
      { path: 'dynamic/banners', element: <DynamicBannersPage /> },
      { path: 'dynamic/seasonal-categories', element: <DynamicSeasonalCategoriesPage /> },
    ],
  },
  {
    path: '404',
    element: <Page404 />,
  },
  { path: '*', element: <Page404 /> },
];
