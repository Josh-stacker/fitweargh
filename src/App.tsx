import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { DebugProvider } from "./context/DebugContext";
import { seedBuiltInSizeCharts } from "./lib/sizeCharts";
import { supabase } from "./supabase";
import RequireAuth from "./components/admin/RequireAuth";
import RequireCustomerAuth from "./components/account/RequireCustomerAuth";

import Homepage from "./pages/Homepage";
import NewArrivals from "./pages/NewArrivals";
import FastSelling from "./pages/FastSelling";
import BodyShapers from "./pages/BodyShapers";
import Clothing from "./pages/Clothing";
import Accessories from "./pages/Accessories";
import Sales from "./pages/Sales";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import ContactUs from "./pages/ContactUs";
import SearchResults from "./pages/SearchResults";
import About from "./pages/About";
import FAQPage from "./pages/FAQPage";

import Login from "./pages/account/Login";
import Register from "./pages/account/Register";
import ForgotPassword from "./pages/account/ForgotPassword";
import ResetPassword from "./pages/account/ResetPassword";
import AccountDashboard from "./pages/account/AccountDashboard";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Orders from "./pages/admin/Orders";
import Customers from "./pages/admin/Customers";
import Categories from "./pages/admin/Categories";
import HeroSlides from "./pages/admin/HeroSlides";
import HomepageSettings from "./pages/admin/HomepageSettings";
import PopupSettings from "./pages/admin/PopupSettings";
import AdminUsers from "./pages/admin/AdminUsers";
import ShippingMethods from "./pages/admin/ShippingMethods";
import CartDrawer from "./components/CartDrawer";

import "./index.css";

function App() {
  useEffect(() => {
    seedBuiltInSizeCharts(supabase);
  }, []);

  return (
    <AuthProvider>
      <DebugProvider>
      <CartProvider>
        <BrowserRouter>
          <CartDrawer />
          <Routes>
            {/* ── Storefront ── */}
            <Route path="/" element={<Homepage />} />
            <Route path="/new-arrivals" element={<NewArrivals />} />
            <Route path="/fast-selling" element={<FastSelling />} />
            <Route path="/body-shapers" element={<BodyShapers />} />
            <Route path="/clothing" element={<Clothing />} />
            <Route path="/accessories" element={<Accessories />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQPage />} />

            {/* ── Customer auth ── */}
            <Route path="/account/login" element={<Login />} />
            <Route path="/account/register" element={<Register />} />
            <Route path="/account/forgot-password" element={<ForgotPassword />} />
            <Route path="/account/reset-password" element={<ResetPassword />} />

            {/* ── Customer dashboard (protected) ── */}
            <Route
              path="/account"
              element={
                <RequireCustomerAuth>
                  <AccountDashboard />
                </RequireCustomerAuth>
              }
            />

            {/* ── Admin auth ── */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* ── Admin dashboard (protected) ── */}
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="orders" element={<Orders />} />
              <Route path="customers" element={<Customers />} />
              <Route path="categories" element={<Categories />} />
              <Route path="hero-slides" element={<HeroSlides />} />
              <Route path="homepage" element={<HomepageSettings />} />
              <Route path="popup" element={<PopupSettings />} />
              <Route path="admins" element={<AdminUsers />} />
              <Route path="shipping" element={<ShippingMethods />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
      </DebugProvider>
    </AuthProvider>
  );
}

export default App;
