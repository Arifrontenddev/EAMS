import React from 'react';
import { Employee, AttendanceRecord } from '../types';
import { exportToCSV, deleteEmployee } from '../services/storageService';
import { Download, Trash2, Clock, User, Sheet } from 'lucide-react';

interface DashboardProps {
  employees: Employee[];
  records: AttendanceRecord[];
  onDataChange: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ employees, records, onDataChange }) => {
  
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this employee? This will prevent them from checking in.')) {
        deleteEmployee(id);
        onDataChange();
    }
  };

  // Sort records by timestamp descending
  const sortedRecords = [...records].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-8">
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500 font-medium">Total Employees</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">{employees.length}</h3>
            </div>
            <div className="bg-indigo-50 p-3 rounded-full text-indigo-600">
                <User className="w-6 h-6" />
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500 font-medium">Today's Check-ins</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">
                    {records.filter(r => new Date(r.timestamp).toDateString() === new Date().toDateString()).length}
                </h3>
            </div>
            <div className="bg-green-50 p-3 rounded-full text-green-600">
                <Clock className="w-6 h-6" />
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
             <button 
                onClick={() => exportToCSV(records)}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
             >
                <Sheet className="w-5 h-5" />
                <span>Download Excel Report</span>
             </button>
             <p className="text-xs text-center text-gray-400 mt-2">Exports CSV compatible with Google Drive/Excel</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Column */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 text-lg">Attendance Log</h3>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Real-time</span>
            </div>
            <div className="overflow-y-auto max-h-[500px]">
                {sortedRecords.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">No attendance records yet.</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-medium sticky top-0">
                            <tr>
                                <th className="px-6 py-3">Employee</th>
                                <th className="px-6 py-3">Time</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Confidence</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sortedRecords.map((record) => (
                                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-800">{record.employeeName}</td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">
                                        {new Date(record.timestamp).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            record.confidence > 0.8 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {(record.confidence * 100).toFixed(0)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>

        {/* Registered Employees Column */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[500px]">
             <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 text-lg">Employees</h3>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
                {employees.length === 0 ? (
                    <p className="text-center text-gray-400 py-4">No employees registered.</p>
                ) : (
                    employees.map(emp => (
                        <div key={emp.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50 transition-all group">
                            <img src={emp.photoBase64} alt={emp.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 truncate">{emp.name}</p>
                                <p className="text-xs text-gray-500 truncate">{emp.role}</p>
                            </div>
                            <button 
                                onClick={() => handleDelete(emp.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;