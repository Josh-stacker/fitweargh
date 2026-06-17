import { Link } from "react-router-dom";
import { ArrowLineUpRightIcon, ImageIcon, MinusIcon, PlusIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { useCart } from "../context/CartContext";

const COLOR_HEX: Record<string, string> = {
  Black: "#000000", White: "#FFFFFF", Red: "#ef4444", Green: "#00864A",
  "Olive Green": "#808000", "Army Green": "#4B5320",
  Brown: "#533113", Blue: "#3b82f6", Orange: "#f97316", "Pure Orange": "#FFA500", Pink: "#ec4899",
  Navy: "#1e3a5f", Grey: "#6b7280", Yellow: "#eab308", "Curry Yellow": "#D4A017", Purple: "#800080",
  Nude: "#E3BC9A", "Hot Pink": "#FF69B4", "Dark Purple": "#4A0E4E",
  "Sea Blue": "#006994", "Butter Yellow": "#FFF099", Lilac: "#C8A2C8",
  "Mint Green": "#98FF98", Burgundy: "#800020", "Baby Pink": "#F4C2C2",
  "Pigeon Blue": "#7BA0B4", "Burnt Orange": "#CC5500",
  "Turquoise Green": "#00E5C0", Cream: "#FFFDD0",
};

function CartDrawer() {
  const { items, count, total, cartOpen, closeCart, removeItem, updateQty } = useCart();
  const fmt = (n: number) =>
    `gh₵ ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className={`fixed inset-0 z-[70] ${cartOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${cartOpen ? "opacity-100" : "opacity-0"}`}
        onClick={closeCart}
      />
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transition-transform duration-300 flex flex-col ${
          cartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="px-5 py-4 border-b border-[#DEDEDE] flex items-center justify-between">
          <div>
            <p className="raleway-bold text-xl text-[#533113]">Cart</p>
            <p className="raleway-regular text-base text-[#533113]/50">{count} item{count === 1 ? "" : "s"}</p>
          </div>
          <button onClick={closeCart} className="p-2 text-[#533113] hover:bg-[#533113]/10 transition-colors" title="Close cart">
            <XIcon size={22} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="raleway-regular text-lg text-[#533113]/50">Your cart is empty.</p>
            <Link
              to="/new-arrivals"
              onClick={closeCart}
              className="bg-[#533113] text-white raleway-bold text-sm uppercase tracking-widest px-6 py-3 hover:bg-[#3d2409] transition-colors"
            >
              Shop Now
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
              {items.map((item) => (
                <div key={`${item.id}_${item.size}_${item.color}`} className="grid grid-cols-[72px_1fr] gap-3 border border-[#DEDEDE] p-3">
                  <div className="w-[72px] h-24 bg-[#F5EDE0] overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={22} className="text-[#533113]/20" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="raleway-bold text-base text-[#533113] leading-snug line-clamp-2">{item.name}</p>
                        <p className="raleway-regular text-sm text-[#533113]/60">
                          {item.size && `Size: ${item.size}`}
                          {item.size && item.color && " / "}
                          {item.color && (
                            <span className="inline-flex items-center gap-1">
                              <span
                                style={{ backgroundColor: COLOR_HEX[item.color] ?? item.color }}
                                className="w-3 h-3 rounded-full border border-[#DEDEDE] inline-block"
                              />
                              {item.color}
                            </span>
                          )}
                        </p>
                      </div>
                      <p className="raleway-bold text-base text-[#533113] shrink-0">{fmt(item.price * item.quantity)}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-stretch border border-[#533113]">
                        <button
                          onClick={() => updateQty(item.id, item.size, item.color, item.quantity - 1)}
                          className="px-2 py-1.5 text-[#533113] hover:bg-[#533113]/10 transition-colors"
                        >
                          <MinusIcon size={14} />
                        </button>
                        <span className="raleway-bold text-sm w-9 flex items-center justify-center text-[#533113] border-l border-r border-[#533113]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, item.size, item.color, item.quantity + 1)}
                          className="px-2 py-1.5 text-[#533113] hover:bg-[#533113]/10 transition-colors"
                        >
                          <PlusIcon size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id, item.size, item.color)}
                        className="flex items-center gap-1.5 border border-red-200 text-red-600 raleway-bold text-xs uppercase tracking-widest px-3 py-2 hover:bg-red-50 transition-colors"
                      >
                        <TrashIcon size={13} />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#DEDEDE] p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between raleway-bold text-lg text-[#533113]">
                <span>Subtotal</span>
                <span>{fmt(total)}</span>
              </div>
              <Link
                to="/cart"
                onClick={closeCart}
                className="w-full bg-[#533113] text-white raleway-bold text-sm uppercase tracking-widest py-3 px-4 hover:bg-[#3d2409] transition-colors flex items-center justify-between"
              >
                Checkout
                <ArrowLineUpRightIcon size={18} />
              </Link>
              <button onClick={closeCart} className="raleway-regular text-base text-[#533113]/60 hover:text-[#533113] transition-colors">
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export default CartDrawer;
