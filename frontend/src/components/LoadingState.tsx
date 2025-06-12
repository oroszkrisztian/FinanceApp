import React from "react";
import { Loader2 } from "lucide-react";

interface DataStatus {
  label: string;
  isLoaded: boolean;
}

interface LoadingStateProps {
  title?: string;
  message?: string;
  dataStatus?: DataStatus[];
  showDataStatus?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  title = "Loading",
  message = "Please wait while we load your data...",
  dataStatus = [],
  showDataStatus = false,
}) => {
  return (
    <div className="flex flex-col h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={48} className="animate-spin text-indigo-600" />
        <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
        <p className="text-gray-500">{message}</p>
        
        {showDataStatus && dataStatus.length > 0 && (
          <div className="text-xs text-gray-400 mt-2 space-y-1">
            {dataStatus.map((item, index) => (
              <div key={index}>
                • {item.label}: {item.isLoaded ? "✓" : "⏳"}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingState;