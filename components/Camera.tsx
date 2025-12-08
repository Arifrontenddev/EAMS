import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { AlertCircle, RefreshCw, CameraOff, Lock, Video } from 'lucide-react';

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
  const [error, setError] = useState<string>('');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  useEffect(() => {
    let currentStream: MediaStream | null = null;
    let isMounted = true;

    const startCamera = async () => {
      // 1. Validate Context
      if (!active) {
        return;
      }

      try {
        setError('');
        setPermissionDenied(false);

        // Check for mediaDevices support
        // Note: Browsers like Chrome will undefined 'navigator.mediaDevices' on insecure HTTP origins (except localhost/127.0.0.1)
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
           if (window.location.protocol !== 'https:' && 
               window.location.hostname !== 'localhost' && 
               window.location.hostname !== '127.0.0.1') {
              throw new Error("Camera requires a Secure Context (HTTPS or localhost).");
           }
           throw new Error("Camera API not supported in this browser.");
        }

        // 2. Constraints Strategy
        // Start with ideal resolution, fall back to basic, then fall back to "any video"
        const constraintsSets = [
            // Plan A: Ideal Resolution (HD)
            { audio: false, video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } },
            // Plan B: Basic User Camera
            { audio: false, video: { facingMode: 'user' } },
            // Plan C: Any Video
            { audio: false, video: true }
        ];

        for (const constraints of constraintsSets) {
            try {
                currentStream = await navigator.mediaDevices.getUserMedia(constraints);
                // If successful, break the loop
                break;
            } catch (e: any) {
                // Check if it's a permission error, if so, don't keep trying other constraints (it will just fail again)
                if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
                    throw e;
                }
                // Otherwise (e.g. OverconstrainedError), continue to next constraints set
                console.warn(`Camera constraints failed: ${JSON.stringify(constraints)}`, e);
            }
        }

        // If loop finished and we still have no stream
        if (!currentStream) {
            throw new Error("Could not initialize camera with any supported settings.");
        }
        
        // 3. Mount Check
        if (!isMounted) {
          // Clean up if component unmounted while waiting
          currentStream.getTracks().forEach(track => track.stop());
          return;
        }

        // 4. Success
        setStream(currentStream);
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }

      } catch (err: any) {
        console.error("Error accessing camera:", err);
        if (!isMounted) return;

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError("Access denied. Please allow camera permission.");
          setPermissionDenied(true);
        } else if (err.name === 'NotFoundError') {
          setError("No camera device found.");
        } else if (err.name === 'NotReadableError') {
          setError("Camera is busy (used by another app?) or inaccessible.");
        } else {
          setError(err.message || 'Unknown camera error');
        }
      }
    };

    startCamera();

    // Cleanup
    return () => {
      isMounted = false;
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setStream(null);
    };
  }, [active, retryTrigger]);

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

  const handleManualRetry = () => {
    setRetryTrigger(prev => prev + 1);
  };

  if (error) {
    return (
      <div className="relative w-full overflow-hidden rounded-xl bg-gray-900 shadow-lg flex flex-col items-center justify-center text-white p-6 text-center h-[300px] md:h-[400px]">
        <div className="bg-red-500/10 p-4 rounded-full mb-4">
            {permissionDenied ? <Lock className="w-8 h-8 text-red-400" /> : <CameraOff className="w-8 h-8 text-red-400" />}
        </div>
        <p className="text-red-400 font-semibold mb-2 flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
        </p>
        
        {permissionDenied ? (
             <div className="text-sm text-gray-400 mb-6 max-w-xs space-y-2 bg-gray-800 p-4 rounded-lg">
                <p className="font-semibold text-white">How to fix:</p>
                <ol className="list-decimal pl-4 space-y-1 text-left">
                  <li>Look for a <strong>camera/lock icon</strong> in the URL bar (top of screen).</li>
                  <li>Click it and select <strong>"Allow"</strong> or <strong>"Reset permission"</strong>.</li>
                  <li>Then click the button below.</li>
                </ol>
             </div>
        ) : (
            <p className="text-sm text-gray-400 mb-6 max-w-sm">
                If testing locally on mobile, browsers block camera on HTTP. Use <code>localhost</code>, <code>127.0.0.1</code>, or enable "Insecure origins treated as secure" in chrome://flags.
            </p>
        )}

        <button 
            onClick={handleManualRetry}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-900/50"
        >
            <Video className="w-4 h-4" />
            {permissionDenied ? 'I have enabled permissions' : 'Retry Camera'}
        </button>
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
        <div className="w-full h-[300px] flex items-center justify-center text-gray-500 bg-gray-100">
            <div className="flex flex-col items-center gap-2">
                <CameraOff className="w-8 h-8 opacity-50"/>
                <span>Camera Inactive</span>
            </div>
        </div>
      )}
    </div>
  );
});

Camera.displayName = 'Camera';
export default Camera;