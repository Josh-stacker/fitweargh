import { Link } from "react-router-dom";

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
import Button from "./ui/Button";
import { ArrowLineUpRightIcon, ImageIcon } from "@phosphor-icons/react";
import { useCart } from "../context/CartContext";

interface ProductCardProps {
  image?: string;
  name: string;
  price?: string | number | null;
  discountPrice?: number | null;
  id?: string | number;
  colors?: string[];
  category?: string;
  categories?: string[];
  href?: string;
  badge?: string;
  hideAddToCart?: boolean;
  actionText?: string;
}

function ProductCard({
  image,
  name,
  price,
  discountPrice,
  id = 1,
  colors,
  category = "",
  categories = [],
  href,
  badge,
  hideAddToCart = false,
  actionText = "Add to cart",
}: ProductCardProps) {
  const { addItem } = useCart();

  const numericPrice = typeof price === "number" ? price : parseFloat(String(price)) || 0;
  const hasPrice = price != null && price !== "";
  const priceStr = typeof price === "number" ? `gh₵ ${price.toFixed(2)}` : price;
  const hasDiscount = discountPrice != null && discountPrice < numericPrice;
  const productHref = href ?? `/product/${id}`;
  const showAddToCart = !hideAddToCart && hasPrice;
  const hasSaleTag = [category, ...categories].some((cat) => ["sale", "sales"].includes(cat.toLowerCase()));
  const displayBadge = badge || (hasDiscount || hasSaleTag ? "Sale" : "");

  const handleAddToCart = () => {
    addItem({
      id: String(id),
      name,
      price: numericPrice,
      imageUrl: image ?? "",
      size: "",
      color: colors?.[0] ?? "",
      quantity: 1,
    });
  };

  return (
    <section className="w-full h-full bg-white flex flex-col border border-[#DEDEDE]">
      {/* Image */}
      <Link to={productHref} className="block overflow-hidden bg-[#F5EDE0] relative">
        {displayBadge && (
          <span className="absolute left-2 top-2 z-10 bg-red-600 text-white raleway-bold text-[10px] uppercase tracking-widest px-2 py-1">
            {displayBadge}
          </span>
        )}
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full aspect-[3/4] object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full aspect-[3/4] flex items-center justify-center">
            <ImageIcon size={36} className="text-[#533113]/20" />
          </div>
        )}
      </Link>

      {/* Mobile add-to-cart button */}
      {showAddToCart && (
      <div className="block md:hidden w-full">
        <Button
          text={actionText}
          width="w-full"
          icon={<ArrowLineUpRightIcon size={14} />}
          onClick={handleAddToCart}
        />
      </div>
      )}

      <div className="flex flex-col p-3 md:p-4 gap-2 flex-grow">
        <Link to={productHref}>
          <p className="raleway-bold text-sm md:text-base text-[#533113] hover:text-[#533113] transition-colors leading-snug">
            {name}
          </p>
        </Link>

        {(hasPrice || (colors && colors.length > 0)) && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {hasDiscount ? (
              <>
                <p className="raleway-bold text-sm text-red-600">gh₵ {discountPrice!.toFixed(2)}</p>
                <p className="raleway-regular text-sm text-[#533113]/40 line-through">{priceStr}</p>
              </>
            ) : (
              <p className="raleway-regular text-base text-[#533113]">{priceStr}</p>
            )}
          </div>
          {colors && colors.length > 0 && (
            <div className="flex gap-1.5">
              {colors.slice(0, 4).map((c) => (
                <span
                  key={c}
                  title={c}
                  style={{ backgroundColor: COLOR_HEX[c] ?? c }}
                  className="w-3 h-3 rounded-full border border-[#DEDEDE]"
                />
              ))}
            </div>
          )}
        </div>
        )}

        {/* Desktop add-to-cart */}
        {showAddToCart ? (
        <div className="hidden md:block w-full mt-auto pt-2">
          <Button
            text={actionText}
            width="w-full"
            icon={<ArrowLineUpRightIcon size={14} />}
            onClick={handleAddToCart}
          />
        </div>
        ) : (
          <Link
            to={productHref}
            className="hidden md:flex w-full mt-auto pt-2 items-center justify-center gap-2 border border-[#533113] text-[#533113] py-2.5 px-3 raleway-bold text-xs uppercase tracking-widest hover:bg-[#533113] hover:text-white transition-colors"
          >
            {actionText}
            <ArrowLineUpRightIcon size={14} />
          </Link>
        )}
      </div>
    </section>
  );
}

export default ProductCard;
