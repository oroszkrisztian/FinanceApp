import React from "react";
import TopBar from "../components/TopBar";

import Utilzone from "../components/payments/UtilZone";


const Payments: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
       
        

        {/* Utilzone with Search and Add Payment Button */}
        <div className="p-4 bg-white border-b border-gray-200">
          <Utilzone />
        </div>

        {/* Main Content */}
        <div className="flex-1 px-6 py-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <p className="text-gray-600">This is your Payments page.</p>
            {/* Add your payments list or other content here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payments;