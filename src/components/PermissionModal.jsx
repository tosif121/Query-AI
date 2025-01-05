import { Camera, X } from 'lucide-react';
import React from 'react';

function PermissionModal({ onAccept, onDecline }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
        <button onClick={onDecline} className="absolute right-4 top-4 text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <Camera className="w-16 h-16 text-[#2196f3] mb-4" />
          <h3 className="text-lg font-semibold mb-2">Camera Permission Required</h3>
          <p className="text-gray-600 text-center mb-4">
            This app needs access to your camera to take photos. Your camera will only be used when you choose to take a
            picture.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={onDecline}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
            >
              Decline
            </button>
            <button
              onClick={onAccept}
              className="px-4 py-2 bg-[#2196f3] text-white rounded-lg hover:bg-blue-600 transition-colors w-full sm:w-auto"
            >
              Allow Camera Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PermissionModal;
