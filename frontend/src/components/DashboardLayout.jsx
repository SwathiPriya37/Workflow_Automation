/**
 * ============================================
 * DASHBOARD LAYOUT COMPONENT
 * ============================================
 * 
 * Main layout wrapper with sidebar.
 */

import Sidebar from './Sidebar';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
