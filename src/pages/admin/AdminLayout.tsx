import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  ChartBarIcon,
  PackageIcon,
  ShoppingCartIcon,
  UsersIcon,
  TagIcon,
  SignOutIcon,
  ListIcon,
  XIcon,
  ImagesIcon,
} from "@phosphor-icons/react";

const NAV = [
  { to: "/admin", label: "Overview", icon: ChartBarIcon, end: true },
  { to: "/admin/products", label: "Products", icon: PackageIcon },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCartIcon },
  { to: "/admin/customers", label: "Customers", icon: UsersIcon },
  { to: "/admin/categories", label: "Categories", icon: TagIcon },
  { to: "/admin/hero-slides", label: "Hero Slides", icon: ImagesIcon },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-[#DEDEDE]">
        <h1 className="raleway-bold text-lg text-[#533113] tracking-widest uppercase">
          FitwearGH
        </h1>
        <p className="raleway-light text-xs text-[#533113]/50 mt-0.5 tracking-widest uppercase">
          Admin
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 raleway-light text-sm transition-colors ${
                isActive
                  ? "bg-[#533113] text-white"
                  : "text-[#533113] hover:bg-[#533113]/10"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-4 py-4 border-t border-[#DEDEDE]">
        <p className="raleway-light text-xs text-[#533113]/50 truncate px-2 mb-2">
          {user?.email}
        </p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 raleway-light text-sm text-[#533113] hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <SignOutIcon size={18} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFBF6] flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-[#DEDEDE] bg-white shrink-0 fixed top-0 left-0 h-full z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-white border-r border-[#DEDEDE] z-50 md:hidden flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-end p-4 border-b border-[#DEDEDE]">
          <button onClick={() => setSidebarOpen(false)}>
            <XIcon size={20} className="text-[#533113]" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-60">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#DEDEDE] sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)}>
            <ListIcon size={22} className="text-[#533113]" />
          </button>
          <h1 className="raleway-bold text-base text-[#533113] tracking-widest uppercase">
            FitwearGH Admin
          </h1>
          <div className="w-6" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
