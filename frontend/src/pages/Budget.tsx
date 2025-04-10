import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

import { getAllBudgets } from "../services/budgetService";
import { Budget as BudgetType } from "../interfaces/Budget";
import { CustomCategory } from "../interfaces/CustomCategory";

import LoadingState from "../components/LoadingState";
import { getAllSystemCategories } from "../services/categoriesService";
import Budgets from "../components/budget/Budgets";

const Budget: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [budgets, setBudgets] = useState<BudgetType[]>([]);
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const budgetData = await getAllBudgets(user.id);
      setBudgets(Array.isArray(budgetData) ? budgetData : []);
    } catch (err) {
      console.error("Error fetching budgets:", err);
      setError("Failed to load budgets. Please try again later.");
    }
  };

  const fetchCategories = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const categoriesData = await getAllSystemCategories();
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories. Please try again later.");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500)); 
        await Promise.all([fetchBudgets(), fetchCategories()]);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const handleBudgetSuccess = (): void => {
    fetchBudgets();
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto p-4 max-w-screen-xl">
        {error ? (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-red-700 underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Budgets
              budgets={budgets}
              categories={categories}
              onSuccess={handleBudgetSuccess}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Budget;
