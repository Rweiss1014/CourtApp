import { useState } from 'react';
import { Cloud, Mail, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { authService } from '../lib/cloud/authService';

interface CloudAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (email: string) => void;
}

export function CloudAuthDialog({ open, onOpenChange, onSuccess }: CloudAuthDialogProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsProcessing(true);

    try {
      if (isSignUp) {
        const { user, error: signUpError } = await authService.signUp(email, password);
        if (signUpError) {
          setError(signUpError);
        } else if (user) {
          onSuccess(user.email);
          onOpenChange(false);
          setEmail('');
          setPassword('');
          setConfirmPassword('');
        }
      } else {
        const { user, error: signInError } = await authService.signIn(email, password);
        if (signInError) {
          setError(signInError);
        } else if (user) {
          onSuccess(user.email);
          onOpenChange(false);
          setEmail('');
          setPassword('');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-600" />
            {isSignUp ? 'Create Cloud Account' : 'Sign In to Cloud'}
          </DialogTitle>
          <DialogDescription>
            {isSignUp
              ? 'Create an account to sync your data across devices'
              : 'Sign in to access your cloud-synced data'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-900">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <p className="text-sm text-blue-900 leading-relaxed">
              <strong>End-to-End Encrypted:</strong> Your data is encrypted on your device before
              upload. The server never sees your unencrypted data.
            </p>
          </div>

          <div>
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="pl-10 border-blue-200 focus:border-blue-400"
                disabled={isProcessing}
              />
            </div>
          </div>

          <div>
            <Label>Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="pl-10 border-blue-200 focus:border-blue-400"
                disabled={isProcessing}
              />
            </div>
          </div>

          {isSignUp && (
            <div>
              <Label>Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="pl-10 border-blue-200 focus:border-blue-400"
                  disabled={isProcessing}
                />
              </div>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
              disabled={isProcessing}
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
