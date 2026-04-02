import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";

interface DirectionButtonProps {
  direction: "left" | "right";
  onClick?: () => void;
}

function DirectionButton({ direction, onClick }: DirectionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-16 lg:w-24 h-8 lg:h-10 text-[#533113] flex justify-center items-center cursor-pointer"
    >
      {direction === "left" ? (
        <div className="flex items-center gap-1 lg:gap-2">
          <ArrowLeftIcon size={18} className="border border-[#533113] rounded-full lg:hidden p-0.5" />
          <ArrowLeftIcon size={24} className="border-2 border-[#533113] rounded-full hidden lg:block" />
          <p className="underline text-xs lg:text-base">previous</p>
        </div>
      ) : (
        <div className="flex items-center gap-1 lg:gap-2">
          <p className="underline text-xs lg:text-base">next</p>
          <ArrowRightIcon size={18} className="border border-[#533113] rounded-full lg:hidden p-0.5" />
          <ArrowRightIcon size={24} className="border-2 border-[#533113] rounded-full hidden lg:block" />
        </div>
      )}
    </button>
  );
}

export default DirectionButton;
