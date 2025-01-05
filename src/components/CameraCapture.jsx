import { useRef, useState, useEffect } from 'react';
import { Camera, StopCircle, AlertCircle, Video, FlipHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import PermissionModal from './PermissionModal';

const CameraCapture = ({ onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('prompt');
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');

  useEffect(() => {
    checkPermissions();
    return () => {
      stopCamera();
    };
  }, []);

  const checkPermissions = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'camera' });
        setPermissionStatus(result.state);

        result.addEventListener('change', () => {
          setPermissionStatus(result.state);
          if (result.state === 'denied') {
            stopCamera();
          }
        });
      }
    } catch (err) {
      console.error('Error checking permissions:', err);
    }
  };

  const handlePermissionRequest = () => {
    setShowPermissionModal(true);
  };

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionStatus('granted');
      toast.success('Camera permission granted');
      startCamera();
    } catch (err) {
      setPermissionStatus('denied');
      toast.error('Camera permission denied. Please enable camera access.', {
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
        duration: 5000,
      });
      console.error('Error requesting permissions:', err);
    }
  };

  const startCamera = async (selectedFacingMode = facingMode) => {
    if (permissionStatus === 'denied') {
      toast.error('Camera access is blocked. Please update your browser settings.', {
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
        duration: 5000,
      });
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: selectedFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      await videoRef.current.play();
      setIsStreaming(true);
      setFacingMode(selectedFacingMode);
      toast.success('Camera started successfully');
    } catch (err) {
      toast.error('Failed to start camera. Please try again.', {
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      });
      console.error('Error starting camera:', err);
    }
  };

  const switchCamera = async () => {
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    await startCamera(newFacingMode);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      streamRef.current = null;
      setIsStreaming(false);
      toast.success('Camera stopped');
    }
  };

  const captureImage = () => {
    if (!isStreaming) {
      toast.error('Camera is not active');
      return;
    }

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = canvas.toDataURL('image/png');
      onCapture(imageData);
      toast.success('Image captured successfully!');
    } catch (err) {
      toast.error('Failed to capture image. Please try again.');
      console.error('Error capturing image:', err);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-4">
      {showPermissionModal && (
        <PermissionModal
          onAccept={() => {
            setShowPermissionModal(false);
            requestPermissions();
          }}
          onDecline={() => {
            setShowPermissionModal(false);
            setPermissionStatus('denied');
          }}
        />
      )}

      <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-lg">
        {permissionStatus === 'denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-200 text-gray-600">
            <Video className="w-12 h-12 mb-2" />
            <p className="text-center px-4">
              Camera access is blocked. Please update your browser settings to enable the camera.
            </p>
          </div>
        )}
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
        <canvas ref={canvasRef} className="hidden" />

        {isStreaming && (
          <button
            onClick={switchCamera}
            className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-all duration-200"
            title={`Switch to ${facingMode === 'environment' ? 'front' : 'back'} camera`}
          >
            <FlipHorizontal className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="flex gap-4 mt-4">
        {!isStreaming ? (
          <button
            onClick={permissionStatus === 'prompt' ? handlePermissionRequest : startCamera}
            disabled={permissionStatus === 'denied'}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 ease-in-out transform 
            ${
              permissionStatus === 'denied'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#2196f3] hover:bg-blue-600 hover:scale-105 hover:shadow-md active:scale-95'
            } text-white`}
          >
            <Camera className="w-5 h-5" />
            <span className="font-medium">{permissionStatus === 'prompt' ? 'Start Camera' : 'Start Camera'}</span>
          </button>
        ) : (
          <>
            <button
              onClick={stopCamera}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-md active:scale-95"
            >
              <StopCircle className="w-5 h-5" />
              <span className="font-medium">Stop Camera</span>
            </button>
            <button
              onClick={captureImage}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-md active:scale-95"
            >
              <Camera className="w-5 h-5" />
              <span className="font-medium">Capture</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;
