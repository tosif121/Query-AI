import { useState } from 'react';
import CameraCapture from '../components/CameraCapture';
import ChatInterface from '../components/ChatInterface';

export default function Home() {
  const [image, setImage] = useState(null);
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImageCapture = (imageData) => {
    const base64Response = imageData.split(',')[1];
    const binaryData = atob(base64Response);
    const bytes = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i);
    }
    const imageBlob = new Blob([bytes], { type: 'image/png' });
    setImage(imageBlob);
  };

  const handleSubmit = async (text) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      if (image) {
        formData.append('image', image, 'capture.png');
      }
      formData.append('text', text);

      const response = await fetch('/api/ask', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        setResponse('Error: ' + data.error);
      } else {
        setResponse(data.answer);
      }
    } catch (error) {
      console.error('Error:', error);
      setResponse('Error processing request: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 text-center">Query AI Assistant</h1>

      <div className="w-full max-w-2xl mb-8">
        <CameraCapture onCapture={handleImageCapture} />
      </div>

      {image && (
        <div className="w-full max-w-2xl mb-8">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-2">Captured Image</h2>
            <img
              src={URL.createObjectURL(image)}
              alt="Captured"
              className="w-full rounded-lg"
              onLoad={() => URL.revokeObjectURL(image)}
            />
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl">
        <ChatInterface onSubmit={handleSubmit} isLoading={isLoading} initialResponse={response} imageLoad={image} />
      </div>
    </div>
  );
}
