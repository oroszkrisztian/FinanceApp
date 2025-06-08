import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  Target,
  TrendingDown,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const RECOMMENDED_QUESTIONS = [
  "What is my total spending this month?",
  "How much did I save compared to last month?",
  "What are my top 3 spending categories?",
  "Do I have any upcoming bills?",
  "How much did I earn this month?",
  "What is my current savings rate?",
  "Are there any unusual transactions this month?",
  "How close am I to my budget limits?",
  "What is my debt to income ratio?",
  "Do you have any tips to improve my finances?",
];

interface AIInsightsComponentProps {
  accounts: any[];
  transactions: any[];
  futureOutgoingPayments: any[];
  futureIncomingPayments: any[];
  budgets: any[];
  isSmallScreen?: boolean;
}

interface AIInsight {
  type: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  actionable: boolean;
}

interface AIRecommendation {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: "budget" | "savings" | "investment" | "spending";
}

interface AIAlert {
  type: string;
  message: string;
  severity: "warning" | "critical";
}

interface AIResponse {
  insights: AIInsight[];
  recommendations: AIRecommendation[];
  alerts: AIAlert[];
  summary: {
    financial_health_score: number;
    key_metrics: {
      savings_rate: string;
      debt_to_income: string;
      emergency_fund_months: number;
    };
  };
}

const AIInsightsComponent: React.FC<AIInsightsComponentProps> = ({
  accounts,
  transactions,
  futureOutgoingPayments,
  futureIncomingPayments,
  budgets,
  isSmallScreen = false,
}) => {
  const [isMobileView, setIsMobileView] = useState(false);
  const [chat, setChat] = useState<
    { sender: "user" | "ai"; message: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  const sendMessage = async (question: string) => {
    if (!token || !question.trim()) return;
    setChat((prev) => [...prev, { sender: "user", message: question }]);
    setLoading(true);
    setError(null);
    setInput("");
    try {
      const response = await fetch("http://localhost:3000/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question,
          accounts,
          transactions,
          futureOutgoingPayments,
          futureIncomingPayments,
          budgets,
        }),
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success && data.answer) {
        setChat((prev) => [...prev, { sender: "ai", message: data.answer }]);
      } else {
        throw new Error(data.error || "Failed to get AI response");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get AI response"
      );
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setChat([]);
    setError(null);
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden ${
        isMobileView ? "p-3 mb-4 mx-2" : "p-6 mb-8"
      }`}
      style={{
        height: isMobileView ? "auto" : "500px",
        minHeight: isMobileView ? "300px" : "500px",
      }}
    >
      {/* Background Gradient Elements */}
      <div
        className={`absolute top-0 right-0 bg-gradient-to-br from-purple-300 to-indigo-500 rounded-full opacity-20 ${
          isMobileView
            ? "w-12 h-12 -translate-y-6 translate-x-6"
            : "w-28 h-28 -translate-y-14 translate-x-14"
        }`}
      ></div>
      <div
        className={`absolute bottom-0 left-0 bg-gradient-to-tr from-pink-300 to-purple-500 rounded-full opacity-15 ${
          isMobileView
            ? "w-8 h-8 translate-y-4 -translate-x-4"
            : "w-20 h-20 translate-y-10 -translate-x-10"
        }`}
      ></div>
      <div
        className={`absolute bg-gradient-to-br from-blue-300 to-cyan-500 rounded-full opacity-10 ${
          isMobileView ? "top-3 left-16 w-6 h-6" : "top-8 left-32 w-16 h-16"
        }`}
      ></div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className={`flex-shrink-0 ${isMobileView ? "mb-3" : "mb-6"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div
                className={`bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md ${
                  isMobileView ? "w-8 h-8" : "w-12 h-12"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Brain
                  className={`text-white ${isMobileView ? "w-4 h-4" : "w-6 h-6"}`}
                />
              </motion.div>
              <div>
                <h3
                  className={`font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent ${
                    isMobileView ? "text-lg" : "text-xl"
                  }`}
                >
                  AI Financial Chat
                </h3>
                <p
                  className={`text-gray-500 font-medium ${isMobileView ? "text-xs" : "text-sm"}`}
                >
                  Ask about your monthly statistics or finances
                </p>
              </div>
            </div>

            {/* Clear Chat Button - Only show when there are messages */}
            {chat.length > 0 && (
              <motion.button
                onClick={clearChat}
                className={`flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg transition-colors border border-gray-200 hover:border-red-200 ${
                  isMobileView ? "text-xs" : "text-sm"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title="Clear chat history"
              >
                <Trash2 className={`${isMobileView ? "w-3 h-3" : "w-4 h-4"}`} />
                <span className={isMobileView ? "hidden" : "inline"}>
                  Clear
                </span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div
          className="flex-1 mb-2"
          style={
            isMobileView
              ? { maxHeight: "300px", overflowY: "auto", minHeight: 0 }
              : { minHeight: 0, overflowY: "auto" }
          }
        >
          {chat.length === 0 && (
            <div className="text-center space-y-4 mt-6">
              <motion.div
                className={`mx-auto bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center ${
                  isMobileView ? "w-16 h-16" : "w-24 h-24"
                }`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Sparkles
                  className={`text-purple-600 ${isMobileView ? "w-8 h-8" : "w-12 h-12"}`}
                />
              </motion.div>
              <div className="space-y-2">
                <h4
                  className={`font-bold text-gray-800 ${isMobileView ? "text-base" : "text-lg"}`}
                >
                  Ask a question
                </h4>
                <p
                  className={`text-gray-600 max-w-xs mx-auto ${isMobileView ? "text-sm" : "text-base"}`}
                >
                  Type your question or pick one below to get started!
                </p>
              </div>
              <div className="grid gap-2 mt-4 grid-cols-1 sm:grid-cols-2">
                {RECOMMENDED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    className="bg-gray-100 hover:bg-indigo-100 text-gray-700 rounded-lg px-3 py-2 text-xs sm:text-sm transition-colors border border-gray-200"
                    onClick={() => sendMessage(q)}
                    disabled={loading}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col space-y-3">
            {chat.map((msg, idx) => (
              <div key={idx} className="w-full">
                <div
                  className={`rounded-lg px-4 py-2 max-w-[90%] mb-1 ${
                    msg.sender === "user"
                      ? "bg-indigo-500 text-white self-end ml-auto"
                      : "bg-gray-100 text-gray-800 self-start mr-auto"
                  }`}
                  style={{
                    alignSelf:
                      msg.sender === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  {msg.message}
                </div>
              </div>
            ))}
            {loading && (
              <div className="w-full">
                <div className="rounded-lg px-4 py-2 bg-gray-100 text-gray-800 animate-pulse max-w-[90%] self-start mr-auto">
                  AI is typing...
                </div>
              </div>
            )}
            {error && (
              <div className="w-full">
                <div className="rounded-lg px-4 py-2 bg-red-100 text-red-700 max-w-[90%] self-center mx-auto">
                  {error}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <form
          className="flex items-center space-x-2 mt-auto"
          onSubmit={(e) => {
            e.preventDefault();
            if (!loading && input.trim()) sendMessage(input);
          }}
        >
          <input
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            type="text"
            placeholder="Ask about your finances..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg px-4 py-2 font-semibold shadow-md hover:shadow-lg disabled:opacity-50"
            disabled={loading || !input.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIInsightsComponent;
