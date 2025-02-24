import React, { useState, useEffect } from "react";
import { Button, Menu, ConfigProvider, theme } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  WalletOutlined,
  LogoutOutlined,
  BankOutlined,
  SettingOutlined,
  TransactionOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";

type MenuItem = Required<MenuProps>["items"][number];

const SideBar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const savedCollapsedState = localStorage.getItem("sidebar-collapsed");
  const savedOpenKeysState = localStorage.getItem("sidebar-open-keys");

  const initialCollapsedState = savedCollapsedState
    ? JSON.parse(savedCollapsedState)
    : true;
  const initialOpenKeysState = savedOpenKeysState
    ? JSON.parse(savedOpenKeysState)
    : [];

  const [collapsed, setCollapsed] = useState(initialCollapsedState);
  const [openKeys, setOpenKeys] = useState<string[]>(initialOpenKeysState);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed));
    localStorage.setItem("sidebar-open-keys", JSON.stringify(openKeys));
  }, [collapsed, openKeys]);

  const getSelectedKey = () => {
    const path = location.pathname;
    switch (path) {
      case "/home":
        return "dashboard";
      case "/accounts":
        return "accounts";
      case "/transactions":
        return "transactions";
      case "/savings":
        return "savings";
      case "/settings":
        return "settings";
      default:
        return "";
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleMenuClick = (e: { key: string }) => {
    if (e.key === "logout") {
      handleLogout();
      return;
    }

    switch (e.key) {
      case "dashboard":
        navigate("/home");
        break;
      case "accounts":
        navigate("/accounts");
        break;
      case "transactions":
        navigate("/transactions");
        break;
      case "savings":
        navigate("/savings");
        break;
      case "settings":
        navigate("/settings");
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
      key: "accounts",
      icon: <BankOutlined />,
      label: "Recuring payments",
    },
    {
      key: "transactions",
      icon: <TransactionOutlined />,
      label: "Transactions",
    },
    {
      key: "savings",
      icon: <WalletOutlined />,
      label: "Savings",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
    },
  ];

  const logoutItem: MenuItem = {
    key: "logout",
    icon: <LogoutOutlined />,
    label: "Logout",
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

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
          },
        },
      }}
    >
      <div
        style={{ borderRight: "none" }}
        className={`h-screen transition-all duration-300 flex flex-col bg-black ${
          collapsed ? "w-20" : "w-48"
        } border-r border-gray-200`}
      >   

        
        <Button
          type="text"
          onClick={toggleCollapsed}
          className="m-4 border rounded underline"
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </Button>

        <Menu
          onClick={handleMenuClick}
          selectedKeys={[getSelectedKey()]}
          mode="inline"
          theme="light"
          inlineCollapsed={collapsed}
          openKeys={openKeys}
          onOpenChange={(keys) => setOpenKeys(keys)}
          items={mainMenuItems}
          style={{ borderRight: "none" }}
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
