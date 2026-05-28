import type React from "react";

interface ButtonProps {
  text: string;
  icon?: React.ReactNode;
  width?: string;
  onClick?: () => void;
  className?: string;
  textSize?: string;
}

function Button({ text, icon, width, onClick, className, textSize = "text-sm" }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`bg-[#533113] text-white py-2 px-4 flex justify-between items-center h-full ${width ?? ""} ${className ?? ""}`}
    >
      <p className={`raleway-regular ${textSize}`}>{text}</p>
      {icon}
    </button>
  );
}

export default Button;
