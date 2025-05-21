import React, { useState, useEffect } from "react";
import IncomingRecurringFunds from "../components/payments/IncomingRecurringFunds";
import OutgoingRecurringBills from "../components/payments/OutgoingRecurringBills";

import { Wallet, CreditCard } from "lucide-react";

const Payments: React.FC = () => {
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('income');
  
  const checkScreenSize = () => {
    setIsSmallScreen(window.innerWidth < 768);
  };
  
  useEffect(() => {
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-indigo-50">
    
      {isSmallScreen ? (
        <div className="flex flex-col flex-1 w-full pt-4">
          {/* Mobile Tabs - Improved design */}
          <div className="flex w-full mb-3 mt-3 px-4">
            <button
              className={`w-1/2 py-3 font-medium text-center rounded-tl-lg rounded-bl-lg transition-all duration-200 flex items-center justify-center gap-2
                ${activeTab === 'income' 
                  ? 'bg-green-500 text-white shadow-md' 
                  : 'bg-white text-gray-600 border border-gray-200'}`}
              onClick={() => setActiveTab('income')}
            >
              <Wallet size={18} />
              <span>Incoming</span>
            </button>
            <button
              className={`w-1/2 py-3 font-medium text-center rounded-tr-lg rounded-br-lg transition-all duration-200 flex items-center justify-center gap-2
                ${activeTab === 'expense' 
                  ? 'bg-red-500 text-white shadow-md' 
                  : 'bg-white text-gray-600 border border-gray-200'}`}
              onClick={() => setActiveTab('expense')}
            >
              <CreditCard size={18} />
              <span>Outgoing</span>
            </button>
          </div>
          
          {/* Mobile Content */}
          <div className="flex-1 px-4 pb-6 overflow-hidden animate-fadeIn">
            {activeTab === 'income' ? (
              <IncomingRecurringFunds isSmallScreen={isSmallScreen} />
            ) : (
              <OutgoingRecurringBills isSmallScreen={isSmallScreen} />
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 w-full pt-4 px-6 pb-6 gap-6 overflow-hidden mb-16">
          {/* Desktop View - Side by Side with improved spacing */}
          <div className="w-1/2 flex flex-col transform transition-all duration-300 hover:scale-[1.01]">
            <IncomingRecurringFunds isSmallScreen={isSmallScreen} />
          </div>
          <div className="w-1/2 flex flex-col transform transition-all duration-300 hover:scale-[1.01]">
            <OutgoingRecurringBills isSmallScreen={isSmallScreen} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;