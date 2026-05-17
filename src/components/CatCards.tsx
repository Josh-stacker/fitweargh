import { Link } from "react-router-dom";
import Button from "./ui/Button";
import { ArrowLineUpRightIcon } from "@phosphor-icons/react";

interface CatCardsProps {
  image: string;
  name: string;
  colors?: string[];
  id?: string;
}

function CatCards({ image, name, colors, id }: CatCardsProps) {
  const inner = (
    <section className="w-full h-full bg-[#FFFBF6] flex flex-col border-1 border-[#DEDEDE]">
      <div className="relative w-full overflow-hidden">
        <img src={image} alt={name} className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300" />
      </div>

      <div className="w-full">
        <Button
          text={name}
          width="w-full"
          icon={<ArrowLineUpRightIcon size={14} />}
        />
      </div>

      <div className="flex p-4 gap-2 justify-center mt-auto">
        {colors && colors.length > 0 ? (
          colors.slice(0, 3).map((c) => (
            <span key={c} style={{ backgroundColor: c }} className="rounded-full w-3 h-3 border border-[#DEDEDE]" />
          ))
        ) : (
          <>
            <span className="bg-red-500 rounded-full w-3 h-3" />
            <span className="bg-[#00864A] rounded-full w-3 h-3" />
            <span className="bg-[#000000] rounded-full w-3 h-3" />
          </>
        )}
      </div>
    </section>
  );

  if (id) {
    return <Link to={`/product/${id}`} className="block">{inner}</Link>;
  }
  return inner;
}

export default CatCards;
