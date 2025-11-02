import { useState } from 'react';
import { Heart, Shield, Lock, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

export function WelcomeScreen({ onComplete }: { onComplete: (name?: string) => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');

  const handleGetStarted = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      onComplete(name.trim() || undefined);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/50">
          {step === 1 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Heart className="w-10 h-10 text-white" fill="white" />
              </div>
              <h1 className="text-slate-900 mb-3">Welcome to Record Keeper</h1>
              <p className="text-slate-600 mb-8 leading-relaxed">
                A safe, private space to document your journey and protect what matters most.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3 text-left bg-purple-50/50 rounded-2xl p-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-slate-900 mb-1">Your Privacy First</h4>
                    <p className="text-sm text-slate-600">
                      Everything stays on your device. No cloud, no sharing.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-left bg-pink-50/50 rounded-2xl p-4">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <h4 className="text-slate-900 mb-1">Secure & Protected</h4>
                    <p className="text-sm text-slate-600">
                      Optional PIN lock keeps your records safe.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-left bg-rose-50/50 rounded-2xl p-4">
                  <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h4 className="text-slate-900 mb-1">Professional Reports</h4>
                    <p className="text-sm text-slate-600">
                      Export organized evidence when you need it.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleGetStarted}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
              >
                Get Started
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">✨</span>
              </div>
              <h2 className="text-slate-900 mb-3">You're Not Alone</h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                This tool is designed to help you document important moments, build evidence, 
                and feel empowered in difficult situations.
              </p>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 mb-8 border border-purple-100">
                <p className="text-sm text-slate-700 leading-relaxed italic">
                  "Having a clear record gave me the confidence I needed. I felt prepared 
                  and organized instead of overwhelmed."
                </p>
                <p className="text-xs text-slate-500 mt-3">— Sarah, Record Keeper user</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  Back
                </Button>
                <Button
                  onClick={handleGetStarted}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">💝</span>
              </div>
              <h2 className="text-slate-900 mb-3">Nice to Meet You</h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                What would you like us to call you? (Optional)
              </p>
              <div className="mb-8 text-left">
                <Label className="text-slate-700 mb-2 block">Your Name</Label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your first name"
                  className="border-purple-200 focus:border-purple-400"
                />
                <p className="text-xs text-slate-500 mt-2">
                  This stays private on your device and makes the app feel more personal.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  Back
                </Button>
                <Button
                  onClick={handleGetStarted}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  {name.trim() ? "Let's Begin" : 'Skip'}
                </Button>
              </div>
            </div>
          )}

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {[1, 2, 3].map((dot) => (
              <div
                key={dot}
                className={`w-2 h-2 rounded-full transition-all ${
                  dot === step
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 w-6'
                    : 'bg-purple-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Bottom Text */}
        <p className="text-center text-sm text-slate-500 mt-6">
          By continuing, you agree to keep this space safe and use it responsibly.
        </p>
      </div>
    </div>
  );
}
