import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

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

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        if (active) {
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
          setError('');
        } else {
          stopCamera();
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access camera. Please allow permissions.");
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
      <div className="w-full h-64 bg-gray-900 rounded-lg flex items-center justify-center text-white">
        <p>{error}</p>
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
        <div className="w-full h-96 flex items-center justify-center text-gray-500">
          Camera Inactive
        </div>
      )}
    </div>
  );
});

Camera.displayName = 'Camera';
export default Camera;