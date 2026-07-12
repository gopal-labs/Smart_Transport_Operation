import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { Plus, Search, Pencil, Trash2, ShieldAlert, Sparkles, X } from 'lucide-react';

const Vehicles = () => {
  const { user } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  
  // Form modal state
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    registrationNumber: '',
    name: '',
    type: 'Truck',
    maxLoadCapacity: '',
    odometer: '',
    acquisitionCost: '',
    status: 'Available',
  });
  const [formError, setFormError] = useState('');

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/vehicles');
      if (res.data.success) {
        setVehicles(res.data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setFormData({
      registrationNumber: '',
      name: '',
      type: 'Truck',
      maxLoadCapacity: '',
      odometer: '',
      acquisitionCost: '',
      status: 'Available',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      registrationNumber: vehicle.registrationNumber,
      name: vehicle.name,
      type: vehicle.type,
      maxLoadCapacity: vehicle.maxLoadCapacity,
      odometer: vehicle.odometer,
      acquisitionCost: vehicle.acquisitionCost || '',
      status: vehicle.status,
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

    // Validations
    if (!formData.registrationNumber || !formData.name || !formData.maxLoadCapacity || !formData.odometer) {
      return setFormError('Please fill in all mandatory fields');
    }

    if (user.role === 'Fleet Manager' && !formData.acquisitionCost) {
      return setFormError('Acquisition cost is required for managers');
    }

    try {
      if (editingVehicle) {
        const res = await api.put(`/api/vehicles/${editingVehicle._id || editingVehicle.id}`, formData);
        if (res.data.success) {
          fetchVehicles();
          setShowModal(false);
        }
      } else {
        const res = await api.post('/api/vehicles', formData);
        if (res.data.success) {
          fetchVehicles();
          setShowModal(false);
        }
      }
    } catch (error) {
      setFormError(error.response?.data?.message || 'Error saving vehicle details');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle from the registry?')) {
      try {
        const res = await api.delete(`/api/vehicles/${id}`);
        if (res.data.success) {
          fetchVehicles();
        }
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting vehicle');
      }
    }
  };

  // Filter and Sort Vehicles
  const filteredVehicles = vehicles
    .filter((v) => {
      const matchSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter ? v.type === typeFilter : true;
      const matchStatus = statusFilter ? v.status === statusFilter : true;
      return matchSearch && matchType && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'odometer') return b.odometer - a.odometer;
      if (sortBy === 'risk') return b.maintenanceRiskScore - a.maintenanceRiskScore;
      return a.name.localeCompare(b.name);
    });

  // Status Badge Colors (Consistent Status Color Coding)
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'; // Green
      case 'On Trip':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'; // Violet
      case 'In Shop':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'; // Yellow
      case 'Retired':
        return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20'; // Gray/Red equivalent
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  // Risk Score Badge Helper
  const getRiskBadge = (score) => {
    if (score >= 75) {
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold';
    }
    if (score >= 40) {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  };

  const isFleetManager = user.role === 'Fleet Manager';

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
            placeholder="Search make or plate..."
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-orange-500 w-64 shadow-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="Semi">Semi</option>
            <option value="Truck">Truck</option>
            <option value="Van">Van</option>
            <option value="Box Truck">Box Truck</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="In Shop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="name">Sort by Name</option>
            <option value="odometer">Sort by Mileage</option>
            <option value="risk">Sort by Risk Score</option>
          </select>

          {isFleetManager && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4.5 py-1.75 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg shadow-md shadow-orange-600/10 cursor-pointer transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Vehicle
            </button>
          )}
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-4.5">Registration Number</th>
                <th className="px-6 py-4.5">Vehicle Details</th>
                <th className="px-6 py-4.5">Type</th>
                <th className="px-6 py-4.5">Odometer (mi)</th>
                <th className="px-6 py-4.5">Maint. Risk Score</th>
                {isFleetManager && <th className="px-6 py-4.5">Acquisition Cost</th>}
                <th className="px-6 py-4.5">Status</th>
                {isFleetManager && <th className="px-6 py-4.5 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={isFleetManager ? 8 : 6} className="px-6 py-12 text-center text-slate-400">
                    Loading vehicle records...
                  </td>
                </tr>
              ) : filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={isFleetManager ? 8 : 6} className="px-6 py-12 text-center text-slate-400">
                    No vehicles found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle._id || vehicle.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-all">
                    <td className="px-6 py-4.5">
                      <span className="font-extrabold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200/50 dark:border-slate-700/50 tracking-wider">
                        {vehicle.registrationNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4.5">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100">{vehicle.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">Cap: {vehicle.maxLoadCapacity.toLocaleString()} kg</div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/30 dark:border-slate-700/30 text-slate-500 dark:text-slate-400">
                        {vehicle.type}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 font-semibold text-slate-700 dark:text-slate-300">
                      {vehicle.odometer.toLocaleString()}
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border ${getRiskBadge(vehicle.maintenanceRiskScore)}`}>
                        <Sparkles className="h-3 w-3" />
                        {vehicle.maintenanceRiskScore}%
                      </span>
                    </td>
                    {isFleetManager && (
                      <td className="px-6 py-4.5 font-bold text-slate-800 dark:text-slate-200">
                        ${vehicle.acquisitionCost?.toLocaleString()}
                      </td>
                    )}
                    <td className="px-6 py-4.5">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${getStatusBadge(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                    </td>
                    {isFleetManager && (
                      <td className="px-6 py-4.5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(vehicle)}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
                            title="Edit Vehicle"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(vehicle._id || vehicle.id)}
                            className="p-1.5 rounded-md hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Delete Vehicle"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                {editingVehicle ? 'Edit Vehicle Profile' : 'Register New Vehicle'}
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
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Registration Plate</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. TX-99A-1234"
                    disabled={!!editingVehicle}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Vehicle Make / Model</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Volvo VNL Semi"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Vehicle Class Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="Semi">Semi</option>
                    <option value="Truck">Truck</option>
                    <option value="Van">Van</option>
                    <option value="Box Truck">Box Truck</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Max Load Capacity (kg)</label>
                  <input
                    type="number"
                    name="maxLoadCapacity"
                    value={formData.maxLoadCapacity}
                    onChange={handleInputChange}
                    placeholder="e.g. 24000"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Odometer Reading (mi)</label>
                  <input
                    type="number"
                    name="odometer"
                    value={formData.odometer}
                    onChange={handleInputChange}
                    placeholder="e.g. 120500"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Acquisition Cost ($)</label>
                  <input
                    type="number"
                    name="acquisitionCost"
                    value={formData.acquisitionCost}
                    onChange={handleInputChange}
                    placeholder="e.g. 115000"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Initial Duty Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-300 focus:outline-none"
                >
                  <option value="Available">Available</option>
                  <option value="On Trip">On Trip</option>
                  <option value="In Shop">In Shop</option>
                  <option value="Retired">Retired</option>
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
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
