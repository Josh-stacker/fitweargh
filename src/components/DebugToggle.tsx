import { useDebug } from "../context/DebugContext";
import { BugIcon } from "@phosphor-icons/react";

function DebugToggle() {
  const { isDebugUser, debugEnabled, toggleDebug } = useDebug();
  if (!isDebugUser) return null;

  return (
    <button
      onClick={toggleDebug}
      title={debugEnabled ? "Debug ON — click to disable" : "Debug OFF — click to enable"}
      className={`fixed bottom-6 left-4 z-[9999] flex items-center gap-2 px-3 py-2 rounded-full shadow-lg raleway-bold text-xs transition-colors ${
        debugEnabled
          ? "bg-amber-500 text-white"
          : "bg-[#533113]/20 text-[#533113]"
      }`}
    >
      <BugIcon size={16} weight={debugEnabled ? "fill" : "regular"} />
      {debugEnabled ? "Debug ON" : "Debug OFF"}
    </button>
  );
}

export default DebugToggle;
