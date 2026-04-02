import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo-full.png";
import AccountButton from "./ui/AccountButton";
import CartButton from "./ui/CartButton";
import { List, X } from "@phosphor-icons/react";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <nav className="flex justify-between items-center bg-[#FDF1E1] h-20 px-4 md:px-10">
        <Link to="/">
          <img src={logo} alt="logo" className="w-24 md:w-32" />
        </Link>
        
        {/* Desktop Links */}
        <div className="hidden lg:flex gap-6 items-center">
          <Link to="/" className="raleway-light text-sm">
            Home
          </Link>
          <Link to="/new-arrivals" className="raleway-light text-sm">
            New Arrival
          </Link>
          <Link to="/clothing" className="raleway-light text-sm">
            Clothing
          </Link>
          <Link to="/body-shapers" className="raleway-light text-sm">
            Body Shapers
          </Link>
          <Link to="/accessories" className="raleway-light text-sm">
            Accessories
          </Link>
        </div>

        {/* Desktop Account / Cart */}
        <div className="hidden lg:flex w-48 justify-between">
          <AccountButton />
          <CartButton />
        </div>

        {/* Mobile Menu & Cart */}
        <div className="flex lg:hidden items-center gap-4 bg-[#E5D8C7] px-4 py-2 rounded-full">
          <div className="flex items-center gap-1 cursor-pointer" onClick={() => setIsMenuOpen(true)}>
            <List size={28} color="#533113" />
            <span className="raleway-medium text-sm text-[#533113]">Menu</span>
          </div>
          <CartButton />
        </div>
      </nav>

      {/* Fullscreen Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center min-h-screen">
          <div className="flex flex-col items-start gap-6 w-fit px-6">
            <div 
              className="flex items-center gap-2 cursor-pointer bg-[#E5D8C7] px-4 py-2 rounded-full mb-4 self-start" 
              onClick={() => setIsMenuOpen(false)}
            >
              <X size={24} color="#533113" />
              <span className="raleway-medium text-sm text-[#533113]">Close</span>
            </div>

            <img src={logo} alt="logo" className="w-32 mb-4" />
            
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="raleway-regular text-2xl text-[#533113]">Home</Link>
            <Link to="/new-arrivals" onClick={() => setIsMenuOpen(false)} className="raleway-regular text-2xl text-[#533113]">New Arrival</Link>
            <Link to="/clothing" onClick={() => setIsMenuOpen(false)} className="raleway-regular text-2xl text-[#533113]">Clothing</Link>
            <Link to="/body-shapers" onClick={() => setIsMenuOpen(false)} className="raleway-regular text-2xl text-[#533113]">Body Shapers</Link>
            
            <hr className="w-full border-[#533113] opacity-30 my-2" />
            
            <ul className="list-disc list-inside flex flex-col gap-2 w-full text-[#533113] raleway-regular text-lg">
              <li>
                <Link to="/contact" onClick={() => setIsMenuOpen(false)}>Contact us</Link>
              </li>
              <li>
                <span className="text-sm">© 2026 Fitweargh. All rights reserved.</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
