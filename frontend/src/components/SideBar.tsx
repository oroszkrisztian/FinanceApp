import React, { useState, useEffect } from "react";
import { Button, Menu } from "antd";
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

  // Automatically open the "expenses" submenu when on /add-expense or /overview
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
  }, [location.pathname, openKeys, collapsed]); // Add collapsed to the dependencies

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
      icon: <DashboardOutlined className="text-black group-hover:text-black" />,
      label: "Dashboard",
    },
    {
      key: "savings",
      icon: <WalletOutlined className="text-black group-hover:text-black" />,
      label: "Savings",
    },
    {
      key: "expenses",
      icon: <DollarOutlined className="text-black group-hover:text-black" />,
      label: "Expenses",
      children: [
        {
          key: "add-expense",
          icon: (
            <PlusCircleOutlined className="text-black group-hover:text-black" />
          ),
          label: "Add Expense",
        },
        {
          key: "overview",
          icon: (
            <AreaChartOutlined className="text-black group-hover:text-black" />
          ),
          label: "Overview",
        },
      ],
    },
  ];

  const logoutItem: MenuItem = {
    key: "logout",
    icon: <LogoutOutlined className="text-black group-hover:text-black" />,
    label: "Logout",
    className: "mt-auto hover:bg-black hover:text-white",
  };

  return (
    <div
      className={`h-screen bg-white border-r border-gray-200 transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      } flex flex-col`}
    >
      <Button
        type="text"
        onClick={toggleCollapsed}
        className={`m-4 border border-gray-200 rounded ${
          collapsed ? "w-12" : "w-auto"
        }`}
      >
        {collapsed ? (
          <MenuUnfoldOutlined className="text-black" />
        ) : (
          <MenuFoldOutlined className="text-black" />
        )}
      </Button>
      <Menu
        onClick={(e) => handleMenuCick(e)}
        selectedKeys={[getSelectedKey()]}
        mode="inline"
        theme="light"
        inlineCollapsed={collapsed}
        openKeys={openKeys}
        onOpenChange={(keys) => setOpenKeys(keys)}
        items={mainMenuItems}
        className="border-none bg-white flex-1 flex flex-col
          [&_.ant-menu-item-selected]:bg-black
          [&_.ant-menu-item]:text-black
          [&_.ant-menu-submenu-title]:text-black
          [&_.ant-menu-submenu]:text-black
          [&_.ant-menu-item-selected_.anticon]:text-white
          [&_.ant-menu-item-selected:hover]:bg-black
          [&_.ant-menu-item-selected]:!text-white
          [&_.ant-menu-item-selected>span]:!text-white
          [&_.ant-menu-submenu-selected>.ant-menu-submenu-title]:text-black
          [&_.ant-menu-submenu-selected>.ant-menu-submenu-title_.anticon]:text-black"
      />
      <Menu
        onClick={(e) => handleMenuCick(e)}
        mode="inline"
        theme="light"
        inlineCollapsed={collapsed}
        items={[logoutItem]}
        className="border-none bg-white border-t border-gray-200
          [&_.ant-menu-item]:text-black
          [&_.ant-menu-item]:bg-white
          [&_.ant-menu-item-selected]:bg-white
          [&_.ant-menu-item-selected_.anticon]:text-black
          [&_.ant-menu-item-selected]:!text-black
          [&_.ant-menu-item-selected>span]:!text-black
          [&_.ant-menu-item:hover]:bg-black
          [&_.ant-menu-item:hover_.anticon]:text-white
          [&_.ant-menu-item:hover]:!text-white
          [&_.ant-menu-item:hover>span]:!text-white"
      />
    </div>
  );
};

export default SideBar;
