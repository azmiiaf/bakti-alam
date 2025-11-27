import React, { useState } from "react";
import { useAuth } from "../services/useAuth";
import { useNavigate } from "react-router-dom";
import ConfirmationModal from "../molecules/ConfirmationModal";

const MobileHeader = ({ activePage, onMenuToggle, isMenuOpen }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      imgLogo:
        "https://img.icons8.com/?size=100&id=XnHBz2LnhELw&format=png&color=FFFFFF",
      path: "/",
    },
    {
      id: "admin",
      label: "Admin Panel",
      imgLogo:
        "https://img.icons8.com/?size=100&id=23280&format=png&color=FFFFFF",
      path: "/admin",
    },
    {
      id: "reports",
      label: "Reports",
      imgLogo:
        "https://img.icons8.com/?size=100&id=103978&format=png&color=FFFFFF",
      path: "/reports",
    },
  ];

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    signOut();
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    onMenuToggle(); // Close the menu after navigation
  };

  // Toggle body class to prevent horizontal scroll
  React.useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMenuOpen]);

  return (
    <div className="lg:hidden bg-slate-800 text-white sticky top-0 z-40 border-b border-slate-700">
      {/* Mobile Header - Logo and Hamburger */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-lg">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-full h-full rounded-4xl"
              />
            </span>
          </div>
          <h1 className="text-lg font-bold">Bakti Alam</h1>
        </div>

        {/* Hamburger Menu Button */}
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Sidebar Menu - Overlay style */}
      {isMenuOpen && (
        <div
          className="fixed top-18 inset-0 bg-[#00000075] "
          onClick={onMenuToggle}
        />
      )}

      <div
        className={`fixed top-16 right-0 h-screen w-64 bg-slate-800 shadow-lg z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Navigation Menu */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activePage === item.id
                      ? "bg-green-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <span className="text-lg">
                    <img
                      className="w-5 h-5"
                      src={item.imgLogo}
                      alt={item.label}
                    />
                  </span>
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-slate-700 mt-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center shrink-0">
              <span className="text-sm">👤</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.email || "Guest"}
              </p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-all duration-200"
          >
            <span>
              <img
                className="h-5 w-5"
                src="https://img.icons8.com/?size=100&id=j5sJqtadgqDL&format=png&color=FFFFFF"
                alt="logout"
              />
            </span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        title="Konfirmasi Logout"
        message="Apakah Anda yakin ingin logout?"
        actionLabel="Logout"
        cancelLabel="Batal"
        isDangerous={true}
        isLoading={false}
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </div>
  );
};

export default MobileHeader;
