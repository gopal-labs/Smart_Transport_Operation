import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Receipt,
  Fuel,
  TrendingDown,
  X,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

const Expenses = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('fuel');
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [fuelForm, setFuelForm] = useState({ vehicleId: '', odometer: '', liters: '', cost: '', date: '' });
  const [expenseForm, setExpenseForm] = useState({ vehicleId: '', category: 'Tolls', amount: '', description: '', date: '' });
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fuelRes, expRes, vehiclesRes] = await Promise.all([
        api.get('/api/expenses/fuel'),
        api.get('/api/expenses'),
        api.get('/api/vehicles')
      ]);

      if (fuelRes.data.success) setFuelLogs(fuelRes.data.data);
      if (expRes.data.success) setExpenses(expRes.data.data);
      if (vehiclesRes.data.success) setVehicles(vehiclesRes.data.data);

      // Fetch anomalies if user is manager or analyst
      if (['Fleet Manager', 'Financial Analyst'].includes(user.role)) {
        const anomaliesRes = await api.get('/api/expenses/anomalies');
        if (anomaliesRes.data.success) setAnomalies(anomaliesRes.data.data);
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!fuelForm.vehicleId || !fuelForm.odometer || !fuelForm.liters || !fuelForm.cost) {
      return setFormError('All fields are mandatory');
    }

    try {
      const res = await api.post('/api/expenses/fuel', fuelForm);
      if (res.data.success) {
        fetchData();
        setShowFuelModal(false);
        if (res.data.data.isAnomaly) {
          alert('⚠️ Alert: Anomaly detected! This entry has been flagged in the review queue.');
        } else {
          confetti({ particleCount: 50, spread: 30, colors: ['#F97316'] });
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving fuel record');
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!expenseForm.vehicleId || !expenseForm.amount || !expenseForm.description) {
      return setFormError('Please fill in all mandatory details');
    }

    try {
      const res = await api.post('/api/expenses', expenseForm);
      if (res.data.success) {
        fetchData();
        setShowExpenseModal(false);
        if (res.data.data.isAnomaly) {
          alert('⚠️ Alert: Anomaly detected! This entry has been flagged in the review queue.');
        } else {
          confetti({ particleCount: 50, spread: 30, colors: ['#10B981'] });
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving expense record');
    }
  };

  const handleResolveAnomaly = async (type, id, action) => {
    try {
      const res = await api.put(`/api/expenses/anomalies/${type}/${id}`, { action });
      if (res.data.success) {
        fetchData();
        confetti({ particleCount: 60, spread: 40 });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error resolving anomaly');
    }
  };

  // Summaries
  const totalOpCost = expenses.reduce((a,c)=>a+c.amount, 0) + fuelLogs.reduce((a,c)=>a+c.cost, 0);

  // Filters
  const filteredFuel = fuelLogs.filter(log => {
    return log.vehicle?.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
           log.vehicle?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredExpenses = expenses.filter(exp => {
    return exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
           exp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
           exp.vehicle?.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-8 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
      
      {/* Financial Overview Widget */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Running Fleet Operations Cost</span>
          <h3 className="text-3xl font-extrabold text-slate-850 dark:text-slate-100 mt-1">${totalOpCost.toLocaleString()}</h3>
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Aggregated across active fuel refills and logged operational expenses</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setFuelForm({ vehicleId: '', odometer: '', liters: '', cost: '', date: new Date().toISOString().split('T')[0] });
              setFormError('');
              setShowFuelModal(true);
            }}
            className="flex items-center gap-1.5 px-4.5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg shadow-md cursor-pointer"
          >
            <Fuel className="h-4 w-4" /> Log Fuel
          </button>
          <button
            onClick={() => {
              setExpenseForm({ vehicleId: '', category: 'Tolls', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
              setFormError('');
              setShowExpenseModal(true);
            }}
            className="flex items-center gap-1.5 px-4.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-md cursor-pointer"
          >
            <Receipt className="h-4 w-4" /> Log Expense
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('fuel')}
            className={`pb-3 border-b-2 px-1 cursor-pointer ${
              activeTab === 'fuel' 
                ? 'border-orange-600 text-orange-600 dark:text-orange-400' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Refuel Entries
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`pb-3 border-b-2 px-1 cursor-pointer ${
              activeTab === 'expenses' 
                ? 'border-orange-600 text-orange-600 dark:text-orange-400' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            General Expenses
          </button>
          {['Fleet Manager', 'Financial Analyst'].includes(user.role) && (
            <button
              onClick={() => setActiveTab('anomalies')}
              className={`pb-3 border-b-2 px-1 relative cursor-pointer ${
                activeTab === 'anomalies' 
                  ? 'border-orange-600 text-orange-600 dark:text-orange-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Anomaly review queue
              {anomalies.length > 0 && (
                <span className="absolute -top-1.5 -right-3 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold animate-pulse">
                  {anomalies.length}
                </span>
              )}
            </button>
          )}
        </div>

        {activeTab !== 'anomalies' && (
          <div className="flex items-center gap-1.5 pb-2.5">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter list logs..."
              className="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Lists */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        {activeTab === 'fuel' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Refuel Odometer</th>
                  <th className="px-6 py-4">Volume (Liters)</th>
                  <th className="px-6 py-4">Total Cost</th>
                  <th className="px-6 py-4">Refuel Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300">
                {filteredFuel.map((log) => (
                  <tr key={log._id || log.id}>
                    <td className="px-6 py-4 font-bold text-slate-850 dark:text-slate-100">{log.vehicle?.name}</td>
                    <td className="px-6 py-4">{log.odometer.toLocaleString()} mi</td>
                    <td className="px-6 py-4">{log.liters.toLocaleString()} L</td>
                    <td className="px-6 py-4 font-extrabold text-slate-800 dark:text-slate-200">${log.cost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{new Date(log.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {log.isAnomaly ? (
                        <span className="text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/15 px-2 py-0.5 rounded-full animate-pulse">Flagged Anomaly</span>
                      ) : (
                        <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full">Verified</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300">
                {filteredExpenses.map((exp) => (
                  <tr key={exp._id || exp.id}>
                    <td className="px-6 py-4 font-bold text-slate-850 dark:text-slate-100">{exp.vehicle?.name}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded text-xs font-bold border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-400">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-350">{exp.description}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-800 dark:text-slate-200">${exp.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{new Date(exp.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {exp.isAnomaly ? (
                        <span className="text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/15 px-2 py-0.5 rounded-full animate-pulse">Flagged Anomaly</span>
                      ) : (
                        <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full">Verified</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'anomalies' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="px-6 py-4">Anomaly Details</th>
                  <th className="px-6 py-4">Flagged Reason</th>
                  <th className="px-6 py-4">Transaction Sum</th>
                  <th className="px-6 py-4">Ref Date</th>
                  <th className="px-6 py-4 text-center">Rulings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300">
                {anomalies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-450">
                      All clear! No pending ledger anomalies found in the review queue.
                    </td>
                  </tr>
                ) : (
                  anomalies.map((item) => (
                    <tr key={item._id || item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-bold text-slate-850 dark:text-slate-100">{item.vehicle?.name}</div>
                          <span className="text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded">
                            {item.type} Anomaly
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        <div className="flex items-start gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold">
                          <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                          <span>{item.anomalyReason}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-rose-600 dark:text-rose-400">
                        ${(item.cost || item.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleResolveAnomaly(item.type, item._id || item.id, 'approve')}
                            className="flex items-center gap-0.5 px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer"
                          >
                            <Check className="h-3 w-3" /> Verify
                          </button>
                          <button
                            onClick={() => handleResolveAnomaly(item.type, item._id || item.id, 'dismiss')}
                            className="flex items-center gap-0.5 px-2.5 py-1 text-[11px] font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-350 hover:text-slate-900 text-slate-600 dark:text-slate-300 rounded cursor-pointer"
                          >
                            <X className="h-3 w-3" /> Dismiss
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Fuel Modal */}
      {showFuelModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-850 dark:text-slate-100 text-base">Record Fuel Purchase</h3>
              <button onClick={() => setShowFuelModal(false)} className="text-slate-400 hover:text-slate-655 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleFuelSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Select Refueled Vehicle</label>
                <select
                  value={fuelForm.vehicleId}
                  onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-350 focus:outline-none"
                >
                  <option value="">-- Choose Truck --</option>
                  {vehicles.map(v => (
                    <option key={v._id || v.id} value={v._id || v.id}>{v.name} ({v.registrationNumber})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Refuel Odometer (mi)</label>
                  <input
                    type="number"
                    value={fuelForm.odometer}
                    onChange={(e) => setFuelForm({ ...fuelForm, odometer: e.target.value })}
                    placeholder="e.g. 145000"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Fuel Quantity (Liters)</label>
                  <input
                    type="number"
                    value={fuelForm.liters}
                    onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })}
                    placeholder="e.g. 105"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Refuel Total Cost ($)</label>
                  <input
                    type="number"
                    value={fuelForm.cost}
                    onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })}
                    placeholder="e.g. 110"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Transaction Date</label>
                  <input
                    type="date"
                    value={fuelForm.date}
                    onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-350 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFuelModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold shadow-md shadow-orange-600/10 cursor-pointer"
                >
                  Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-850 dark:text-slate-100 text-base">Record Operational Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-655 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Select Target Vehicle</label>
                <select
                  value={expenseForm.vehicleId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vehicleId: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-350 focus:outline-none"
                >
                  <option value="">-- Choose Truck --</option>
                  {vehicles.map(v => (
                    <option key={v._id || v.id} value={v._id || v.id}>{v.name} ({v.registrationNumber})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Expense Category</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-350 focus:outline-none"
                  >
                    <option value="Tolls">Tolls</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Permits">Permits</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Expense Amount ($)</label>
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    placeholder="e.g. 45"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Transaction Date</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-350 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Description</label>
                <textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="e.g. Toll tag payment or State border permit fees"
                  rows="2"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold shadow-md shadow-orange-600/10 cursor-pointer"
                >
                  Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
