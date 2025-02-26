import React from "react";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TopBarProps {
  title: string;
}

const TopBar: React.FC<TopBarProps> = ({ title }) => {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <div className="bg-black h-14 flex items-center justify-center"> 
      <div className="flex items-center max-w-7xl mx-auto w-full h-full px-4"> 
        {/* Title - centered */}
        <h1 className="text-2xl font-semibold text-white flex-1 text-center">
          {title}
        </h1>

        {/* User profile icon */}
        <button
          onClick={handleProfileClick}
          className="h-10 w-10 bg-white rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center ml-4" 
        >
          <User className="text-black" />
        </button>
      </div>
    </div>
  );
};

export default TopBar;