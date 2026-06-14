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
    <section className="w-full h-[330px] sm:h-[430px] md:h-[520px] lg:h-[650px] bg-[#FFFBF6] flex flex-col border border-[#DEDEDE]">
      <div className="relative w-full flex-1 min-h-0 overflow-hidden bg-[#F5EDE0]">
        <img src={image} alt={name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
      </div>

      <div className="w-full h-16 md:h-20 flex items-center justify-between gap-3 bg-[#533113] text-white px-4">
        <span className="raleway-regular text-base leading-tight line-clamp-2">{name}</span>
        <ArrowLineUpRightIcon size={18} className="shrink-0" />
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
