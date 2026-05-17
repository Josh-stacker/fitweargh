import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo-full.png";
import CartButton from "./ui/CartButton";
import { List, X, UserCircle, SignOut } from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setAccountMenuOpen(false);
    navigate("/");
  };

  return (
    <>
      <nav className="flex justify-between items-center bg-[#FDF1E1] h-20 px-4 md:px-10 relative z-30">
        <Link to="/">
          <img src={logo} alt="FitwearGH" className="w-24 md:w-32" />
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex gap-6 items-center">
          {[
            { to: "/", label: "Home" },
            { to: "/new-arrivals", label: "New Arrival" },
            { to: "/clothing", label: "Clothing" },
            { to: "/body-shapers", label: "Body Shapers" },
            { to: "/accessories", label: "Accessories" },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="raleway-light text-base text-[#533113] hover:text-[#533113] transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop account + cart */}
        <div className="hidden lg:flex items-center gap-6">
          {/* Account dropdown */}
          <div className="relative">
            {user ? (
              <>
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="flex items-center gap-2 raleway-light text-base text-[#533113] hover:text-[#533113] transition-colors"
                >
                  <UserCircle size={24} weight="regular" />
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
                        className="raleway-light text-sm text-[#533113] px-4 py-3 hover:bg-[#FFFBF6] transition-colors"
                      >
                        My Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 raleway-light text-sm text-red-600 px-4 py-3 hover:bg-red-50 transition-colors text-left"
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
                className="flex items-center gap-2 raleway-light text-base text-[#533113] hover:text-[#533113] transition-colors"
              >
                <UserCircle size={24} weight="regular" />
                Account
              </Link>
            )}
          </div>
          <CartButton />
        </div>

        {/* Mobile: hamburger + cart */}
        <div className="flex lg:hidden items-center gap-3 bg-[#E5D8C7] px-4 py-2 rounded-full">
          <button
            className="flex items-center gap-1"
            onClick={() => setIsMenuOpen(true)}
          >
            <List size={26} color="#533113" />
            <span className="raleway-light text-sm text-[#533113]">Menu</span>
          </button>
          <CartButton />
        </div>
      </nav>

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
              <span className="raleway-light text-sm text-[#533113]">Close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-6">
            {[
              { to: "/", label: "Home" },
              { to: "/new-arrivals", label: "New Arrivals" },
              { to: "/clothing", label: "Clothing" },
              { to: "/body-shapers", label: "Body Shapers" },
              { to: "/accessories", label: "Accessories" },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setIsMenuOpen(false)}
                className="raleway-regular text-2xl text-[#533113] hover:text-[#533113] transition-colors"
              >
                {label}
              </Link>
            ))}

            <hr className="border-[#DEDEDE] my-2" />

            {user ? (
              <>
                <Link
                  to="/account"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 raleway-regular text-xl text-[#533113]"
                >
                  <UserCircle size={24} />
                  {user.displayName ?? "My Account"}
                </Link>
                <button
                  onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                  className="flex items-center gap-3 raleway-regular text-xl text-red-600 text-left"
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
                  className="raleway-regular text-xl text-[#533113]"
                >
                  Sign in
                </Link>
                <Link
                  to="/account/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="raleway-regular text-xl text-[#533113]"
                >
                  Create account
                </Link>
              </>
            )}

            <hr className="border-[#DEDEDE] my-2" />
            <p className="raleway-light text-sm text-[#533113]/50">© 2026 Fitweargh. All rights reserved.</p>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
