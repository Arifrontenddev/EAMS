import React, { useState, useRef } from 'react';
import Camera, { CameraHandle } from './Camera';
import { saveEmployee } from '../services/storageService';
import { Employee } from '../types';
import { UserPlus, Camera as CameraIcon, Save, RefreshCw } from 'lucide-react';

interface RegistrationProps {
  onEmployeeRegistered: () => void;
}

const Registration: React.FC<RegistrationProps> = ({ onEmployeeRegistered }) => {
  const cameraRef = useRef<CameraHandle>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleCapture = () => {
    if (cameraRef.current) {
      const img = cameraRef.current.capture();
      setCapturedImage(img);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleSave = () => {
    if (!name || !role || !capturedImage) return;

    const newEmployee: Employee = {
      id: crypto.randomUUID(),
      name,
      role,
      photoBase64: capturedImage,
      registeredAt: new Date().toISOString(),
    };

    saveEmployee(newEmployee);
    setIsSaved(true);
    
    // Reset form after short delay
    setTimeout(() => {
      setName('');
      setRole('');
      setCapturedImage(null);
      setIsSaved(false);
      onEmployeeRegistered();
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Left Column: Form */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            New Employee
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="e.g. Jane Doe"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role / Department</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="e.g. Engineering"
              />
            </div>

            <div className="pt-4">
                <p className="text-xs text-gray-500 mb-2">Instructions:</p>
                <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
                    <li>Ensure good lighting.</li>
                    <li>Face the camera directly.</li>
                    <li>Remove glasses or masks if possible.</li>
                </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Camera */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CameraIcon className="w-5 h-5 text-indigo-600" />
            Face Capture
          </h2>

          <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video mb-4">
            {capturedImage ? (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            ) : (
              <Camera ref={cameraRef} active={!capturedImage} />
            )}
          </div>

          <div className="flex gap-3">
            {!capturedImage ? (
              <button
                onClick={handleCapture}
                className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
              >
                Capture Photo
              </button>
            ) : (
              <button
                onClick={handleRetake}
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Retake
              </button>
            )}
            
            <button
              onClick={handleSave}
              disabled={!name || !role || !capturedImage || isSaved}
              className={`
                flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2
                ${isSaved 
                  ? 'bg-green-600 text-white' 
                  : (!name || !role || !capturedImage)
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'}
              `}
            >
              {isSaved ? 'Saved!' : <><Save className="w-4 h-4" /> Save Employee</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;