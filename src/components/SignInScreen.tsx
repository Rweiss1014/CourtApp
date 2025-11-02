import { useState } from 'react';
import { Heart, Lock } from 'lucide-react';
import { Button } from './ui/button';

function PinDot({ filled }: { filled: boolean }) {
  return (
    <div
      className={`w-4 h-4 rounded-full transition-all duration-200 ${
        filled
          ? 'bg-gradient-to-r from-purple-500 to-pink-500 scale-110 shadow-lg shadow-purple-200'
          : 'bg-slate-200 border-2 border-slate-300'
      }`}
    />
  );
}

function NumberButton({ number, onClick }: { number: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-20 h-20 rounded-full bg-white border-2 border-purple-100 text-slate-800 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:border-purple-200 active:scale-95 transition-all duration-150 shadow-sm hover:shadow-md"
    >
      <span className="text-2xl">{number}</span>
    </button>
  );
}

export function SignInScreen({
  onComplete,
}: {
  onComplete: (pin: string, onError: () => void) => void;
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const showError = () => {
    setError(true);
    setPin('');
    setTimeout(() => setError(false), 600);
  };

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);
      
      if (newPin.length === 4) {
        // Delay slightly to show the 4th dot before checking
        setTimeout(() => {
          onComplete(newPin, showError);
        }, 200);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/50">
          {/* Icon */}
          <div className="text-center mb-8">
            <div className={`w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-transform ${
              error ? 'animate-shake' : ''
            }`}>
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-600">Enter your PIN to continue</p>
          </div>

          {/* PIN Dots */}
          <div className="flex justify-center gap-4 mb-10">
            <PinDot filled={pin.length >= 1} />
            <PinDot filled={pin.length >= 2} />
            <PinDot filled={pin.length >= 3} />
            <PinDot filled={pin.length >= 4} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-center mb-4">
              <p className="text-red-500 text-sm animate-pulse">Incorrect PIN. Please try again.</p>
            </div>
          )}

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <div key={num} className="flex justify-center">
                <NumberButton number={num} onClick={() => handleNumberClick(num)} />
              </div>
            ))}
            <div /> {/* Empty space */}
            <div className="flex justify-center">
              <NumberButton number="0" onClick={() => handleNumberClick('0')} />
            </div>
            <div className="flex justify-center items-center">
              <button
                onClick={handleBackspace}
                disabled={pin.length === 0}
                className="w-20 h-20 rounded-full bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                <span className="text-xl">⌫</span>
              </button>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="text-center">
            <p className="text-xs text-slate-500">
              Your records are protected with secure encryption
            </p>
          </div>
        </div>

        {/* Decorative Hearts */}
        <div className="flex justify-center gap-6 mt-8 opacity-30">
          <Heart className="w-4 h-4 text-purple-400" fill="currentColor" />
          <Heart className="w-3 h-3 text-pink-400" fill="currentColor" />
          <Heart className="w-4 h-4 text-rose-400" fill="currentColor" />
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
