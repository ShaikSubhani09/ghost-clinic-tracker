import { Outlet, Link, useLocation } from 'react-router-dom';
import { Activity, Map, BarChart3, Edit3, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export default function Layout() {
  const location = useLocation();
  const { currentUser } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Activity },
    { name: 'Report Clinic', path: '/report', icon: Edit3 },
    { name: 'Map View', path: '/map', icon: Map },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="bg-white sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="flex items-center gap-2">
                  <Activity className="h-6 w-6 text-primary" />
                  <span className="font-bold text-xl text-gray-900 tracking-tight">Ghost Clinic Tracker</span>
                </Link>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive 
                          ? 'border-primary text-gray-900' 
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center">
               <div className="hidden sm:flex text-sm text-gray-500 mr-6 italic">
                  "Community-powered healthcare transparency"
               </div>
               {currentUser ? (
                  <button 
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
               </button>
               ) : (
                <Link 
                    to="/login"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                </Link>
               )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
