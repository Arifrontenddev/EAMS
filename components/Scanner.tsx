import React, { useState, useRef } from 'react';
import Camera, { CameraHandle } from './Camera';
import { identifyEmployeeWithGemini } from '../services/geminiService';
import { saveAttendanceRecord } from '../services/storageService';
import { Employee, AttendanceRecord } from '../types';
import { Loader2, CheckCircle, XCircle, ScanFace } from 'lucide-react';

interface ScannerProps {
  employees: Employee[];
  onRecordAdded: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ employees, onRecordAdded }) => {
  const cameraRef = useRef<CameraHandle>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  const handleScan = async () => {
    if (!cameraRef.current || isProcessing) return;

    setIsProcessing(true);
    setLastResult(null);

    try {
      const imageSrc = cameraRef.current.capture();
      if (!imageSrc) {
        throw new Error("Failed to capture image");
      }

      if (employees.length === 0) {
        setLastResult({ success: false, message: "No employees registered yet." });
        setIsProcessing(false);
        return;
      }

      const result = await identifyEmployeeWithGemini(imageSrc, employees);

      if (result.match && result.employeeId && result.name) {
        // Log attendance
        const newRecord: AttendanceRecord = {
          id: crypto.randomUUID(),
          employeeId: result.employeeId,
          employeeName: result.name,
          timestamp: new Date().toISOString(),
          confidence: result.confidence,
          type: 'CHECK_IN' // Simplified for demo; could toggle based on last record
        };

        saveAttendanceRecord(newRecord);
        onRecordAdded();
        
        setLastResult({
          success: true,
          message: `Welcome, ${result.name}!`,
          data: result
        });
      } else {
        setLastResult({
          success: false,
          message: "Face not recognized. Please try closer or check lighting."
        });
      }

    } catch (error: any) {
      console.error(error);
      let errorMessage = "Error processing scan.";
      
      // Provide more specific feedback for common errors
      if (error.message.includes("API Key")) {
        errorMessage = "System Error: API Key not found. Please add 'API_KEY' in Vercel Environment Variables.";
      } else if (error.message.includes("429")) {
        errorMessage = "Service busy. Please try again in a moment.";
      }

      setLastResult({ success: false, message: errorMessage });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-4 flex items-center justify-between">
            <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <ScanFace className="w-6 h-6 text-indigo-600"/>
                    Attendance Scanner
                </h2>
                <p className="text-sm text-gray-500 mt-1">Look at the camera and click scan to mark attendance.</p>
            </div>
            <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
               {employees.length} Registered Faces
            </div>
        </div>

        <div className="mb-6">
          <Camera ref={cameraRef} active={true} />
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleScan}
            disabled={isProcessing}
            className={`
              w-full max-w-sm py-3 px-6 rounded-lg font-semibold text-white shadow-md transition-all
              flex items-center justify-center gap-2
              ${isProcessing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'}
            `}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing AI...
              </>
            ) : (
              <>
                <ScanFace className="w-5 h-5" />
                Scan & Check In
              </>
            )}
          </button>

          {lastResult && (
            <div className={`
              w-full p-4 rounded-lg flex items-center gap-3 animate-fade-in
              ${lastResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}
            `}>
              {lastResult.success ? <CheckCircle className="w-6 h-6 shrink-0" /> : <XCircle className="w-6 h-6 shrink-0" />}
              <div>
                <p className="font-semibold">{lastResult.message}</p>
                {lastResult.data && (
                  <p className="text-xs opacity-75 mt-1">
                    Confidence: {(lastResult.data.confidence * 100).toFixed(1)}% | 
                    Time: {new Date().toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Scanner;