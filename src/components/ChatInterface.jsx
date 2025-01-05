import { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle, Loader } from 'lucide-react';

const ChatInterface = ({ onSubmit, isLoading: externalLoading, initialResponse, imageLoad }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  const maxLength = 500;
  const minLength = 10;

  useEffect(() => {
    if (initialResponse) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  }, [initialResponse]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (text.trim().length < minLength) {
      setError(`Please enter at least ${minLength} characters.`);
      return;
    }

    try {
      setError('');
      await onSubmit(text);
      setText('');
      textareaRef.current?.focus();
    } catch (err) {
      setError(err.message || 'An error occurred while processing your request.');
    }
  };

  const getRemainingChars = () => maxLength - text.length;

  const getCharacterCountColor = () => {
    const remaining = getRemainingChars();
    if (remaining < maxLength * 0.1) return 'text-red-500';
    if (remaining < maxLength * 0.2) return 'text-yellow-500';
    return 'text-gray-500';
  };

  return (
    <div className="w-full space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {initialResponse && (
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-2">AI Response:</h2>
          <p className="text-gray-800 whitespace-pre-wrap">{initialResponse}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4">
        <div className="relative w-full">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, maxLength))}
            className="w-full p-4 bg-white border border-gray-300 rounded-lg shadow-sm
                 focus:ring-1 focus:ring-[#2196f3] focus:border-transparent
                 resize-none transition-all duration-200 outline-none text-gray-800"
            rows={5}
            placeholder="Describe what you see in the image or ask a question..."
            disabled={externalLoading}
          />
          <div className="absolute bottom-3 right-3">
            <span className={`text-sm font-medium ${getCharacterCountColor()}`}>
              {getRemainingChars()} characters remaining
            </span>
          </div>
        </div>
        <div className="text-center">
          <button
            type="submit"
            disabled={text.trim().length < minLength || externalLoading || !imageLoad}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg
                 font-medium transition-all duration-200 w-full sm:w-auto
                 ${
                   text.trim().length < minLength || externalLoading
                     ? 'bg-gray-400 cursor-not-allowed'
                     : 'bg-[#2196f3] hover:bg-blue-600 active:scale-95 hover:shadow-md'
                 }
                 text-white`}
          >
            {externalLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {externalLoading ? 'Processing...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
