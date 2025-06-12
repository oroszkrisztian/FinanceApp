import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { getAllBudgets } from "../services/budgetService";
import { Budget as BudgetType } from "../interfaces/Budget";
import { CustomCategory } from "../interfaces/CustomCategory";
import { getAllCategoriesForUser } from "../services/categoriesService";
import BudgetDashboard from "../components/budget/BudgetDashboard";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";

const Budget: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [budgets, setBudgets] = useState<BudgetType[]>([]);
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [deletedBudgets, setDeletedBudgets] = useState<BudgetType[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = async () => {
    try {
      const budgetData = await getAllBudgets();
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
    try {
      const categoriesData = await getAllCategoriesForUser();
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
  }, []);

  const handleBudgetSuccess = (): void => {
    fetchBudgets();
  };

  if (loading) {
    return (
      <LoadingState
        title="Loading Budgets"
        message="Loading your budget data..."
        showDataStatus={true}
        dataStatus={[
          {
            label: "Budgets",
            isLoaded: !loading && Array.isArray(budgets),
          },
          {
            label: "Categories",
            isLoaded: !loading && Array.isArray(categories),
          },
          {
            label: "Deleted Budgets",
            isLoaded: !loading && Array.isArray(deletedBudgets),
          },
        ]}
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        title="Budget Loading Error"
        showHomeButton={true}
        onRetry={() => {
          setError(null);
          setLoading(true);
          const loadData = async () => {
            try {
              await Promise.all([fetchBudgets(), fetchCategories()]);
            } catch (err) {
              console.error("Error loading data:", err);
            } finally {
              setLoading(false);
            }
          };
          loadData();
        }}
      />
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 max-w-screen-2xl">
        <BudgetDashboard
          budgets={budgets}
          categories={categories}
          deletedBudgets={deletedBudgets}
          onSuccess={handleBudgetSuccess}
        />
      </div>
    </div>
  );
};

export default Budget;
