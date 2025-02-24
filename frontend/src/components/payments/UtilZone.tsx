import React, { useState } from "react";
import Modal from "./Modal";
import AddPaymentForm from "./AddPaymentForm";

const Utilzone: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddPayment = () => {
    setIsModalOpen(true); 
  };

  const handleCloseModal = () => {
    setIsModalOpen(false); 
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
      {/* Search Bar */}
      <div className="w-full md:max-w-md">
        <input
          type="text"
          placeholder="Search payments..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Add Payment Button */}
      <button
        onClick={handleAddPayment}
        className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Add Payment
      </button>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <AddPaymentForm onClose={handleCloseModal} />
      </Modal>
    </div>
  );
};

export default Utilzone;
