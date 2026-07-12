import React, { useState, useEffect, useContext, useRef } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  TrendingUp, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  Check, 
  Play, 
  XCircle, 
  ChevronRight,
  Compass,
  AlertOctagon,
  CloudSun,
  ShieldCheck,
  Zap,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

const Trips = () => {
  const { user } = useContext(AuthContext);
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Trip creation states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    vehicleId: '',
    driverId: '',
    cargoWeight: '',
    plannedDistance: '',
    weather: 'Clear',
  });
  const [createError, setCreateError] = useState('');

  // Dispatch override modal
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedTripForDispatch, setSelectedTripForDispatch] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideError, setOverrideError] = useState('');

  // Trip completion modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedTripForCompletion, setSelectedTripForCompletion] = useState(null);
  const [actualFuelUsed, setActualFuelUsed] = useState('');
  const [completionError, setCompletionError] = useState('');

  // Telemetry simulation modal
  const [showTelemetryModal, setShowTelemetryModal] = useState(false);
  const [activeSimulationTrip, setActiveSimulationTrip] = useState(null);
  const [simAlerts, setSimAlerts] = useState([]);
  const [simProgress, setSimProgress] = useState(0);
  const [simDriverScore, setSimDriverScore] = useState(100);
  const simIntervalRef = useRef(null);

  const fetchTripsAndAssets = async () => {
    try {
      setLoading(true);
      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        api.get('/api/trips'),
        api.get('/api/vehicles'),
        api.get('/api/drivers')
      ]);

      if (tripsRes.data.success) setTrips(tripsRes.data.data);
      if (vehiclesRes.data.success) setVehicles(vehiclesRes.data.data);
      if (driversRes.data.success) setDrivers(driversRes.data.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripsAndAssets();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Filter available assets for dropdown selection
  const availableVehicles = vehicles.filter(v => v.status === 'Available');
  const availableDrivers = drivers.filter(d => {
    const isExpired = new Date(d.licenseExpiryDate) < new Date();
    return d.status === 'Available' && !isExpired;
  });

  // Calculate live risk score in frontend before creating
  const getLiveRiskScore = () => {
    if (!formData.vehicleId || !formData.driverId || !formData.cargoWeight || !formData.plannedDistance) return null;
    const v = vehicles.find(item => item._id === formData.vehicleId || item.id === formData.vehicleId);
    const d = drivers.find(item => item._id === formData.driverId || item.id === formData.driverId);
    if (!v || !d) return null;

    const driverRisk = (100 - d.safetyScore) * 0.4;
    const cargoRatio = parseFloat(formData.cargoWeight) / v.maxLoadCapacity;
    const cargoRisk = cargoRatio * 30;

    // Vehicle risk
    const mileageSinceService = Math.max(0, v.odometer - v.lastServiceOdometer);
    const serviceInterval = 10000;
    let vehicleRiskBase = (mileageSinceService / serviceInterval) * 80;
    if (v.odometer > 100000) vehicleRiskBase += 10;
    if (v.odometer > 200000) vehicleRiskBase += 10;
    const vehicleRiskVal = Math.min(100, Math.max(0, Math.floor(vehicleRiskBase)));
    const vehicleRisk = vehicleRiskVal * 0.2;

    let weatherRisk = 0;
    if (formData.weather === 'Rain') weatherRisk = 10;
    if (formData.weather === 'Fog') weatherRisk = 20;
    if (formData.weather === 'Snow') weatherRisk = 30;

    const distanceRisk = Math.min(10, parseFloat(formData.plannedDistance) / 100);

    return Math.min(100, Math.round(driverRisk + cargoRisk + vehicleRisk + weatherRisk + distanceRisk));
  };

  const liveRisk = getLiveRiskScore();

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!formData.source || !formData.destination || !formData.vehicleId || !formData.driverId || !formData.cargoWeight || !formData.plannedDistance) {
      return setCreateError('Please fill in all details');
    }

    try {
      const res = await api.post('/api/trips', formData);
      if (res.data.success) {
        fetchTripsAndAssets();
        setShowCreateModal(false);
        confetti({ particleCount: 50, spread: 45 });
      }
    } catch (error) {
      setCreateError(error.response?.data?.message || 'Error creating trip');
    }
  };

  const handleDispatch = async (trip) => {
    if (trip.riskScore >= 70 && !trip.overrideReason) {
      // Need Fleet Manager override
      if (user.role !== 'Fleet Manager') {
        alert('High risk trip requires a Fleet Manager override signature. Current role unauthorized.');
        return;
      }
      setSelectedTripForDispatch(trip);
      setOverrideReason('');
      setOverrideError('');
      setShowOverrideModal(true);
    } else {
      // Dispatch immediately
      try {
        const res = await api.put(`/api/trips/${trip._id || trip.id}`, { status: 'Dispatched' });
        if (res.data.success) {
          fetchTripsAndAssets();
          confetti({ particleCount: 100, spread: 80 });
        }
      } catch (error) {
        alert(error.response?.data?.message || 'Error dispatching trip');
      }
    }
  };

  const handleDispatchOverride = async (e) => {
    e.preventDefault();
    setOverrideError('');

    if (!overrideReason) {
      return setOverrideError('Override confirmation signature/reason is required');
    }

    try {
      const res = await api.put(`/api/trips/${selectedTripForDispatch._id || selectedTripForDispatch.id}`, {
        status: 'Dispatched',
        overrideReason
      });
      if (res.data.success) {
        fetchTripsAndAssets();
        setShowOverrideModal(false);
        confetti({ particleCount: 150, spread: 100 });
      }
    } catch (error) {
      setOverrideError(error.response?.data?.message || 'Error dispatching with override');
    }
  };

  const handleOpenComplete = (trip) => {
    setSelectedTripForCompletion(trip);
    setActualFuelUsed('');
    setCompletionError('');
    setShowCompleteModal(true);
  };

  const handleCompleteTrip = async (e) => {
    e.preventDefault();
    setCompletionError('');

    try {
      const res = await api.put(`/api/trips/${selectedTripForCompletion._id || selectedTripForCompletion.id}`, {
        status: 'Completed',
        actualFuelUsed: actualFuelUsed ? parseFloat(actualFuelUsed) : null
      });
      if (res.data.success) {
        fetchTripsAndAssets();
        setShowCompleteModal(false);
        confetti({ particleCount: 180, spread: 120, colors: ['#10B981', '#FB923C'] });
      }
    } catch (error) {
      setCompletionError(error.response?.data?.message || 'Error completing trip');
    }
  };

  const handleCancelTrip = async (id) => {
    if (window.confirm('Are you sure you want to cancel this trip dispatch?')) {
      try {
        const res = await api.put(`/api/trips/${id}`, { status: 'Cancelled' });
        if (res.data.success) {
          fetchTripsAndAssets();
        }
      } catch (error) {
        alert(error.response?.data?.message || 'Error cancelling trip');
      }
    }
  };

  // Start Telemetry Simulation
  const startTelemetrySimulation = (trip) => {
    setActiveSimulationTrip(trip);
    setSimAlerts([]);
    setSimProgress(0);
    setSimDriverScore(trip.driver?.safetyScore || 100);
    setShowTelemetryModal(true);

    if (simIntervalRef.current) clearInterval(simIntervalRef.current);

    simIntervalRef.current = setInterval(() => {
      setSimProgress(prev => {
        const next = prev + 5;
        
        // Randomly trigger alerts at progress thresholds
        if (next === 25) {
          triggerTelemetryEvent(trip._id || trip.id, 'sudden_braking');
        } else if (next === 55) {
          triggerTelemetryEvent(trip._id || trip.id, 'speeding');
        } else if (next === 80) {
          triggerTelemetryEvent(trip._id || trip.id, 'route_deviation');
        }

        if (next >= 100) {
          clearInterval(simIntervalRef.current);
        }
        return next;
      });
    }, 1500);
  };

  const triggerTelemetryEvent = async (tripId, eventType) => {
    try {
      const res = await api.post(`/api/trips/${tripId}/telemetry`, { eventType });
      if (res.data.success) {
        setSimDriverScore(res.data.driverSafetyScore);
        
        let alertName = '';
        let desc = res.data.message;
        if (eventType === 'sudden_braking') alertName = 'G-Force Brake Spike';
        if (eventType === 'speeding') alertName = 'Radar Over-speed';
        if (eventType === 'route_deviation') alertName = 'Geofence Breach';

        setSimAlerts(prev => [
          ...prev, 
          { type: eventType, name: alertName, message: desc, time: new Date().toLocaleTimeString() }
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const closeTelemetrySimulation = () => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    setShowTelemetryModal(false);
    fetchTripsAndAssets(); // Refresh status and driver safety scores
  };

  // Weather safety advisory helper
  const getWeatherAdvisory = (weather) => {
    switch (weather) {
      case 'Rain':
        return {
          rules: ['Reduce speed by 15%', 'Enable headlight low-beams', 'Maintain 4-second gap distance'],
          color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30'
        };
      case 'Fog':
        return {
          rules: ['Cap max speed at 45 mph', 'Activate safety flashers / fog lights', 'Increase follow distance to 6s'],
          color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'
        };
      case 'Snow':
        return {
          rules: ['Activate snow tyre tire treads / chains', 'Double stopping margins to 10s', 'Pre-heaters active'],
          color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30'
        };
      default:
        return {
          rules: ['Nominal travel conditions', 'Routine vehicle telemetry active'],
          color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30'
        };
    }
  };

  const filteredTrips = trips.filter(trip => {
    return trip.tripId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           trip.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           trip.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           trip.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getRiskBadgeColor = (score) => {
    if (score >= 70) return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-black';
    if (score >= 40) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      case 'Dispatched':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 font-bold';
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold';
      case 'Cancelled':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500';
    }
  };

  return (
    <div className="p-8 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
      
      {/* Search and Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search trip route or driver..."
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-orange-500 w-64 shadow-sm"
          />
        </div>

        {user.role !== 'Financial Analyst' && (
          <button
            onClick={() => {
              setFormData({
                source: '',
                destination: '',
                vehicleId: '',
                driverId: '',
                cargoWeight: '',
                plannedDistance: '',
                weather: 'Clear',
              });
              setCreateError('');
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 px-4.5 py-1.75 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg shadow-md shadow-orange-600/10 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Schedule Trip
          </button>
        )}
      </div>

      {/* Trips list */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-4.5">Trip ID</th>
                <th className="px-6 py-4.5">Route</th>
                <th className="px-6 py-4.5">Asset Allocation</th>
                <th className="px-6 py-4.5 text-center">Planned Run</th>
                <th className="px-6 py-4.5 text-center">Risk Score</th>
                <th className="px-6 py-4.5 text-center">CO2 Footprint</th>
                <th className="px-6 py-4.5">Status</th>
                <th className="px-6 py-4.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    Loading trip logs...
                  </td>
                </tr>
              ) : filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No trips logged.
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => (
                  <tr key={trip._id || trip.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-all">
                    <td className="px-6 py-4.5 font-bold text-slate-800 dark:text-slate-100">
                      {trip.tripId}
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-100">
                          <MapPin className="h-3.5 w-3.5 text-orange-500" />
                          <span>{trip.source}</span>
                          <ChevronRight className="h-3 w-3 text-slate-400" />
                          <span>{trip.destination}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          <CloudSun className="h-3 w-3 text-amber-500" />
                          <span>Simulated Environment: {trip.weather}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="space-y-1">
                        <div className="text-xs text-slate-700 dark:text-slate-350">
                          <span className="font-bold">Truck:</span> {trip.vehicle?.name} ({trip.vehicle?.registrationNumber})
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-350">
                          <span className="font-bold">Driver:</span> {trip.driver?.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-center">
                      <div>
                        <div className="font-bold text-slate-700 dark:text-slate-300">{trip.plannedDistance} mi</div>
                        <div className="text-[10px] text-slate-400 font-medium">Cargo: {trip.cargoWeight?.toLocaleString()} kg</div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-center">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getRiskBadgeColor(trip.riskScore)}`}>
                        {trip.riskScore}%
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-center font-bold text-slate-800 dark:text-slate-200">
                      {trip.status === 'Completed' ? `${trip.co2Emissions} kg` : '--'}
                    </td>
                    <td className="px-6 py-4.5 font-bold">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getStatusBadge(trip.status)}`}>
                        {trip.status}
                      </span>
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="flex items-center justify-center gap-2">
                        {trip.status === 'Draft' && (
                          <>
                            <button
                              onClick={() => handleDispatch(trip)}
                              className="px-2.5 py-1 text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white rounded cursor-pointer"
                            >
                              Dispatch
                            </button>
                            <button
                              onClick={() => handleCancelTrip(trip._id || trip.id)}
                              className="px-2.5 py-1 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {trip.status === 'Dispatched' && (
                          <>
                            <button
                              onClick={() => startTelemetrySimulation(trip)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white rounded cursor-pointer animate-pulse"
                            >
                              <Zap className="h-3 w-3" /> Simulate
                            </button>
                            <button
                              onClick={() => handleOpenComplete(trip)}
                              className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleCancelTrip(trip._id || trip.id)}
                              className="px-2.5 py-1 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded cursor-pointer"
                            >
                              Abort
                            </button>
                          </>
                        )}
                        {trip.status === 'Completed' && (
                          <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/15 rounded-full font-bold">Trip Success</span>
                        )}
                        {trip.status === 'Cancelled' && (
                          <span className="text-[10px] text-slate-400 bg-slate-500/10 px-2 py-0.5 border border-slate-500/10 rounded-full">Omitted</span>
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

      {/* Schedule Trip Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Schedule New Dispatch Trip</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateTrip} className="p-6 space-y-4">
              {createError && (
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-2.5 rounded-lg text-xs font-semibold">
                  <AlertOctagon className="h-4 w-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Departure (Source)</label>
                  <input
                    type="text"
                    name="source"
                    value={formData.source}
                    onChange={handleInputChange}
                    placeholder="e.g. Dallas, TX"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Destination</label>
                  <input
                    type="text"
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    placeholder="e.g. Phoenix, AZ"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Select Available Vehicle</label>
                  <select
                    name="vehicleId"
                    value={formData.vehicleId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-350 focus:outline-none"
                  >
                    <option value="">-- Choose Truck --</option>
                    {availableVehicles.map(v => (
                      <option key={v._id || v.id} value={v._id || v.id}>{v.name} ({v.registrationNumber}) - Cap: {v.maxLoadCapacity}kg</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Select Available Driver</label>
                  <select
                    name="driverId"
                    value={formData.driverId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-350 focus:outline-none"
                  >
                    <option value="">-- Choose Driver --</option>
                    {availableDrivers.map(d => (
                      <option key={d._id || d.id} value={d._id || d.id}>{d.name} (Safety Score: {d.safetyScore})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Cargo Weight (kg)</label>
                  <input
                    type="number"
                    name="cargoWeight"
                    value={formData.cargoWeight}
                    onChange={handleInputChange}
                    placeholder="e.g. 12000"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Planned Distance (mi)</label>
                  <input
                    type="number"
                    name="plannedDistance"
                    value={formData.plannedDistance}
                    onChange={handleInputChange}
                    placeholder="e.g. 350"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Weather Environment</label>
                  <select
                    name="weather"
                    value={formData.weather}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-350 focus:outline-none"
                  >
                    <option value="Clear">Clear</option>
                    <option value="Rain">Rain (+10 Risk)</option>
                    <option value="Fog">Fog (+20 Risk)</option>
                    <option value="Snow">Snow (+30 Risk)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Risk Display */}
              {liveRisk !== null && (
                <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dynamic Risk Assessment</h5>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-black px-3 py-1 rounded-lg border ${getRiskBadgeColor(liveRisk)}`}>
                        {liveRisk}%
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {liveRisk >= 70 ? 'High Dispatch Risk' : liveRisk >= 40 ? 'Medium Risk' : 'Low Safety Risk'}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Calculated in real-time</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Weather safety advisory</h5>
                    <div className={`p-2 rounded-lg text-[10px] font-semibold border ${getWeatherAdvisory(formData.weather).color}`}>
                      <ul className="list-disc pl-3.5 space-y-0.5">
                        {getWeatherAdvisory(formData.weather).rules.map((rule, index) => (
                          <li key={index}>{rule}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {liveRisk >= 70 && (
                    <div className="col-span-1 md:col-span-2 flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 px-3.5 py-2.5 rounded-lg text-xs">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>Warning: Risk is above 70%. Fleet Manager override signature required to dispatch this trip.</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold shadow-md shadow-orange-600/10 cursor-pointer"
                >
                  Create Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fleet Manager Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Fleet Manager Dispatch Override</h3>
              <button onClick={() => setShowOverrideModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleDispatchOverride} className="p-6 space-y-4">
              {overrideError && (
                <div className="text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                  {overrideError}
                </div>
              )}

              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded-lg text-xs">
                <AlertOctagon className="h-5 w-5 shrink-0" />
                <span>You are approving a HIGH RISK trip ({selectedTripForDispatch?.riskScore}%). Please sign and state the overriding dispatch justification.</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Override Reason / Authorization Signature</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Critical vaccine cargo delivery. Verified driver rest logs and double-checked cargo restraint webbing."
                  rows="3"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold shadow-md shadow-orange-600/10"
                >
                  Authorize Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Trip Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Complete Trip Record</h3>
              <button onClick={() => setShowCompleteModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCompleteTrip} className="p-6 space-y-4">
              {completionError && (
                <div className="text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                  {completionError}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Fuel Consumed (gallons) - Optional</label>
                <input
                  type="number"
                  step="0.1"
                  value={actualFuelUsed}
                  onChange={(e) => setActualFuelUsed(e.target.value)}
                  placeholder="e.g. 45.8"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
                <p className="text-[10px] text-slate-450 mt-1 font-medium">Providing actual fuel values calculates exact CO2 sustainability scores. If empty, the system runs estimates.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/10"
                >
                  Complete Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Telemetry Simulation Modal */}
      {showTelemetryModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-slate-100">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-1.5">
                <Compass className="h-5 w-5 text-orange-500 animate-spin" />
                Live Telemetry Ingestion Simulator
              </h3>
              <button 
                onClick={closeTelemetrySimulation} 
                className="text-slate-400 hover:text-white cursor-pointer p-1 rounded hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Truck Details */}
              <div className="grid grid-cols-3 gap-4 border border-slate-800 p-4 rounded-xl bg-slate-950/30 text-xs">
                <div>
                  <span className="text-slate-500 uppercase font-semibold">Active Trip ID</span>
                  <p className="font-bold text-sm mt-0.5 text-orange-400">{activeSimulationTrip?.tripId}</p>
                </div>
                <div>
                  <span className="text-slate-500 uppercase font-semibold">Driver</span>
                  <p className="font-bold text-sm mt-0.5">{activeSimulationTrip?.driver?.name}</p>
                </div>
                <div>
                  <span className="text-slate-500 uppercase font-semibold">Driver Score</span>
                  <p className={`font-bold text-sm mt-0.5 ${
                    simDriverScore >= 80 ? 'text-emerald-400' : simDriverScore >= 50 ? 'text-amber-400' : 'text-rose-500 font-extrabold'
                  }`}>
                    {simDriverScore} pts
                  </p>
                </div>
              </div>

              {/* Mock Route Tracker Animation */}
              <div className="relative h-20 bg-slate-950 rounded-xl border border-slate-800 flex items-center px-8 overflow-hidden">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-0.5 border-t-2 border-dashed border-slate-700"></div>
                </div>

                {/* Departure Pin */}
                <div className="absolute left-6 flex flex-col items-center z-10">
                  <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                  <span className="text-[9px] text-slate-500 mt-1 font-bold">{activeSimulationTrip?.source}</span>
                </div>

                {/* Destination Pin */}
                <div className="absolute right-6 flex flex-col items-center z-10">
                  <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                  <span className="text-[9px] text-slate-500 mt-1 font-bold">{activeSimulationTrip?.destination}</span>
                </div>

                {/* Moving Truck */}
                <div 
                  className="absolute flex flex-col items-center transition-all duration-1000 z-20"
                  style={{ left: `calc(${simProgress}% - 8px)` }}
                >
                  <Zap className="h-6 w-6 text-orange-500 fill-orange-500/20 animate-bounce" />
                  <span className="text-[8px] bg-orange-600 text-white font-extrabold px-1 py-0.5 rounded-md shadow-md mt-1">GPS-Sim</span>
                </div>
              </div>

              {/* Telemetry Alert Log */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">In-Cab Telemetry Feed</h4>
                <div className="h-44 border border-slate-800 bg-slate-950 rounded-xl p-4 overflow-y-auto font-mono text-[11px] space-y-2.5">
                  <div className="text-emerald-400">[{new Date().toLocaleTimeString()}] Starting telemetry simulation engine...</div>
                  <div className="text-slate-400">[{new Date().toLocaleTimeString()}] GPS link established. Sending route coordinates...</div>
                  
                  {simAlerts.map((alert, index) => (
                    <div key={index} className="text-rose-400 animate-pulse border-l-2 border-rose-500 pl-2">
                      [{alert.time}] 🚨 {alert.name} Alert: {alert.message}
                    </div>
                  ))}

                  {simProgress >= 100 && (
                    <div className="text-emerald-400 font-bold">[{new Date().toLocaleTimeString()}] Simulation telemetry complete. Final values synced to database.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
              <span className="text-xs text-slate-450 font-medium">Closing this syncs telemetry updates immediately.</span>
              <button
                onClick={closeTelemetrySimulation}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 font-bold text-xs rounded-lg cursor-pointer"
              >
                Close Tracking Console
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trips;
