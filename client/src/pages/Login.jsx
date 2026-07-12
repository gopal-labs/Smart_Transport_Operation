import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Truck, Mail, Lock, ShieldAlert } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Force light mode for the login page
    document.documentElement.classList.remove('dark');

    // If already logged in, redirect to dashboard
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please fill in all fields');
    }
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Invalid email or password');
    }
  };

  // Demo accounts helper
  const handleQuickLogin = async (demoEmail) => {
    setError('');
    setLoading(true);
    setEmail(demoEmail);
    setPassword('password123');

    const result = await login(demoEmail, 'password123');
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Demo login failed');
    }
  };

  const demoAccounts = [
    { role: 'Fleet Manager', email: 'manager@transitops.com', bg: 'hover:bg-orange-500/10 hover:border-orange-500/30' },
    { role: 'Driver', email: 'driver@transitops.com', bg: 'hover:bg-amber-500/10 hover:border-amber-500/30' },
    { role: 'Safety Officer', email: 'safety@transitops.com', bg: 'hover:bg-orange-500/10 hover:border-orange-500/30' },
    { role: 'Financial Analyst', email: 'finance@transitops.com', bg: 'hover:bg-emerald-500/10 hover:border-emerald-500/30' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-white border border-slate-100 p-8 rounded-2xl shadow-xl z-10 shadow-slate-200/50">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-orange-600 p-3 rounded-2xl text-white shadow-lg shadow-orange-600/20 mb-3">
            <Truck className="h-8 w-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-wide">TransitOps</h2>
          <p className="text-slate-500 text-sm mt-1">Smart Transport Operations Platform</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-600 px-4 py-3 rounded-lg text-sm mb-6">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-600/15 hover:shadow-orange-600/30 transition-all text-sm cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Demo shortcuts */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Quick Sign-in (Demo)</p>
          <div className="grid grid-cols-2 gap-3">
            {demoAccounts.map((account) => (
              <button
                key={account.role}
                onClick={() => handleQuickLogin(account.email)}
                disabled={loading}
                className={`px-3 py-2.5 rounded-lg border border-slate-200 text-left text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 hover:border-orange-500/30 transition-all cursor-pointer`}
              >
                <div className="font-bold text-slate-700 truncate">{account.role}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">{account.email}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
