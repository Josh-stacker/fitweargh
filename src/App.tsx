import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import RequireAuth from "./components/admin/RequireAuth";
import RequireCustomerAuth from "./components/account/RequireCustomerAuth";

import Homepage from "./pages/Homepage";
import NewArrivals from "./pages/NewArrivals";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";

import Login from "./pages/account/Login";
import Register from "./pages/account/Register";
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

import "./index.css";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Storefront ── */}
            <Route path="/" element={<Homepage />} />
            <Route path="/new-arrivals" element={<NewArrivals />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />

            {/* ── Customer auth ── */}
            <Route path="/account/login" element={<Login />} />
            <Route path="/account/register" element={<Register />} />

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
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
