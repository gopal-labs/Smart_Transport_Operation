import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Sun, Moon, Shield, Bell, HelpCircle } from 'lucide-react';

const Header = ({ title }) => {
  const { user } = useContext(AuthContext);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  if (!user) return null;

  // Get color for role badge
  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'Fleet Manager':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-800/40';
      case 'Safety Officer':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-800/40';
      case 'Financial Analyst':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40';
      case 'Driver':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/40';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-400 border-slate-200';
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 h-16 flex items-center justify-between px-8 sticky top-0 z-40 no-print transition-all">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title || 'Dashboard'}</h2>
      </div>

      {/* Quick Controls */}
      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-orange-400 dark:hover:bg-slate-800 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          aria-label="Toggle Dark Mode"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Info / Support Button */}
        <div className="hidden md:flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700/60">
          <Shield className="h-4 w-4 text-orange-500" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Security Clearance:</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(user.role)}`}>
            {user.role}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
