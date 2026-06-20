import { useEffect, useState, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/logo-full.png";
import CartButton from "./ui/CartButton";
import { List, X, UserCircle, SignOut, MagnifyingGlass } from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase";

const NAV_LINKS: { to: string; label: string; setting?: "fastSelling" }[] = [
  { to: "/", label: "Home" },
  { to: "/new-arrivals", label: "New Arrivals" },
  { to: "/fast-selling", label: "Fast Selling", setting: "fastSelling" },
  { to: "/clothing", label: "Clothing" },
  { to: "/body-shapers", label: "Body Shapers" },
  { to: "/accessories", label: "Accessories" },
  { to: "/sales", label: "Sales" },
];

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [fastSellingEnabled, setFastSellingEnabled] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadSettings = async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "homepage")
        .maybeSingle();
      if (error) return;
      const settings = data?.value as { fastSellingEnabled?: boolean } | null;
      setFastSellingEnabled(settings?.fastSellingEnabled ?? true);
    };
    loadSettings();
  }, []);

  const navLinks = NAV_LINKS.filter((link) => link.setting !== "fastSelling" || fastSellingEnabled);

  const handleLogout = async () => {
    await logout();
    setAccountMenuOpen(false);
    navigate("/");
  };

  const handleSearchOpen = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <>
      <nav className="flex justify-between items-center bg-[#FDF1E1] h-20 px-4 md:px-10 relative z-30">
        <Link to="/">
          <img src={logo} alt="FitwearGH" className="w-24 md:w-32" />
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex gap-6 items-center">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `text-lg text-[#533113] underline-offset-8 decoration-2 transition-colors ${
                  isActive ? "raleway-bold underline" : "raleway-regular no-underline hover:underline"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Desktop account + cart */}
        <div className="hidden lg:flex items-center gap-6">
          {/* Search button */}
          <button
            onClick={handleSearchOpen}
            className="flex items-center gap-1.5 raleway-regular text-lg text-[#533113] hover:underline underline-offset-8 decoration-2 transition-colors"
            aria-label="Search"
          >
            <MagnifyingGlass size={22} />
          </button>
          {/* Account dropdown */}
          <div className="relative">
            {user ? (
              <>
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="flex items-center gap-2 raleway-regular text-lg text-[#533113] cursor-pointer transition-all duration-200 hover:underline"
                >
                  <UserCircle size={24} weight="fill" />
                  <span className="max-w-[120px] truncate">{user.displayName ?? "Account"}</span>
                </button>
                {accountMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setAccountMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-[#DEDEDE] shadow-sm z-20 flex flex-col">
                      <Link
                        to="/account"
                        onClick={() => setAccountMenuOpen(false)}
                        className="raleway-regular text-base text-[#533113] px-4 py-3 hover:bg-[#FFFBF6] transition-colors"
                      >
                        My Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 raleway-regular text-base text-red-600 px-4 py-3 hover:bg-red-50 transition-colors text-left"
                      >
                        <SignOut size={15} />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <Link
                to="/account/login"
                className="flex items-center gap-2 raleway-regular text-lg text-[#533113] cursor-pointer transition-all duration-200 hover:underline"
              >
                <UserCircle size={24} weight="regular" />
                Account
              </Link>
            )}
          </div>
          <CartButton />
        </div>

        {/* Mobile: hamburger + search + cart */}
        <div className="flex lg:hidden items-center gap-3 bg-[#E5D8C7] px-4 py-2 rounded-full">
          <button
            className="flex items-center gap-1"
            onClick={() => setIsMenuOpen(true)}
          >
            <List size={26} color="#533113" />
            <span className="raleway-regular text-base text-[#533113]">Menu</span>
          </button>
          <button onClick={handleSearchOpen} aria-label="Search">
            <MagnifyingGlass size={22} color="#533113" />
          </button>
          <CartButton />
        </div>
      </nav>

      {/* Search overlay */}
      {searchOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSearchOpen(false)} />
          <div className="fixed top-0 left-0 right-0 z-50 bg-[#FDF1E1] px-4 md:px-10 py-5 shadow-md">
            <form onSubmit={handleSearchSubmit} className="flex items-stretch gap-0 max-w-2xl mx-auto">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products…"
                className="input-base flex-1"
              />
              <button
                type="submit"
                className="bg-[#533113] text-white px-5 flex items-center justify-center hover:bg-[#3d2409] transition-colors shrink-0"
                aria-label="Search"
              >
                <MagnifyingGlass size={20} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="ml-3 flex items-center text-[#533113] hover:underline raleway-regular text-sm shrink-0"
              >
                <X size={20} />
              </button>
            </form>
          </div>
        </>
      )}

      {/* Mobile fullscreen menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Close button */}
          <div className="flex items-center justify-between px-5 py-5 border-b border-[#DEDEDE]">
            <img src={logo} alt="FitwearGH" className="w-28" />
            <button
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 bg-[#E5D8C7] px-4 py-2 rounded-full"
            >
              <X size={22} color="#533113" />
              <span className="raleway-regular text-base text-[#533113]">Close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-6">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `text-2xl text-[#533113] underline-offset-8 decoration-2 transition-colors ${
                    isActive ? "raleway-bold underline" : "raleway-regular no-underline hover:underline"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}

            <hr className="border-[#DEDEDE] my-2" />

            {user ? (
              <>
                <Link
                  to="/account"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 raleway-regular text-2xl text-[#533113]"
                >
                  <UserCircle size={24} weight="fill" />
                  {user.displayName ?? "My Account"}
                </Link>
                <button
                  onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                  className="flex items-center gap-3 raleway-regular text-2xl text-red-600 text-left"
                >
                  <SignOut size={22} />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/account/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="raleway-regular text-2xl text-[#533113]"
                >
                  Sign in
                </Link>
                <Link
                  to="/account/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="raleway-regular text-2xl text-[#533113]"
                >
                  Create account
                </Link>
              </>
            )}

            <hr className="border-[#DEDEDE] my-2" />
            <p className="raleway-regular text-base text-[#533113]/50">© 2026 Fitweargh. All rights reserved.</p>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
