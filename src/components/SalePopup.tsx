import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { XIcon, ArrowLineUpRightIcon } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

interface PopupDoc {
  enabled: boolean;
  title: string;
  body: string;
  ctaText: string;
  ctaLink: string;
}

const SESSION_KEY = "fw_popup_dismissed";

function SalePopup() {
  const [popup, setPopup] = useState<PopupDoc | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "siteSettings", "popup"));
        if (snap.exists()) {
          const data = snap.data() as PopupDoc;
          if (data.enabled) {
            setPopup(data);
            setVisible(true);
          }
        }
      } catch {}
    };
    load();
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setVisible(false);
  };

  if (!visible || !popup) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={dismiss}
    >
      <div
        className="relative bg-white max-w-md w-full p-8 flex flex-col gap-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-[#533113]/40 hover:text-[#533113] transition-colors"
        >
          <XIcon size={20} />
        </button>

        {/* Badge */}
        <span className="raleway-regular text-sm tracking-[0.3em] uppercase text-[#533113]/50">
          FitwearGH Sale
        </span>

        {/* Title */}
        <h2 className="raleway-black text-3xl text-[#533113] leading-tight">
          {popup.title}
        </h2>

        {/* Body */}
        {popup.body && (
          <p className="raleway-regular text-base text-[#533113]/70 leading-relaxed">
            {popup.body}
          </p>
        )}

        {/* CTA */}
        {popup.ctaText && popup.ctaLink && (
          <Link
            to={popup.ctaLink}
            onClick={dismiss}
            className="bg-[#533113] text-white flex items-center justify-between px-5 py-3 hover:bg-[#3d2409] transition-colors"
          >
            <span className="raleway-regular text-base">{popup.ctaText}</span>
            <ArrowLineUpRightIcon size={16} />
          </Link>
        )}

        {/* Dismiss link */}
        <button
          onClick={dismiss}
          className="raleway-regular text-sm text-[#533113]/40 hover:text-[#533113]/60 underline underline-offset-2 self-start transition-colors"
        >
          No thanks
        </button>
      </div>
    </div>
  );
}

export default SalePopup;
