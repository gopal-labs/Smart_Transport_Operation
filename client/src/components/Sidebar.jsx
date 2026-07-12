import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Navigation, 
  Wrench, 
  Receipt, 
  BarChart3, 
  LogOut,
  ShieldCheck,
  AlertOctagon
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  // Define navigation items and which roles can see them
  const navItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      roles: ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst']
    },
    {
      name: 'Vehicles',
      path: '/vehicles',
      icon: Truck,
      roles: ['Fleet Manager', 'Safety Officer']
    },
    {
      name: 'Drivers',
      path: '/drivers',
      icon: Users,
      roles: ['Fleet Manager', 'Safety Officer']
    },
    {
      name: 'Trips',
      path: '/trips',
      icon: Navigation,
      roles: ['Fleet Manager', 'Driver']
    },
    {
      name: 'Maintenance',
      path: '/maintenance',
      icon: Wrench,
      roles: ['Fleet Manager']
    },
    {
      name: 'Financial Desk',
      path: '/expenses',
      icon: Receipt,
      roles: ['Fleet Manager', 'Financial Analyst']
    },
    {
      name: 'Reports & ESG',
      path: '/reports',
      icon: BarChart3,
      roles: ['Fleet Manager', 'Financial Analyst']
    }
  ];

  // Filter navigation items to show only what this user's role is allowed to see.
  // We definitely don't want drivers poking around the financial desk page!
  const filteredItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    // Check it out: this aside dynamically flips background and text colors depending on dark mode.
    // Also, that transition-all class keeps the theme switch looking super clean.
    <aside className="w-64 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col justify-between border-r border-slate-100 dark:border-slate-800 h-screen sticky top-0 no-print transition-all">
      <div className="flex flex-col">
        {/* Brand header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="bg-orange-600 p-2 rounded-lg text-white">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-wider text-slate-900 dark:text-white">TransitOps</h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-550 font-semibold uppercase tracking-wider">Control Panel</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User footer & logout */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-orange-600 dark:text-orange-400 border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-sm">{user.name.split(' ').map(n=>n[0]).join('')}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate text-slate-800 dark:text-slate-100">{user.name}</p>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide truncate">{user.role}</p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 transition-all cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
