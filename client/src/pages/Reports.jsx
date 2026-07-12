import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  BarChart3, 
  Leaf, 
  TrendingUp, 
  CircleDollarSign, 
  Download, 
  FileText, 
  ShieldCheck 
} from 'lucide-react';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

const Reports = () => {
  const [roiData, setRoiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCO2, setTotalCO2] = useState(0);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/reports/vehicles');
      if (res.data.success) {
        setRoiData(res.data.data);
        
        // Sum total CO2 footprint
        const co2Sum = res.data.data.reduce((acc, vehicle) => acc + (vehicle.co2Emissions || 0), 0);
        setTotalCO2(co2Sum);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ROI reports:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/api/reports/export/csv', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `TransitOps_Fleet_Report_${new Date().toISOString().split('T')[0]}.csv`);
      a.click();
      
      confetti({ particleCount: 30, spread: 20 });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error generating CSV export file.');
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('TransitOps Smart Transport Platform', 15, 20);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Fleet ROI & ESG Sustainability Ledger - Generated: ${new Date().toLocaleString()}`, 15, 27);
      
      // Divider
      doc.line(15, 30, 195, 30);
      
      // ESG highlights
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('1. ESG Sustainability Indices', 15, 40);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Total Fleet CO2 Emission Level: ${totalCO2.toFixed(1)} kg CO2`, 15, 47);
      doc.text(`Simulated Green Savings vs Diesel Baseline: ${(totalCO2 * 0.12).toFixed(1)} kg CO2 Offset`, 15, 53);
      
      // ROI Table Header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Vehicle Operations & Return on Investment (ROI)', 15, 65);
      
      doc.setFontSize(9);
      doc.setFillColor(30, 41, 59); // Dark slate header
      doc.rect(15, 72, 180, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text('Reg Number', 17, 77);
      doc.text('Vehicle Description', 45, 77);
      doc.text('Trips', 95, 77);
      doc.text('Total Cost', 115, 77);
      doc.text('Total Revenue', 145, 77);
      doc.text('ROI Score', 175, 77);
      
      // Reset color
      doc.setTextColor(0, 0, 0);
      let y = 86;
      
      roiData.forEach((vehicle, index) => {
        // Alt background
        if (index % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, y - 4, 180, 6, 'F');
        }
        
        doc.text(vehicle.registrationNumber || 'N/A', 17, y);
        doc.text(vehicle.name || 'N/A', 45, y);
        doc.text(String(vehicle.tripsCount || 0), 98, y);
        doc.text(`$${(vehicle.totalOperationalCost || 0).toFixed(0)}`, 115, y);
        doc.text(`$${(vehicle.revenue || 0).toFixed(0)}`, 145, y);
        doc.text(`${(vehicle.roi || 0).toFixed(1)}%`, 175, y);
        
        y += 7;
        
        // Add new page if page overflows
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
      });
      
      doc.save(`TransitOps_Fleet_ROI_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      confetti({ particleCount: 60, spread: 40, colors: ['#EA580C', '#FB923C'] });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF document.');
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
      
      {/* Utilities header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-orange-500" />
          <span className="font-bold text-sm text-slate-800 dark:text-slate-100">Export Controls & Document Generators</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-4.5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg shadow-md cursor-pointer transition-all"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1 px-4.5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg shadow-md cursor-pointer transition-all"
          >
            <FileText className="h-4 w-4" /> Generate PDF Ledger
          </button>
        </div>
      </div>

      {/* Sustainability ESG Deck */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CO2 Emissions Scorecard */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-500 border border-emerald-500/20">
              <Leaf className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">Sustainability ESG Ledger</h4>
              <p className="text-xs text-slate-450">Active fleet CO2 offset and green index metrics</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total CO2 Discharged</span>
              <p className="text-2xl font-black text-slate-850 dark:text-slate-100 mt-1">{totalCO2.toFixed(1)} kg</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Estimated Carbon Saved</span>
              <p className="text-2xl font-black text-emerald-500 mt-1">{(totalCO2 * 0.12).toFixed(1)} kg</p>
            </div>
          </div>
        </div>

        {/* ESG Target Goal */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1">Corporate Carbon Cap Goals</h4>
            <p className="text-xs text-slate-405">Current progress towards ESG Class A status</p>
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Actual vs Targeted Carbon Level</span>
              <span className="text-orange-500">68% efficiency</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-orange-600 h-full rounded-full" style={{ width: '68%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet ROI Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h4 className="font-bold text-slate-850 dark:text-slate-100 text-base flex items-center gap-2">
            <CircleDollarSign className="h-5 w-5 text-emerald-500" />
            Vehicle Return on Investment (ROI) Leaderboard
          </h4>
          <span className="text-[10px] text-orange-500 bg-orange-500/10 px-2 py-0.5 border border-orange-500/15 rounded-full font-bold">Auto computed</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-4">Vehicle Details</th>
                <th className="px-6 py-4 text-center">Trips Ran</th>
                <th className="px-6 py-4">Total Expenses</th>
                <th className="px-6 py-4">Fuel Refills Cost</th>
                <th className="px-6 py-4">Revenue Generated</th>
                <th className="px-6 py-4">Acquisition Base</th>
                <th className="px-6 py-4">ROI Score (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Loading ledger data...
                  </td>
                </tr>
              ) : roiData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No operating data logged for any vehicles.
                  </td>
                </tr>
              ) : (
                roiData.map((vehicle) => {
                  const expensesTotal = (vehicle.maintenanceCost || 0) + (vehicle.otherCost || 0);
                  const fuelTotal = vehicle.fuelCost || 0;
                  
                  return (
                    <tr key={vehicle.id || vehicle.registrationNumber} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-bold text-slate-850 dark:text-slate-150">{vehicle.name}</div>
                          <div className="text-xs text-slate-405 mt-0.5">Plate: {vehicle.registrationNumber}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-semibold">{vehicle.tripsCount}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-350">${expensesTotal.toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-350">${fuelTotal.toLocaleString()}</td>
                      <td className="px-6 py-4 text-emerald-500 font-extrabold">${vehicle.revenue?.toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold text-slate-500">${vehicle.acquisitionCost?.toLocaleString() || '--'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded border font-bold ${
                          vehicle.roi >= 10
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15'
                            : vehicle.roi >= 0
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/15'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-450 border-rose-500/15 font-black'
                        }`}>
                          <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                          {vehicle.roi.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
