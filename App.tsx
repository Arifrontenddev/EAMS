import React, { useState, useEffect } from 'react';
import { ViewState, Employee, AttendanceRecord } from './types';
import Scanner from './components/Scanner';
import Registration from './components/Registration';
import Dashboard from './components/Dashboard';
import { getEmployees, getAttendanceRecords } from './services/storageService';
import { LayoutDashboard, ScanFace, UserPlus, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.SCAN);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  // Load data on mount
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setEmployees(getEmployees());
    setRecords(getAttendanceRecords());
  };

  const NavButton = ({ targetView, icon: Icon, label }: { targetView: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => setView(targetView)}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full
        ${view === targetView 
          ? 'bg-indigo-600 text-white shadow-md' 
          : 'text-gray-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm'}
      `}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex bg-[#f3f4f6]">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-50 border-r border-gray-200 flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xl mb-1">
            <ScanFace className="w-8 h-8" />
            <span>FaceTrack</span>
          </div>
          <p className="text-xs text-gray-400 ml-10">Attendance System</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavButton targetView={ViewState.SCAN} icon={ScanFace} label="Scanner" />
          <NavButton targetView={ViewState.REGISTER} icon={UserPlus} label="Registration" />
          <NavButton targetView={ViewState.DASHBOARD} icon={LayoutDashboard} label="Reports & Logs" />
        </nav>

        <div className="p-4 border-t border-gray-200">
           <div className="bg-indigo-50 p-4 rounded-xl">
              <p className="text-xs text-indigo-800 font-medium mb-1">Status: Online</p>
              <p className="text-[10px] text-indigo-600">Gemini 2.5 Active</p>
           </div>
        </div>
      </aside>

      {/* Mobile Header (visible only on small screens) */}
      <div className="md:hidden fixed top-0 w-full bg-white z-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm">
        <span className="font-bold text-indigo-700 flex items-center gap-2">
            <ScanFace className="w-6 h-6"/> FaceTrack
        </span>
        <div className="flex gap-2">
            <button onClick={() => setView(ViewState.SCAN)} className={`p-2 rounded-lg ${view === ViewState.SCAN ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}><ScanFace className="w-5 h-5"/></button>
            <button onClick={() => setView(ViewState.REGISTER)} className={`p-2 rounded-lg ${view === ViewState.REGISTER ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}><UserPlus className="w-5 h-5"/></button>
            <button onClick={() => setView(ViewState.DASHBOARD)} className={`p-2 rounded-lg ${view === ViewState.DASHBOARD ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}><LayoutDashboard className="w-5 h-5"/></button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:p-8 p-4 pt-20 md:pt-8">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">
              {view === ViewState.SCAN && "Check-In Terminal"}
              {view === ViewState.REGISTER && "Employee Registration"}
              {view === ViewState.DASHBOARD && "Attendance Dashboard"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {view === ViewState.SCAN && "Position yourself in front of the camera to mark attendance."}
              {view === ViewState.REGISTER && "Add new team members to the recognition database."}
              {view === ViewState.DASHBOARD && "View daily logs and export data to Excel/Drive."}
            </p>
          </header>

          <div className="animate-fade-in-up">
            {view === ViewState.SCAN && (
              <Scanner employees={employees} onRecordAdded={refreshData} />
            )}
            {view === ViewState.REGISTER && (
              <Registration onEmployeeRegistered={refreshData} />
            )}
            {view === ViewState.DASHBOARD && (
              <Dashboard employees={employees} records={records} onDataChange={refreshData} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;