import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activePage, setActivePage] = useState("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Determine active page based on current route
  React.useEffect(() => {
    const path = location.pathname;
    if (path === "/") setActivePage("dashboard");
    else if (path === "/admin") setActivePage("admin");
    else if (path === "/transactions") setActivePage("transactions");
    else if (path === "/reports") setActivePage("reports");
    else setActivePage("dashboard");
  }, [location.pathname]);

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="flex h-screen bg-gray-50 flex-col lg:flex-row">
      {/* Sidebar - Only shown on desktop */}
      <div className="hidden lg:flex lg:flex-col">
        <Sidebar activePage={activePage} onNavigate={handleNavigation} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header - Only shown on mobile and tablet */}
        <MobileHeader
          activePage={activePage}
          onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
          isMenuOpen={isMenuOpen}
        />

        {/* Desktop Header - Only shown on desktop */}
        <header className="hidden lg:flex items-center justify-between px-6 py-4 bg-white shadow-sm border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {activePage === "dashboard" && "Dashboard Publik"}
              {activePage === "admin" && "Admin Dashboard"}
              {activePage === "transactions" && "Transactions"}
              {activePage === "reports" && "Reports"}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {activePage === "dashboard" &&
                "Data penyetoran sampah bank sampah"}
              {activePage === "admin" && "Kelola data penyetoran sampah"}
              {activePage === "transactions" && "Riwayat transaksi penyetoran"}
              {activePage === "reports" && "Laporan dan analisis data"}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className="w-6 h-6">
                <img
                  src="https://img.icons8.com/?size=100&id=12776&format=png&color=000000"
                  alt="calendar"
                />
              </span>
              <span className="font-bold">
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-6">
          <div className="responsive-container">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
