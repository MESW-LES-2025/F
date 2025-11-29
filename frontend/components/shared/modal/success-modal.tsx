import { CheckCircle } from "lucide-react";
import { createPortal } from "react-dom";

interface SuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  text: string;
}

export function SuccessActionModal({
  open,
  onOpenChange,
  text,
}: SuccessModalProps) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
      <div className="bg-white p-6 rounded-lg shadow-xl min-w-[280px]">
        <div className="flex justify-start gap-3 justify-center mb-4">
          <CheckCircle className="text-red-600" />
          <h2 className="text-lg font-semibold">Success</h2>
        </div>
        <div className="mb-4">
          <p>{text}</p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-1 rounded bg-gray-200"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
