import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { Plus, Search, Wrench, Calendar, Check, AlertOctagon, X } from 'lucide-react';
import confetti from 'canvas-confetti';

const Maintenance = () => {
  const { user } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: '',
    description: '',
    cost: '',
    startDate: '',
  });
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [logsRes, vehiclesRes] = await Promise.all([
        api.get('/api/maintenance'),
        api.get('/api/vehicles')
      ]);

      if (logsRes.data.success) setLogs(logsRes.data.data);
      if (vehiclesRes.data.success) setVehicles(vehiclesRes.data.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenAdd = () => {
    setFormData({
      vehicleId: '',
      description: '',
      cost: '',
      startDate: new Date().toISOString().split('T')[0],
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.vehicleId || !formData.description || !formData.cost || !formData.startDate) {
      return setFormError('All fields are mandatory');
    }

    try {
      const res = await api.post('/api/maintenance', formData);
      if (res.data.success) {
        fetchData();
        setShowModal(false);
        confetti({ particleCount: 50, spread: 30, colors: ['#F59E0B'] });
      }
    } catch (error) {
      setFormError(error.response?.data?.message || 'Error saving maintenance record');
    }
  };

  const handleCloseMaintenance = async (id) => {
    if (window.confirm('Are you sure you want to declare this maintenance completed? This will restore the vehicle status back to Available.')) {
      try {
        const res = await api.put(`/api/maintenance/${id}`, { status: 'Completed' });
        if (res.data.success) {
          fetchData();
          confetti({ particleCount: 80, spread: 50, colors: ['#10B981'] });
        }
      } catch (error) {
        alert(error.response?.data?.message || 'Error closing maintenance');
      }
    }
  };

  // Filter available vehicles (Exclude Retired)
  const availableVehiclesForMaint = vehicles.filter(v => v.status !== 'Retired');

  const filteredLogs = logs.filter(log => {
    return log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
           log.vehicle?.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
           log.vehicle?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-450 border-amber-500/20'; // Yellow (In Shop)
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-semibold'; // Green (Closed)
      default:
        return 'bg-slate-500/10 text-slate-500';
    }
  };

  return (
    <div className="p-8 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
      
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search maintenance logs..."
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-orange-500 w-64 shadow-sm"
          />
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4.5 py-1.75 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg shadow-md shadow-orange-600/10 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Log Maintenance
        </button>
      </div>

      {/* Roster Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-4.5">Vehicle Details</th>
                <th className="px-6 py-4.5">Service Details</th>
                <th className="px-6 py-4.5">Service Cost</th>
                <th className="px-6 py-4.5">Start Date</th>
                <th className="px-6 py-4.5">End Date</th>
                <th className="px-6 py-4.5">Status</th>
                <th className="px-6 py-4.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Loading service records...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No maintenance logs registered.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log._id || log.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-all">
                    <td className="px-6 py-4.5">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100">{log.vehicle?.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">Plate: {log.vehicle?.registrationNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 max-w-xs truncate" title={log.description}>
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">{log.description}</span>
                    </td>
                    <td className="px-6 py-4.5 font-bold text-slate-800 dark:text-slate-200">
                      ${log.cost.toLocaleString()}
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(log.startDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      {log.endDate ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(log.endDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${getStatusBadge(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="flex justify-center">
                        {log.status === 'Active' ? (
                          <button
                            onClick={() => handleCloseMaintenance(log._id || log.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold shadow shadow-emerald-600/10 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" /> Close Shop
                          </button>
                        ) : (
                          <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 border border-slate-200/50 dark:border-slate-700/50 rounded-full font-medium text-slate-500">Service Completed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Maintenance Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Schedule Vehicle Maintenance</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-2.5 rounded-lg text-xs font-semibold">
                  <AlertOctagon className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Select Vehicle</label>
                <select
                  name="vehicleId"
                  value={formData.vehicleId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-350 focus:outline-none"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {availableVehiclesForMaint.map(v => (
                    <option key={v._id || v.id} value={v._id || v.id}>{v.name} ({v.registrationNumber}) - {v.status}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-450 mt-1">Note: This will set the vehicle's status to 'In Shop' immediately.</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Service Cost ($)</label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  placeholder="e.g. 850"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-350 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Work Order Details</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe repair requirements (e.g. clutch plates replaced, oil filter changed, radiator flushed)"
                  rows="3"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold shadow-md shadow-orange-600/10 cursor-pointer"
                >
                  Confirm Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;
