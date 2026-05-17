import { useEffect, useState } from "react";
import { CheckCircleIcon, XIcon } from "@phosphor-icons/react";

interface ToastProps {
  message: string;
  onDone: () => void;
}

export function Toast({ message, onDone }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-[#533113] text-white px-5 py-3 shadow-lg transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <CheckCircleIcon size={18} weight="fill" />
      <span className="raleway-light text-sm">{message}</span>
      <button onClick={() => { setVisible(false); setTimeout(onDone, 300); }}>
        <XIcon size={16} />
      </button>
    </div>
  );
}

export default Toast;
