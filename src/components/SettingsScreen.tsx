import { useState, useEffect } from 'react';
import { RecordType } from '../App';
import { Lock, Download, Trash2, Shield, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
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
import { DEFAULT_TAXONOMY } from '../lib/hashtagTaxonomy';
import { generateLawyerReadyReport } from '../lib/reportGenerator';
import { pdfExport } from '../lib/pdfExport';

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${month} ${day}, ${year} • ${hours}:${minutesStr} ${ampm}`;
}

export function SettingsScreen({
  records,
  pin,
  decoyPin,
  userName,
  onPinChange,
  onDecoyPinChange,
  onLockToggle,
  isDecoyMode,
}: {
  records: RecordType[];
  pin: string | null;
  decoyPin: string | null;
  userName: string | null;
  onPinChange: (pin: string) => void;
  onDecoyPinChange: (pin: string) => void;
  onLockToggle: (enabled: boolean) => void;
  isDecoyMode: boolean;
}) {
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [showDecoyPinDialog, setShowDecoyPinDialog] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [lockEnabled, setLockEnabled] = useState(
    localStorage.getItem('recordKeeper_lockEnabled') === 'true'
  );
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [caseLabel, setCaseLabel] = useState('');
  const [taxonomy, setTaxonomy] = useState(DEFAULT_TAXONOMY);

  useEffect(() => {
    const saved = localStorage.getItem('recordKeeper_taxonomy');
    if (saved) {
      try {
        setTaxonomy(JSON.parse(saved));
      } catch (e) {
        setTaxonomy(DEFAULT_TAXONOMY);
      }
    }
  }, []);

  const handleSetPin = () => {
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      alert('PIN must be 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      alert('PINs do not match');
      return;
    }
    if (decoyPin && newPin === decoyPin) {
      alert('Main PIN cannot be the same as decoy PIN');
      return;
    }
    onPinChange(newPin);
    setShowPinDialog(false);
    setNewPin('');
    setConfirmPin('');
    alert('Main PIN set successfully');
  };

  const handleSetDecoyPin = () => {
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      alert('PIN must be 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      alert('PINs do not match');
      return;
    }
    if (pin && newPin === pin) {
      alert('Decoy PIN cannot be the same as main PIN');
      return;
    }
    onDecoyPinChange(newPin);
    setShowDecoyPinDialog(false);
    setNewPin('');
    setConfirmPin('');
    alert('Decoy PIN set successfully. This PIN will show a blank journal for safety.');
  };

  const handleLockToggle = (enabled: boolean) => {
    if (enabled && !pin) {
      alert('Please set a PIN first');
      return;
    }
    setLockEnabled(enabled);
    onLockToggle(enabled);
  };

  const handleExportPDF = () => {
    // Show dialog to get case label
    setShowExportDialog(true);
  };

  const handleExportWithLabel = async () => {
    const label = caseLabel.trim() || 'Evidence Report';
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const caseLabelSlug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const filename = `${caseLabelSlug || 'evidence-report'}-${dateStr}.pdf`;

    try {
      // Convert RecordType to format expected by PDF export
      const convertedRecords = records.map(record => ({
        timestamp: new Date(record.dateTime).getTime(),
        type: record.severity ? `Severity ${record.severity}` : 'Incident',
        content: record.description,
        tags: record.tags.join(','),
        hash: record.contentHash || 'N/A',
        files: record.files || [],
        people: record.people,
        location: record.location,
      }));

      // Use PDF export service with images embedded
      await pdfExport.downloadReport(convertedRecords as any, filename, {
        title: label,
        includeIntegrityHash: true
      });

      setShowExportDialog(false);
      setCaseLabel('');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF report. Check console for details.');
    }
  };

  const handleExportJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      totalRecords: records.length,
      records: records,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    a.download = `record-keeper-data-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    localStorage.removeItem('recordKeeper_records');
    localStorage.removeItem('recordKeeper_pin');
    localStorage.removeItem('recordKeeper_lockEnabled');
    setShowClearDialog(false);
    window.location.reload();
  };

  const handleResetWelcome = () => {
    localStorage.removeItem('recordKeeper_welcomeCompleted');
    localStorage.removeItem('recordKeeper_userName');
    window.location.reload();
  };

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-slate-900 mb-1">Settings</h1>
        <p className="text-slate-600">Manage your data and security</p>
      </div>

      {/* Security Section */}
      <div className="mb-6">
        <h3 className="text-slate-900 mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security
        </h3>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100">
          <div className="p-4 flex items-center justify-between">
            <div>
              <Label className="text-slate-900">Main PIN</Label>
              <p className="text-sm text-slate-500 mt-1">
                {pin ? 'PIN is set ✓' : 'No PIN set'}
              </p>
            </div>
            <Button
              onClick={() => setShowPinDialog(true)}
              variant="outline"
              size="sm"
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              {pin ? 'Change' : 'Set PIN'}
            </Button>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div>
              <Label className="text-slate-900">Lock App</Label>
              <p className="text-sm text-slate-500 mt-1">
                Require PIN to open app
              </p>
            </div>
            <Switch
              checked={lockEnabled}
              onCheckedChange={handleLockToggle}
              disabled={!pin}
            />
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <Label className="text-slate-900 flex items-center gap-2">
                  Decoy PIN 
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Safety Feature</span>
                </Label>
                <p className="text-sm text-slate-500 mt-1">
                  {decoyPin ? 'Decoy PIN is set ✓' : 'Optional second PIN'}
                </p>
              </div>
              <Button
                onClick={() => setShowDecoyPinDialog(true)}
                variant="outline"
                size="sm"
                className="border-pink-200 text-pink-700 hover:bg-pink-50"
              >
                {decoyPin ? 'Change' : 'Set Up'}
              </Button>
            </div>
            <div className="bg-pink-50 rounded-lg p-3 border border-pink-100 mt-3">
              <p className="text-xs text-pink-900 leading-relaxed">
                💡 <strong>How it works:</strong> If you enter this PIN, the app opens with a blank journal for your safety. Your real records remain hidden.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Export Section */}
      <div className="mb-6">
        <h3 className="text-slate-900 mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Data Export
        </h3>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-slate-900">Lawyer-Ready Evidence Report</Label>
              <Download className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-sm text-slate-500 mb-3">
              Professional chronological report with UTC timestamps, integrity hashes, and appendix
            </p>
            <Button
              onClick={handleExportPDF}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              disabled={records.length === 0}
            >
              Generate Evidence Report
            </Button>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-slate-900">Export Raw Data</Label>
              <Download className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500 mb-3">
              Export all data in JSON format
            </p>
            <Button
              onClick={handleExportJSON}
              className="w-full"
              variant="outline"
              disabled={records.length === 0}
            >
              Export as JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="mb-6">
        <h3 className="text-slate-900 mb-3 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Data Management
        </h3>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-slate-900">Reset Welcome Screen</Label>
            </div>
            <p className="text-sm text-slate-500 mb-3">
              View the welcome screen again
            </p>
            <Button
              onClick={handleResetWelcome}
              variant="outline"
              className="w-full"
            >
              Reset Welcome
            </Button>
          </div>
          
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-slate-900">Clear All Data</Label>
              <Trash2 className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-sm text-slate-500 mb-3">
              Permanently delete all records and settings
            </p>
            <Button
              onClick={() => setShowClearDialog(true)}
              variant="destructive"
              className="w-full"
            >
              Clear All Data
            </Button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
        <h4 className="text-purple-900 mb-2">🔒 Privacy Notice</h4>
        <p className="text-sm text-purple-700 leading-relaxed">
          All data is stored locally on your device. No information is sent to external servers.
          Make sure to export your records regularly for backup.
        </p>
      </div>

      {/* Set Main PIN Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-600" />
              {pin ? 'Change Main PIN' : 'Set Main PIN'}
            </DialogTitle>
            <DialogDescription>
              Enter a 4-digit PIN to protect your records
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New PIN</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 4-digit PIN"
                className="border-purple-200 focus:border-purple-400"
              />
            </div>
            <div>
              <Label>Confirm PIN</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Re-enter PIN"
                className="border-purple-200 focus:border-purple-400"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPinDialog(false);
              setNewPin('');
              setConfirmPin('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleSetPin} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              Set Main PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Decoy PIN Dialog */}
      <Dialog open={showDecoyPinDialog} onOpenChange={setShowDecoyPinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-pink-600" />
              {decoyPin ? 'Change Decoy PIN' : 'Set Decoy PIN'}
            </DialogTitle>
            <DialogDescription>
              Create a safety PIN that opens a blank journal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-pink-50 rounded-lg p-3 border border-pink-100">
              <p className="text-sm text-pink-900 leading-relaxed">
                <strong>Safety Feature:</strong> If someone asks you to unlock the app, you can enter this PIN instead. The app will open with no records visible, keeping your evidence safe.
              </p>
            </div>
            <div>
              <Label>Decoy PIN</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 4-digit PIN"
                className="border-pink-200 focus:border-pink-400"
              />
            </div>
            <div>
              <Label>Confirm Decoy PIN</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Re-enter PIN"
                className="border-pink-200 focus:border-pink-400"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDecoyPinDialog(false);
              setNewPin('');
              setConfirmPin('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleSetDecoyPin} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
              Set Decoy PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Report Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Export Evidence Report
            </DialogTitle>
            <DialogDescription>
              Generate a lawyer-ready documentation report with timestamps and integrity hashes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Case Label (Optional)</Label>
              <Input
                type="text"
                value={caseLabel}
                onChange={(e) => setCaseLabel(e.target.value)}
                placeholder="e.g., Smith v. Jones, HR Case #2024-15"
                className="border-purple-200 focus:border-purple-400"
              />
              <p className="text-xs text-slate-500 mt-2">
                This will appear on the cover page of your report
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
              <p className="text-sm text-purple-900">
                <strong>Report will include:</strong>
              </p>
              <ul className="text-sm text-purple-800 mt-2 space-y-1 ml-4">
                <li>• Cover page with date range and integrity notes</li>
                <li>• Executive summary with top categories</li>
                <li>• Chronological entries with UTC timestamps</li>
                <li>• Appendix with integrity logs and file hashes</li>
                <li>• Tag glossary and legal notice</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowExportDialog(false);
              setCaseLabel('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleExportWithLabel} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              Export Report ({records.length} entries)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Data Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Data?</DialogTitle>
            <DialogDescription>
              This will permanently delete all {records.length} record{records.length !== 1 ? 's' : ''} and reset all settings.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearData}>
              Clear Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
