import React from "react";
import { useAuth } from "../../components/services/useAuth";
import { Link } from "react-router-dom";
import ConfirmationModal from "../molecules/ConfirmationModal";
import { useState } from "react";

const Sidebar = ({ activePage, onNavigate }) => {
  const { user, signOut } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      imgLogo:
        "https://img.icons8.com/?size=100&id=XnHBz2LnhELw&format=png&color=000000",
      path: "/",
    },
    {
      id: "admin",
      label: "Admin Panel",
      imgLogo:
        "https://img.icons8.com/?size=100&id=23280&format=png&color=000000",
      path: "/admin",
    },
    {
      id: "reports",
      label: "Reports",
      imgLogo:
        "https://img.icons8.com/?size=100&id=103978&format=png&color=000000",
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

  return (
    <>
      <div className="w-64 bg-slate-800 text-white min-h-screen flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-xl">
                <img src="./public/logo.png" alt="Logo" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold truncate">Bakti Alam</h1>
              <p className="text-slate-400 text-xs truncate">
                Karang Taruna Darma Bakti
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activePage === item.id
                      ? "bg-green-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <span className="text-lg shrink-0">
                    <img className="w-5 h-5" src={item.imgLogo} alt="" />
                  </span>
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-slate-700">
          <Link to="/auth" className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center shrink-0">
              <span className="text-sm">👤</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.email || "Guest"}
              </p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-all duration-200"
          >
            <span>
              <img
                className="h-5 w-5"
                src="https://img.icons8.com/?size=100&id=j5sJqtadgqDL&format=png&color=000000"
                alt=""
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
    </>
  );
};

export default Sidebar;
