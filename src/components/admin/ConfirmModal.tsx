import { WarningIcon, XIcon } from "@phosphor-icons/react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  loading = false,
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-sm border border-[#DEDEDE]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE]">
          <h3 className="raleway-bold text-base text-[#533113]">{title}</h3>
          <button onClick={onCancel} disabled={loading}>
            <XIcon size={20} className="text-[#533113]" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            {danger && (
              <WarningIcon size={22} weight="fill" className="text-red-500 shrink-0 mt-0.5" />
            )}
            <p className="raleway-regular text-base text-[#533113]/70">{message}</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="raleway-regular text-base text-[#533113] px-5 py-2.5 border border-[#DEDEDE] hover:bg-[#533113]/5 transition-colors disabled:opacity-60"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={
                danger
                  ? "raleway-bold text-sm text-white bg-red-500 px-6 py-2.5 uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-60"
                  : "raleway-bold text-sm text-white bg-[#533113] px-6 py-2.5 uppercase tracking-widest hover:bg-[#3d2409] transition-colors disabled:opacity-60"
              }
            >
              {loading ? "Working…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
