/**
 * ============================================
 * SIDEBAR COMPONENT
 * ============================================
 * 
 * Navigation sidebar for the dashboard.
 */

import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderGit2, 
  GitCommit, 
  Brain, 
  FileText, 
  Mail, 
  Activity,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/projects', icon: FolderGit2, label: 'Projects' },
  { path: '/timeline', icon: GitCommit, label: 'Code Timeline' },
  { path: '/analysis', icon: Brain, label: 'AI Analysis' },
  { path: '/reports', icon: FileText, label: 'Reports' },
  { path: '/email', icon: Mail, label: 'Email Settings' },
  { path: '/logs', icon: Activity, label: 'Logs & Status' },
];

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white shadow-lg z-50">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 bg-gradient-primary">
        <Brain className="h-8 w-8 text-white" />
        <span className="ml-3 text-white font-bold text-lg">WorkflowAI</span>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b">
        <p className="font-medium text-gray-800">{user?.name}</p>
        <p className="text-sm text-gray-500">{user?.email}</p>
      </div>

      {/* Navigation */}
      <nav className="px-4 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="ml-3 font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
        <Link
          to="/settings"
          className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
        >
          <Settings className="h-5 w-5" />
          <span className="ml-3">Settings</span>
        </Link>
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg mt-2"
        >
          <LogOut className="h-5 w-5" />
          <span className="ml-3">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
