import { BasketIcon } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

function CartButton() {
  return (
    <Link to="/cart" className="flex items-center gap-2">
      <p className="raleway-light text-sm hidden lg:block">Cart</p>
      <BasketIcon size={24} />
      <p className="raleway-light text-sm">10</p>
    </Link>
  );
}

export default CartButton;
