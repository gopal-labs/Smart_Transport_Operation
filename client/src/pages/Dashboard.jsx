import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { 
  Truck, 
  Navigation, 
  Users, 
  Wrench, 
  TrendingUp, 
  CircleDollarSign,
  Leaf,
  Filter
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    vehicleType: '',
    status: '',
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Query parameters
      let queryStr = '?';
      if (filters.vehicleType) queryStr += `vehicleType=${filters.vehicleType}&`;
      if (filters.status) queryStr += `status=${filters.status}&`;

      const res = await api.get(`/api/reports/dashboard${queryStr}`);
      if (res.data.success) {
        setData(res.data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  if (loading || !data) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-orange-600"></div>
      </div>
    );
  }

  const { kpis, expenseBreakdown } = data;

  // Colors based on status color coding:
  // green (available/completed) = #10B981
  // yellow (pending/in shop) = #F59E0B
  // red (suspended/cancelled) = #EF4444
  // orange (on trip/dispatched) = #F97316
  const COLORS = ['#F97316', '#F59E0B', '#64748B'];

  const stats = [
    {
      title: 'Active Trips',
      value: kpis.activeTrips,
      icon: Navigation,
      color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30',
      description: 'Dispatched and on route'
    },
    {
      title: 'Available Vehicles',
      value: kpis.availableVehicles,
      icon: Truck,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30',
      description: 'Ready for dispatch'
    },
    {
      title: 'In Maintenance',
      value: kpis.maintenanceVehicles,
      icon: Wrench,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30',
      description: 'In the shop'
    },
    {
      title: 'Drivers on Duty',
      value: kpis.activeDrivers + kpis.availableDrivers,
      icon: Users,
      color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30',
      description: 'Active & available'
    }
  ];

  return (
    <div className="p-8 space-y-8 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)] transition-colors duration-200">
      
      {/* Filter panel */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-orange-500" />
          <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">Filters</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filters.vehicleType}
            onChange={(e) => setFilters({ ...filters, vehicleType: e.target.value })}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:border-orange-500"
          >
            <option value="">All Vehicle Types</option>
            <option value="Semi">Semi</option>
            <option value="Truck">Truck</option>
            <option value="Van">Van</option>
            <option value="Box Truck">Box Truck</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:border-orange-500"
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="In Shop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>

          <button
            onClick={() => setFilters({ vehicleType: '', status: '' })}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.title}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{stat.title}</p>
                <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{stat.value}</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{stat.description}</p>
              </div>
              <div className={`p-4 rounded-xl border ${stat.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Primary Charts & Utilization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Utilization Gauge */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1">Fleet Utilization</h4>
            <p className="text-xs text-slate-400">Proportion of operational vehicles currently on trip</p>
          </div>

          <div className="py-6 flex flex-col items-center justify-center relative">
            {/* Simple CSS Circular Progress */}
            <div className="relative h-36 w-36 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="absolute inset-2 rounded-full bg-white dark:bg-slate-900 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{kpis.fleetUtilization}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Utilized</span>
              </div>
              {/* Spinning gradient border */}
              <div 
                className="absolute inset-0 rounded-full border-4 border-orange-600 border-r-transparent border-b-transparent animate-pulse"
                style={{ transform: `rotate(${kpis.fleetUtilization * 3.6}deg)` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4 text-center">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Active Pool</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{kpis.activeVehicles}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5 font-medium">Ready Pool</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{kpis.availableVehicles}</p>
            </div>
          </div>
        </div>

        {/* Expenses Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1">Operational Costs</h4>
            <p className="text-xs text-slate-400">Total: ${kpis.totalOperationalCost.toLocaleString()}</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Cost']}
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legends */}
          <div className="flex justify-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {expenseBreakdown.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial ROI and ESG Carbon Track */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1">Financial Return & ESG</h4>
            <p className="text-xs text-slate-400">Estimated profitability and sustainability index</p>
          </div>

          <div className="space-y-5 my-auto">
            {/* Revenue / ROI Card */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-500">
                  <CircleDollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Revenue</p>
                  <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">${kpis.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Profit</p>
                <p className="text-sm font-bold text-emerald-500">+${(kpis.totalRevenue - kpis.totalOperationalCost).toLocaleString()}</p>
              </div>
            </div>

            {/* CO2 ESG Tracker */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/10 rounded-lg text-orange-500">
                  <Leaf className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total CO2 Footprint</p>
                  <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{kpis.totalCO2Emissions.toLocaleString()} kg</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Green Index</p>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Class B Efficiency</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] justify-center mt-2 font-medium">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span>ROI calculated across completed trips distance</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
