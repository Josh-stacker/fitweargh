import Button from "./ui/Button";
import { ArrowLineUpRightIcon } from "@phosphor-icons/react";

interface ProductCardProps {
  image: string;
  name: string;
  price: string;
}

function ProductCard({ image, name, price }: ProductCardProps) {
  return (
    <section className="w-full h-full bg-[#FFFBF6] flex flex-col border-1 border-[#DEDEDE]">
      <img src={image} alt={name} className="w-full" />

      {/* Mobile Button (Edge to Edge, above body) */}
      <div className="block md:hidden w-full">
        <Button
          text="add to cart"
          width="w-full"
          icon={<ArrowLineUpRightIcon size={14} />}
        />
      </div>

      <div className="flex flex-col p-4 gap-2 flex-grow">
        <p className="raleway-bold text-sm md:text-base">{name}</p>
        <div className="w-full flex flex-col md:flex-row md:justify-between gap-2 md:gap-0">
          <p className="raleway-light text-sm">{price}</p>
          <div className="flex gap-2">
            <span className="bg-red-500 rounded-full w-3 h-3"></span>
            <span className="bg-[#00864A] rounded-full w-3 h-3"></span>
            <span className="bg-[#000000] rounded-full w-3 h-3"></span>
          </div>
        </div>

        {/* Desktop Button (Inside padding, bottom) */}
        <div className="hidden md:block w-full mt-auto">
          <Button
            text="add to cart"
            width="w-full"
            icon={<ArrowLineUpRightIcon size={14} />}
          />
        </div>
      </div>
    </section>
  );
}

export default ProductCard;
