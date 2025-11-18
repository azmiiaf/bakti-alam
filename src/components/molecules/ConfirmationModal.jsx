import React from "react";

const ConfirmationModal = ({
  isOpen,
  title,
  message,
  actionLabel = "Konfirmasi",
  cancelLabel = "Batal",
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="mb-6 text-gray-700">{message}</p>
        <div className="flex space-x-4">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="btn-outline flex-1"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={isDangerous ? "btn-danger flex-1" : "btn-primary flex-1"}
          >
            {isLoading ? "Memproses..." : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
