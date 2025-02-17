import React, { useState, useEffect } from "react";
import { Button, Menu, ConfigProvider, theme } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  WalletOutlined,
  DollarOutlined,
  LogoutOutlined,
  PlusCircleOutlined,
  AreaChartOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";

type MenuItem = Required<MenuProps>["items"][number];

const SideBar: React.FC = () => {
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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed));
    localStorage.setItem("sidebar-open-keys", JSON.stringify(openKeys));
  }, [collapsed, openKeys]);

  useEffect(() => {
    if (
      (location.pathname === "/add-expense" ||
        location.pathname === "/overview") &&
      !collapsed
    ) {
      if (!openKeys.includes("expenses")) {
        setOpenKeys([...openKeys, "expenses"]);
      }
    }
  }, [location.pathname, openKeys, collapsed]);

  const getSelectedKey = () => {
    if (location.pathname === "/add-expense") return "add-expense";
    if (location.pathname === "/home") return "dashboard";
    if (location.pathname === "/savings") return "savings";
    if (location.pathname === "/expenses") return "expenses";
    if (location.pathname === "/overview") return "overview";
    return "";
  };

  const handleMenuCick = (e: { key: string }) => {
    if (e.key === "add-expense") {
      navigate("/add-expense");
    }
    if (e.key === "dashboard") {
      navigate("/home");
      console.log("dashboard clicked");
    }
    if (e.key === "savings") {
      navigate("/savings");
      console.log("saving clicked");
    }
    if (e.key === "logout") {
      console.log("Logout clicked");
    }
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const mainMenuItems: MenuItem[] = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "savings",
      icon: <WalletOutlined />,
      label: "Savings",
    },
    {
      key: "expenses",
      icon: <DollarOutlined />,
      label: "Expenses",
      children: [
        {
          key: "add-expense",
          icon: <PlusCircleOutlined />,
          label: "Add Expense",
        },
        {
          key: "overview",
          icon: <AreaChartOutlined />,
          label: "Overview",
        },
      ],
    },
  ];

  const logoutItem: MenuItem = {
    key: "logout",
    icon: <LogoutOutlined />,
    label: "Logout",
    className: "mt-auto",
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm, // or theme.darkAlgorithm for dark mode
        token: {
          colorPrimary: "#1E293B", // Dark blue-gray
          colorText: "#0F172A", // Almost black
          colorBgContainer: "#F8FAFC", // Light gray background
          borderRadius: 8,
        },
        components: {
          Menu: {
            itemSelectedColor: "#FFFFFF", // White text color for selected item
            itemHoverColor: "#1E293B",
            itemHoverBg: "#CBD5E1",
            itemSelectedBg: "#000000", // Black background for selected item
            darkItemSelectedColor: "#FFFFFF", // White text color for selected item in dark mode
          },
        },
      }}
    >
      <div
        className={`h-screen border-r transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        } flex flex-col bg-white`}
      >
        <Button
          type="text"
          onClick={toggleCollapsed}
          className={`m-4 border rounded ${collapsed ? "w-12" : "w-auto"}`}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </Button>

        <Menu
          onClick={handleMenuCick}
          selectedKeys={[getSelectedKey()]}
          mode="inline"
          theme="light"
          inlineCollapsed={collapsed}
          openKeys={openKeys}
          onOpenChange={(keys) => setOpenKeys(keys)}
          items={mainMenuItems}
        />

        <Menu
          onClick={handleMenuCick}
          mode="inline"
          theme="light"
          inlineCollapsed={collapsed}
          items={[logoutItem]}
        />
      </div>
    </ConfigProvider>
  );
};

export default SideBar;
