import React, { useState, useEffect } from "react";
import { Menu, ConfigProvider, theme } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Calculator } from "lucide-react";
import {
  DashboardOutlined,
  WalletOutlined,
  LogoutOutlined,
  BankOutlined,
  SettingOutlined,
  TransactionOutlined,
  PieChartOutlined,
  CalculatorOutlined
} from "@ant-design/icons";
import type { MenuProps } from "antd";

type MenuItem = Required<MenuProps>["items"][number];

interface SideBarProps {
  collapsed: boolean;
  onItemClick?: () => void; // New prop to handle click events
}

const SideBar: React.FC<SideBarProps> = ({ collapsed, onItemClick }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const savedOpenKeysState = localStorage.getItem("sidebar-open-keys");
  const initialOpenKeysState = savedOpenKeysState
    ? JSON.parse(savedOpenKeysState)
    : [];

  const [openKeys, setOpenKeys] = useState<string[]>(initialOpenKeysState);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    localStorage.setItem("sidebar-open-keys", JSON.stringify(openKeys));
  }, [openKeys]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getSelectedKey = () => {
    const path = location.pathname;
    switch (path) {
      case "/home":
        return "dashboard";
      case "/payments":
        return "payments";
      case "/transactions":
        return "transactions";
      case "/savings":
        return "savings";
      case "/budget":
        return "budget";
      default:
        return "";
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    if (onItemClick) onItemClick(); 
  };

  const handleMenuClick = (e: { key: string }) => {
    
    if (onItemClick) onItemClick();

    if (e.key === "logout") {
      handleLogout();
      return;
    }

    switch (e.key) {
      case "dashboard":
        navigate("/home");
        break;
      case "payments":
        navigate("/payments");
        break;
      case "transactions":
        navigate("/transactions");
        break;
      case "savings":
        navigate("/savings");
        break;
      case "budget":
        navigate("/budget");
        break;
    }
  };

  const mainMenuItems: MenuItem[] = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "payments",
      icon: <BankOutlined />,
      label: "Payments",
    },
    {
      key: "transactions",
      icon: <TransactionOutlined />,
      label: "Transactions",
    },
    {
      key: "budget",
      icon: <CalculatorOutlined />,
      label: "Budget",
    },
    {
      key: "savings",
      icon: <WalletOutlined />,
      label: "Savings",
    },
  ];

  const logoutItem: MenuItem = {
    key: "logout",
    icon: <LogoutOutlined />,
    label: "Logout",
  };

  if (collapsed && isMobile) {
    return null;
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#000000",
          colorText: "#FFFFFF",
          colorBgContainer: "#000000",
          borderRadius: 8,
        },
        components: {
          Menu: {
            itemSelectedColor: "#000000",
            itemHoverColor: "#1E293B",
            itemHoverBg: "#FFFFFF",
            itemSelectedBg: "#FFFFFF",
            darkItemSelectedColor: "#FFFFFF",
            itemPaddingInline: collapsed ? 12 : 20,
          },
        },
      }}
    >
      <div
        style={{
          borderRight: "none",
          height: "calc(100vh - 3.5rem)",
          width: "100%",
          overflow: "hidden",
          boxShadow: "2px 0 8px rgba(0,0,0,0.2)",
        }}
        className="flex flex-col bg-black border-r border-gray-200"
      >
        <Menu
          onClick={handleMenuClick}
          selectedKeys={[getSelectedKey()]}
          mode="inline"
          theme="light"
          inlineCollapsed={collapsed}
          openKeys={openKeys}
          onOpenChange={(keys) => setOpenKeys(keys)}
          items={mainMenuItems}
          style={{ borderRight: "none", marginTop: "1rem" }}
          className="flex-grow"
        />

        <Menu
          onClick={handleMenuClick}
          mode="inline"
          theme="light"
          inlineCollapsed={collapsed}
          items={[logoutItem]}
          style={{ borderRight: "none" }}
        />
      </div>
    </ConfigProvider>
  );
};

export default SideBar;
