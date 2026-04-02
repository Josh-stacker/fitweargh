import type React from "react";

interface ButtonProps {
  text: string;
  icon?: React.ReactNode;
  width?: string;
  onClick?: () => void;
}

function Button({ text, icon, width, onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`bg-[#533113] text-white py-2 px-4 flex justify-between items-center ${width}`}
    >
      <p className="raleway-light text-sm">{text}</p>
      {icon}
    </button>
  );
}

export default Button;
