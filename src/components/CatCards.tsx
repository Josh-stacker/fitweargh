import Button from "./ui/Button";
import { ArrowLineUpRightIcon } from "@phosphor-icons/react";

interface CatCardsProps {
  image: string;
  name: string;
}

function CatCards({ image, name }: CatCardsProps) {
  return (
    <section className="w-full h-full bg-[#FFFBF6] flex flex-col border-1 border-[#DEDEDE]">
      <div className="relative w-full">
        <img src={image} alt={name} className="w-full h-auto object-cover" />
      </div>
      
      <div className="w-full">
        <Button
          text={name}
          width="w-full"
          icon={<ArrowLineUpRightIcon size={14} />}
        />
      </div>

      <div className="flex p-4 gap-2 justify-center mt-auto">
        <span className="bg-red-500 rounded-full w-3 h-3"></span>
        <span className="bg-[#00864A] rounded-full w-3 h-3"></span>
        <span className="bg-[#000000] rounded-full w-3 h-3"></span>
      </div>
    </section>
  );
}

export default CatCards;
