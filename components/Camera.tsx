import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { AlertCircle, CameraOff, RefreshCw } from 'lucide-react';

interface CameraProps {
  onCapture?: (imageSrc: string) => void;
  active: boolean;
}

export interface CameraHandle {
  capture: () => string | null;
}

const Camera = forwardRef<CameraHandle, CameraProps>(({ onCapture, active }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<{ type: 'PERMISSION' | 'OTHER'; message: string } | null>(null);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        if (active) {
          setError(null);
          const constraints = {
            video: {
              facingMode: "user",
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          };
          
          currentStream = await navigator.mediaDevices.getUserMedia(constraints);
          
          setStream(currentStream);
          if (videoRef.current) {
            videoRef.current.srcObject = currentStream;
          }
        } else {
          stopCamera();
        }
      } catch (err: any) {
        console.error("Error accessing camera:", err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError({
            type: 'PERMISSION',
            message: "Camera access was denied."
          });
        } else if (err.name === 'NotFoundError') {
          setError({
            type: 'OTHER',
            message: "No camera device found."
          });
        } else if (err.name === 'NotReadableError') {
          setError({
            type: 'OTHER',
            message: "Camera is currently in use by another application."
          });
        } else {
          setError({
            type: 'OTHER',
            message: "Could not access camera."
          });
        }
      }
    };

    const stopCamera = () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    };

    startCamera();

    return () => {
      stopCamera();
    };
  }, [active]);

  useImperativeHandle(ref, () => ({
    capture: () => {
      if (!videoRef.current || !stream) return null;
      
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      // Draw image to canvas
      ctx.drawImage(videoRef.current, 0, 0);
      
      // Convert to base64
      const imageSrc = canvas.toDataURL('image/jpeg', 0.8);
      
      if (onCapture) {
        onCapture(imageSrc);
      }
      return imageSrc;
    }
  }));

  if (error) {
    return (
      <div className="w-full h-64 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-600 p-6">
        {error.type === 'PERMISSION' ? (
          <>
            <div className="bg-red-100 p-3 rounded-full mb-3">
              <CameraOff className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="font-bold text-gray-800 mb-1">Camera Access Denied</h3>
            <p className="text-sm text-center max-w-xs mb-4">
              Please click the <span className="font-bold">lock icon 🔒</span> in your browser address bar and toggle the Camera permission to <span className="font-bold text-green-600">Allow</span>.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>
          </>
        ) : (
          <>
             <div className="bg-yellow-100 p-3 rounded-full mb-3">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="font-medium text-gray-800">{error.message}</p>
            <p className="text-xs text-gray-500 mt-1">Check your device settings.</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black shadow-lg">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transform scale-x-[-1] ${!active ? 'hidden' : ''}`} // Mirror effect
      />
      {!active && (
        <div className="w-full h-64 flex items-center justify-center text-gray-500 bg-gray-100">
          <p className="flex items-center gap-2">
            <CameraOff className="w-5 h-5" /> Camera Inactive
          </p>
        </div>
      )}
    </div>
  );
});

Camera.displayName = 'Camera';
export default Camera;