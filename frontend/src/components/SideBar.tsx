import React, { useState } from 'react';
import { Home, BarChart, Users, Settings, HelpCircle, Menu, ChevronLeft } from 'lucide-react';

const drawerWidth = 240;

const SideBar = () => {
  const [open, setOpen] = useState(false);

  const menuItems = [
    { title: 'Dashboard', icon: <Home />, path: '/dashboard' },
    { title: 'Analytics', icon: <BarChart />, path: '/analytics' },
    { title: 'Users', icon: <Users />, path: '/users' },
    { title: 'Settings', icon: <Settings />, path: '/settings' },
    { title: 'Help', icon: <HelpCircle />, path: '/help' },
  ];

  return (
    <div className="relative">
      {/* Drawer */}
      <div
        className="fixed top-0 left-0 h-full bg-white shadow-lg transform transition-all duration-300 ease-in-out"
        style={{
          width: open ? 'auto' : 'fit-content', 
          transitionProperty: 'width, transform',
          transitionDuration: '300ms',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header with toggle button */}
        <div className="h-16 flex items-center justify-between px-4 relative">
          {open && <span className="text-[#BFA55E] font-semibold">Menu</span>}
          <div className={`${open ? 'absolute right-4' : 'flex justify-center w-full'}`}>
            <button
              onClick={() => setOpen(!open)}
              className={`
                p-2 rounded-full 
                bg-[#BFA55E] hover:bg-[#A88F4C] text-white
                transition-all duration-300 ease-in-out
              `}
              aria-label="toggle menu"
            >
              {open ? <ChevronLeft size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <div className="overflow-hidden ">
          {menuItems.map((item) => (
            <div
              key={item.title}
              className={`
                w-full
                ${open ? 'px-2 py-2' : 'px-0 py-2'}
              `}
            >
              <button
                className={`
                  w-full h-full flex items-center p-1
                  hover:bg-[#BFA55E]/10 group
                  transition-all duration-200 ease-in-out rounded-lg
                  ${open ? 'px-3' : 'justify-center'}
                `}
              >
                <span
                  className={`
                    text-[#BFA55E] transition-all duration-200 ease-in-out
                    ${open ? 'mr-3' : ''}
                    ${!open ? 'transform group-hover:scale-110' : ''}
                  `}
                >
                  {item.icon}
                </span>
                <span
                  className={`
                    whitespace-nowrap text-gray-700 font-medium
                    transition-all duration-300 ease-in-out
                    ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 hidden'}
                  `}
                >
                  {item.title}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SideBar;
