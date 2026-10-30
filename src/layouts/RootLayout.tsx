import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { ToastContainer } from '../components/common/Toast';

export const RootLayout: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-slate-100 antialiased selection:bg-rose-500/30 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Dynamic View */}
      <main className="flex-1 flex flex-col w-full">
        <Outlet />
      </main>

      {/* Global Toast System */}
      <ToastContainer />

      {/* Mobile Touch Bottom Nav */}
      <MobileBottomNav />

      {/* Comprehensive Dark Footer */}
      <Footer />
    </div>
  );
};
