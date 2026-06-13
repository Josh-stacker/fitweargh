import { Link } from "react-router-dom";
import { ArrowLineUpRightIcon } from "@phosphor-icons/react";

interface CatCardsProps {
  image: string;
  name: string;
  colors?: string[];
  id?: string;
  href?: string;
}

function CatCards({ image, name, id, href }: CatCardsProps) {
  const inner = (
    <section className="w-full h-full bg-[#FFFBF6] flex flex-col border border-[#DEDEDE]">
      <div className="relative w-full overflow-hidden">
        <img src={image} alt={name} className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300" />
      </div>

      <div className="w-full flex-1 flex items-center justify-between bg-[#533113] text-white px-4 py-4">
        <span className="raleway-regular text-base">{name}</span>
        <ArrowLineUpRightIcon size={18} />
      </div>
    </section>
  );

  const to = href ?? (id ? `/product/${id}` : "");
  if (to) {
    return <Link to={to} className="block h-full">{inner}</Link>;
  }
  return inner;
}

export default CatCards;
