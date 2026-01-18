import React from "react";
import { FaCircleXmark } from "react-icons/fa6";

const MyModal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  const handleOverlayClick = e => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center" onClick={handleOverlayClick}>
      <div className="bg-white p-4 rounded-lg relative">
        <button className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-xl" onClick={onClose}>
          <FaCircleXmark />
        </button>
        {children}
      </div>
    </div>
  );
};

export default MyModal;
