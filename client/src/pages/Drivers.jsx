import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  ShieldAlert, 
  Mail, 
  Trophy, 
  DollarSign, 
  CheckCircle,
  X 
} from 'lucide-react';
import confetti from 'canvas-confetti';

const Drivers = () => {
  const { user } = useContext(AuthContext);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('safetyScore');

  // Form modal state
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    licenseCategory: '',
    licenseExpiryDate: '',
    contactNumber: '',
    safetyScore: 100,
    status: 'Available',
  });
  const [formError, setFormError] = useState('');
  const [emailAlertMsg, setEmailAlertMsg] = useState('');

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/drivers');
      if (res.data.success) {
        setDrivers(res.data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setFormData({
      name: '',
      licenseNumber: '',
      licenseCategory: '',
      licenseExpiryDate: '',
      contactNumber: '',
      safetyScore: 100,
      status: 'Available',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (driver) => {
    setEditingDriver(driver);
    
    // Format expiry date to yyyy-MM-dd
    const dateObj = new Date(driver.licenseExpiryDate);
    const formattedDate = dateObj.toISOString().split('T')[0];

    setFormData({
      name: driver.name,
      licenseNumber: driver.licenseNumber,
      licenseCategory: driver.licenseCategory,
      licenseExpiryDate: formattedDate,
      contactNumber: driver.contactNumber,
      safetyScore: driver.safetyScore,
      status: driver.status,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.licenseNumber || !formData.licenseCategory || !formData.licenseExpiryDate || !formData.contactNumber) {
      return setFormError('All fields are mandatory');
    }

    try {
      if (editingDriver) {
        const res = await api.put(`/api/drivers/${editingDriver._id || editingDriver.id}`, formData);
        if (res.data.success) {
          fetchDrivers();
          setShowModal(false);
        }
      } else {
        const res = await api.post('/api/drivers', formData);
        if (res.data.success) {
          fetchDrivers();
          setShowModal(false);
        }
      }
    } catch (error) {
      setFormError(error.response?.data?.message || 'Error saving driver details');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this driver from duty rosters?')) {
      try {
        const res = await api.delete(`/api/drivers/${id}`);
        if (res.data.success) {
          fetchDrivers();
        }
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting driver');
      }
    }
  };

  // Simulate sending Email reminder
  const sendEmailReminder = (driverName, emailAddress) => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });
    setEmailAlertMsg(`Compliance reminder email dispatched successfully to ${driverName} (${emailAddress || 'driver@company.com'})`);
    setTimeout(() => setEmailAlertMsg(''), 5000);
  };

  // Filter and Sort Drivers
  const filteredDrivers = drivers
    .filter((d) => {
      const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter ? d.status === statusFilter : true;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'completedTrips') return b.completedTripsCount - a.completedTripsCount;
      if (sortBy === 'bonus') return b.simulatedBonus - a.simulatedBonus;
      // Default: safetyScore descending
      return b.safetyScore - a.safetyScore;
    });

  // Get color for driver rank medal
  const getRankBadge = (index) => {
    if (index === 0) return 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30'; // Gold
    if (index === 1) return 'text-slate-400 bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50'; // Silver
    if (index === 2) return 'text-amber-700 bg-amber-50/50 dark:bg-amber-950/10 border-amber-600/20 dark:border-amber-900/20'; // Bronze
    return 'text-slate-500 border-transparent';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'On Trip':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      case 'Off Duty':
        return 'bg-slate-500/10 text-slate-500 dark:text-slate-450 border-slate-500/20';
      case 'Suspended':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-450 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getTierBadge = (tier) => {
    switch (tier) {
      case 'Platinum':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-250';
      case 'Gold':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200';
      case 'Silver':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-400 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200/50';
    }
  };

  const canEdit = user.role === 'Fleet Manager' || user.role === 'Safety Officer';

  return (
    <div className="p-8 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
      
      {/* Toast Reminder Alert */}
      {emailAlertMsg && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-3.5 rounded-xl text-xs font-bold shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{emailAlertMsg}</span>
        </div>
      )}

      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search driver name or DL..."
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-orange-500 w-64 shadow-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="Off Duty">Off Duty</option>
            <option value="Suspended">Suspended</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="safetyScore">Leaderboard (Safety Score)</option>
            <option value="completedTrips">Sort by Trips Completed</option>
            <option value="bonus">Sort by Bonus</option>
          </select>

          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4.5 py-1.75 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg shadow-md shadow-orange-600/10 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Driver
            </button>
          )}
        </div>
      </div>

      {/* Roster & Leaderboard */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-4.5 text-center">Rank</th>
                <th className="px-6 py-4.5">Driver Info</th>
                <th className="px-6 py-4.5">License & Compliance</th>
                <th className="px-6 py-4.5 text-center">Safety Score</th>
                <th className="px-6 py-4.5 text-center">Trips Done</th>
                <th className="px-6 py-4.5">Simulated Bonus</th>
                <th className="px-6 py-4.5">Incentive Tier</th>
                <th className="px-6 py-4.5">Status</th>
                {canEdit && <th className="px-6 py-4.5 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} className="px-6 py-12 text-center text-slate-400">
                    Loading driver data...
                  </td>
                </tr>
              ) : filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} className="px-6 py-12 text-center text-slate-400">
                    No drivers found.
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((driver, index) => {
                  const expiryDateObj = new Date(driver.licenseExpiryDate);
                  const isExpired = expiryDateObj < new Date();
                  const formattedExpiry = expiryDateObj.toLocaleDateString(undefined, { 
                    year: 'numeric', month: 'short', day: 'numeric' 
                  });

                  return (
                    <tr key={driver._id || driver.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-all">
                      <td className="px-6 py-4.5 text-center">
                        {sortBy === 'safetyScore' && index < 3 ? (
                          <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full border text-xs font-bold ${getRankBadge(index)}`}>
                            {index + 1}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">#{index + 1}</span>
                        )}
                      </td>
                      <td className="px-6 py-4.5">
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            {driver.name}
                            {sortBy === 'safetyScore' && index === 0 && <Trophy className="h-4 w-4 text-amber-500 fill-amber-500/20" />}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">{driver.contactNumber}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="space-y-1">
                          <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Category: </span>
                            <span className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 font-bold">{driver.licenseCategory}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-slate-400">Expires: {formattedExpiry}</span>
                            {isExpired ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase bg-rose-500/10 border border-rose-500/20 text-rose-500 px-1.5 py-0.5 rounded-full">
                                <ShieldAlert className="h-2.5 w-2.5" /> Expired
                              </span>
                            ) : null}
                            
                            {/* License reminder action */}
                            {(isExpired || (expiryDateObj - new Date()) / (1000 * 60 * 60 * 24) < 30) && (
                              <button
                                onClick={() => sendEmailReminder(driver.name, driver.user?.email || `${driver.name.toLowerCase().replace(' ', '')}@transitops.com`)}
                                className="p-1 rounded bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 transition-colors border border-orange-500/15 cursor-pointer"
                                title="Send Renewal Email Notice"
                              >
                                <Mail className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`text-sm font-extrabold px-2.5 py-0.5 rounded border ${
                            driver.safetyScore >= 90 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                              : driver.safetyScore >= 70 
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-450 border-rose-500/20 font-black'
                          }`}>
                            {driver.safetyScore}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-center font-bold text-slate-700 dark:text-slate-350">
                        {driver.completedTripsCount}
                      </td>
                      <td className="px-6 py-4.5 font-bold text-slate-800 dark:text-slate-100">
                        <div className="flex items-center gap-0.5 text-emerald-500">
                          <DollarSign className="h-4 w-4 shrink-0" />
                          <span>{driver.simulatedBonus?.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${getTierBadge(driver.incentiveTier)}`}>
                          {driver.incentiveTier}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${getStatusBadge(driver.status)}`}>
                          {driver.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-6 py-4.5">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(driver)}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
                              title="Edit Driver profile"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(driver._id || driver.id)}
                              className="p-1.5 rounded-md hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
                              title="Delete Driver profile"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Driver Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                {editingDriver ? 'Edit Driver Profile' : 'Enroll New Driver'}
              </h3>
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
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Driver Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Contact Number</label>
                  <input
                    type="text"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. +1-555-0199"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">License Number</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. DL-TX8872"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">License Category</label>
                  <input
                    type="text"
                    name="licenseCategory"
                    value={formData.licenseCategory}
                    onChange={handleInputChange}
                    placeholder="e.g. CDL-A"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">License Expiry Date</label>
                  <input
                    type="date"
                    name="licenseExpiryDate"
                    value={formData.licenseExpiryDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-350 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Compliance Safety Score</label>
                  <input
                    type="number"
                    name="safetyScore"
                    value={formData.safetyScore}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    placeholder="e.g. 100"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Roster Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-350 focus:outline-none"
                >
                  <option value="Available">Available</option>
                  <option value="On Trip">On Trip</option>
                  <option value="Off Duty">Off Duty</option>
                  <option value="Suspended">Suspended</option>
                </select>
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
                  Save Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drivers;
