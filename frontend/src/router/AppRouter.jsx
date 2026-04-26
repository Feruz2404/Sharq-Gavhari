import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import LoadingLogo from '../components/common/LoadingLogo.jsx';
import CustomerLayout from '../components/layout/CustomerLayout.jsx';
import TabletLayout from '../components/layout/TabletLayout.jsx';
import AdminLayout from '../components/layout/AdminLayout.jsx';

// Customer
const LoadingPage          = lazy(() => import('../pages/customer/LoadingPage.jsx'));
const MenuPage             = lazy(() => import('../pages/customer/MenuPage.jsx'));
const TableRedirectPage    = lazy(() => import('../pages/customer/TableRedirectPage.jsx'));
const CategoryPage         = lazy(() => import('../pages/customer/CategoryPage.jsx'));
const ProductDetailPage    = lazy(() => import('../pages/customer/ProductDetailPage.jsx'));
const CartPage             = lazy(() => import('../pages/customer/CartPage.jsx'));

// Tablet
const TabletHome           = lazy(() => import('../pages/tablet/TabletHome.jsx'));
const TabletMenuPage       = lazy(() => import('../pages/tablet/TabletMenuPage.jsx'));
const TabletCartPage       = lazy(() => import('../pages/tablet/TabletCartPage.jsx'));

// Admin
const AdminLogin           = lazy(() => import('../pages/admin/AdminLogin.jsx'));
const AdminDashboard       = lazy(() => import('../pages/admin/AdminDashboard.jsx'));
const AdminCategories      = lazy(() => import('../pages/admin/AdminCategories.jsx'));
const AdminProducts        = lazy(() => import('../pages/admin/AdminProducts.jsx'));
const AdminSettings        = lazy(() => import('../pages/admin/AdminSettings.jsx'));
const AdminTables          = lazy(() => import('../pages/admin/AdminTables.jsx'));

export default function AppRouter() {
  return (
    <Suspense fallback={<LoadingLogo fullscreen />}>
      <Routes>
        {/* Customer (no PWA) */}
        <Route element={<CustomerLayout />}>
          <Route path="/"                    element={<LoadingPage />} />
          <Route path="/menu"                element={<MenuPage />} />
          <Route path="/table/:tableNumber"  element={<TableRedirectPage />} />
          <Route path="/category/:slug"      element={<CategoryPage />} />
          <Route path="/product/:id"         element={<ProductDetailPage />} />
          <Route path="/cart"                element={<CartPage />} />
        </Route>

        {/* Tablet (PWA) */}
        <Route element={<TabletLayout />}>
          <Route path="/tablet"      element={<TabletHome />} />
          <Route path="/tablet/menu" element={<TabletMenuPage />} />
          <Route path="/tablet/cart" element={<TabletCartPage />} />
        </Route>

        {/* Admin (PWA) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route path="/admin"            element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard"  element={<AdminDashboard />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/products"   element={<AdminProducts />} />
          <Route path="/admin/settings"   element={<AdminSettings />} />
          <Route path="/admin/tables"     element={<AdminTables />} />
        </Route>

        <Route path="*" element={<Navigate to="/menu" replace />} />
      </Routes>
    </Suspense>
  );
}
