import { useState } from "react";
import CreateNewBudget from "./CreateNewBudget";
import { CustomCategory } from "../../interfaces/CustomCategory";


interface EmptyBudgetProps {
  categories: CustomCategory[];
  onSuccess?: () => void;
}

const EmptyBudget: React.FC<EmptyBudgetProps> = ({ categories, onSuccess }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateBudget = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="flex items-center justify-center h-full p-4">
      <div className="card bg-white border-2 border-indigo-200 rounded-2xl shadow-xl p-8 max-w-md w-full transform transition-all hover:shadow-2xl animate-fade-up animate-once animate-duration-[400ms] animate-delay-100 animate-ease-in">
        <div className="flex flex-col items-center justify-center">
          <div className="mb-4 text-7xl animate-bounce">💰</div>
          <h2 className="text-2xl font-bold mb-3 text-indigo-700">
            Budget Adventure Awaits!
          </h2>
          <p className="text-gray-600 mb-5 text-center max-w-md">
            Looks like your budget journey hasn't started yet. Ready to take
            control of your finances?
          </p>
          <button
            onClick={handleCreateBudget}
            className="btn btn-primary bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 text-white px-6 py-2 rounded-full shadow-lg transform transition-transform hover:scale-105"
          >
            ✨ Create Your First Budget ✨
          </button>
        </div>
      </div>

      <CreateNewBudget
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        categories={categories}
        onSuccess={onSuccess}
      />
    </div>
  );
};

export default EmptyBudget;
