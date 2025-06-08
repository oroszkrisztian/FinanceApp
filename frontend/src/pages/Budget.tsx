import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { getAllBudgets } from "../services/budgetService";
import { Budget as BudgetType } from "../interfaces/Budget";
import { CustomCategory } from "../interfaces/CustomCategory";
import LoadingState from "../components/LoadingState";
import { getAllSystemCategories } from "../services/categoriesService";
import BudgetDashboard from "../components/budget/BudgetDashboard";

const Budget: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [budgets, setBudgets] = useState<BudgetType[]>([]);
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [deletedBudgets, setDeletedBudgets] = useState<BudgetType[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const budgetData = await getAllBudgets(user.id);
      const activeBudgets = budgetData.filter(
        (budget: BudgetType) => !budget.deletedAt
      );
      const deletedBudgetsList = budgetData.filter(
        (budget: BudgetType) => budget.deletedAt
      );
      setBudgets(activeBudgets);
      setDeletedBudgets(deletedBudgetsList);
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
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 max-w-screen-2xl">
        {error ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-red-200 relative overflow-hidden">
              {/* Background elements */}
              <div className="absolute top-0 right-0 bg-gradient-to-br from-red-300 to-pink-500 rounded-full opacity-20 w-20 h-20 -translate-y-10 translate-x-10"></div>
              <div className="absolute bottom-0 left-0 bg-gradient-to-tr from-pink-300 to-red-500 rounded-full opacity-15 w-16 h-16 translate-y-8 -translate-x-8"></div>

              <div className="relative z-10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-red-100 rounded-xl p-3">
                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-red-800">Something went wrong</h3>
                    <p className="text-red-600">We encountered an error while loading your data</p>
                  </div>
                </div>
                
                <div className="bg-red-50/80 backdrop-blur-sm rounded-xl p-4 border border-red-200/50 mb-4">
                  <p className="text-red-700 font-medium">{error}</p>
                </div>

                <motion.button
                  onClick={() => window.location.reload()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all font-medium shadow-md flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try again
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <BudgetDashboard
            budgets={budgets}
            categories={categories}
            deletedBudgets={deletedBudgets}
            onSuccess={handleBudgetSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default Budget;