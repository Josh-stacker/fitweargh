import { BasketIcon } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";

function CartButton() {
  const { count } = useCart();

  return (
    <Link to="/cart" className="flex items-center gap-2 relative">
      <p className="raleway-light text-sm hidden lg:block">Cart</p>
      <div className="relative">
        <BasketIcon size={24} />
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#533113] text-white raleway-bold text-[10px] flex items-center justify-center rounded-full">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </div>
    </Link>
  );
}

export default CartButton;
