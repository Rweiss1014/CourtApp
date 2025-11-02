import { useState, useEffect } from 'react';
import { Home, Plus, FileText, Settings } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { AddRecord } from './components/AddRecord';
import { RecordsList } from './components/RecordsList';
import { SettingsScreen } from './components/SettingsScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SignInScreen } from './components/SignInScreen';

export type AttachmentType = {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'pdf' | 'audio' | 'video' | 'document';
  source: 'scanner' | 'camera' | 'files';
  fileHash?: string;
  ocrText?: string;
};

export type RecordType = {
  id: string;
  dateTime: string;
  description: string;
  tags: string[];
  people?: string[];
  location?: string;
  severity?: number; // 1-5
  files?: AttachmentType[];
  createdAt: string;
  editedAt?: string;
  contentHash?: string;
  eventLog?: { timestamp: string; action: string }[];
};

type TabType = 'home' | 'add' | 'records' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [records, setRecords] = useState<RecordType[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [isDecoyMode, setIsDecoyMode] = useState(false);
  const [pin, setPin] = useState<string | null>(null);
  const [decoyPin, setDecoyPin] = useState<string | null>(null);
  const [hasCompletedWelcome, setHasCompletedWelcome] = useState(() => {
    return localStorage.getItem('recordKeeper_welcomeCompleted') === 'true';
  });
  const [userName, setUserName] = useState<string | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedRecords = localStorage.getItem('recordKeeper_records');
    const savedPin = localStorage.getItem('recordKeeper_pin');
    const savedDecoyPin = localStorage.getItem('recordKeeper_decoyPin');
    const lockEnabled = localStorage.getItem('recordKeeper_lockEnabled');
    const welcomeCompleted = localStorage.getItem('recordKeeper_welcomeCompleted');
    const savedUserName = localStorage.getItem('recordKeeper_userName');
    
    if (savedRecords) {
      setRecords(JSON.parse(savedRecords));
    }
    if (savedPin) {
      setPin(savedPin);
    }
    if (savedDecoyPin) {
      setDecoyPin(savedDecoyPin);
    }
    if (lockEnabled === 'true' && savedPin) {
      setIsLocked(true);
    }
    if (welcomeCompleted === 'true') {
      setHasCompletedWelcome(true);
    }
    if (savedUserName) {
      setUserName(savedUserName);
    }
  }, []);

  // Save records to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('recordKeeper_records', JSON.stringify(records));
  }, [records]);

  const addRecord = (record: Omit<RecordType, 'id' | 'createdAt' | 'contentHash' | 'eventLog'>) => {
    const timestamp = new Date().toISOString();
    const newRecord: RecordType = {
      ...record,
      id: crypto.randomUUID(),
      createdAt: timestamp,
      eventLog: [{ timestamp, action: 'created' }],
    };
    setRecords([newRecord, ...records]);
    setActiveTab('home');
  };

  const deleteRecord = (id: string) => {
    setRecords(records.filter(r => r.id !== id));
  };

  const updateRecord = (id: string, updates: Partial<RecordType>) => {
    setRecords(records.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleWelcomeComplete = (name?: string) => {
    localStorage.setItem('recordKeeper_welcomeCompleted', 'true');
    if (name) {
      localStorage.setItem('recordKeeper_userName', name);
      setUserName(name);
    }
    setHasCompletedWelcome(true);
  };

  console.log('hasCompletedWelcome:', hasCompletedWelcome);
  
  if (!hasCompletedWelcome) {
    return <WelcomeScreen onComplete={handleWelcomeComplete} />;
  }

  if (isLocked) {
    return (
      <SignInScreen
        onComplete={(enteredPin, onError) => {
          if (enteredPin === pin) {
            setIsLocked(false);
            setIsDecoyMode(false);
          } else if (decoyPin && enteredPin === decoyPin) {
            setIsLocked(false);
            setIsDecoyMode(true);
          } else {
            // Show error animation
            onError();
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Main Content */}
      <div className="max-w-md mx-auto">
        {activeTab === 'home' && <Dashboard records={isDecoyMode ? [] : records} userName={userName} isDecoyMode={isDecoyMode} />}
        {activeTab === 'add' && <AddRecord onSave={addRecord} isDecoyMode={isDecoyMode} />}
        {activeTab === 'records' && (
          <RecordsList
            records={isDecoyMode ? [] : records}
            onDelete={deleteRecord}
            onUpdate={updateRecord}
            isDecoyMode={isDecoyMode}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsScreen
            records={records}
            pin={pin}
            decoyPin={decoyPin}
            userName={userName}
            onPinChange={(newPin) => {
              setPin(newPin);
              localStorage.setItem('recordKeeper_pin', newPin);
            }}
            onDecoyPinChange={(newDecoyPin) => {
              setDecoyPin(newDecoyPin);
              localStorage.setItem('recordKeeper_decoyPin', newDecoyPin);
            }}
            onLockToggle={(enabled) => {
              localStorage.setItem('recordKeeper_lockEnabled', enabled.toString());
              if (!enabled) {
                setIsLocked(false);
              }
            }}
            isDecoyMode={isDecoyMode}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-bottom">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-around h-16">
            <TabButton
              icon={<Home className="w-6 h-6" />}
              label="Home"
              active={activeTab === 'home'}
              onClick={() => setActiveTab('home')}
            />
            <TabButton
              icon={<Plus className="w-6 h-6" />}
              label="Add"
              active={activeTab === 'add'}
              onClick={() => setActiveTab('add')}
            />
            <TabButton
              icon={<FileText className="w-6 h-6" />}
              label="Records"
              active={activeTab === 'records'}
              onClick={() => setActiveTab('records')}
            />
            <TabButton
              icon={<Settings className="w-6 h-6" />}
              label="Settings"
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ icon, label, active, onClick }: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
        active ? 'text-blue-600' : 'text-slate-400'
      }`}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}


