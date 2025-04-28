import React, { useEffect, useState } from "react";
import { User, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TopBarProps {
  title: string;
  collapsed: boolean;
  toggleSidebar: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ title, collapsed, toggleSidebar }) => {
  const navigate = useNavigate();
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 640) {
        setIsMobileScreen(true);
      } else {
        setIsMobileScreen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <div className="bg-black h-14 flex items-center justify-between px-4 w-full shadow-md">
      {/* Left section with menu toggle */}
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="h-10 w-10 text-white hover:bg-gray-800 rounded-full flex items-center justify-center mr-2 transition-colors duration-300 ease-in-out"
          aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
        >
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      {/* Center section with title */}
      <h1
        className={`text-2xl font-semibold text-white text-center flex-1 ${
          isMobileScreen ? "" : "md:translate-x-10"
        }`}
      >
        {title}
      </h1>

      {/* Right section with profile */}
      <button
        onClick={handleProfileClick}
        className="h-10 w-10 z-10 bg-white rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center"
      >
        <User className="text-black" size={20} />
      </button>
    </div>
  );
};

export default TopBar;
