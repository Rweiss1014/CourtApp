import { useState, useEffect } from 'react';
import { RecordType, AttachmentType } from '../App';
import { Calendar, Tag, MapPin, Paperclip, X, Mic, Users, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { DEFAULT_TAXONOMY, HashtagCategory } from '../lib/hashtagTaxonomy';

const TAG_KEYWORDS: Record<string, string[]> = {
  'PhysicalAbuse': ['hit', 'punch', 'slap', 'push', 'shove', 'kick', 'beat', 'struck', 'physical', 'grabbed', 'choked', 'assault', 'bruise', 'injury'],
  'Harassment': ['harass', 'threaten', 'intimidate', 'yell', 'scream', 'abuse'],
  'Threats': ['threat', 'warning', 'if you', 'or else', 'gonna', 'will make'],
  'FinancialControl': ['money', 'payment', 'child support', 'expense', 'financial', 'account', 'bank'],
  'DigitalAbuse': ['hack', 'password', 'account', 'phone', 'social media', 'spy', 'track'],
  'Stalking': ['follow', 'watching', 'stalking', 'showed up', 'parked outside'],
  'MissedVisitation': ['missed pick', 'didn\'t show', 'no show', 'cancelled', 'late pickup'],
  'LateDropoff': ['late drop', 'didn\'t return', 'kept overnight', 'late bringing'],
  'SchoolContactBlocked': ['school', 'teacher', 'principal', 'blocked', 'won\'t let me'],
  'MedicalNonCooperation': ['doctor', 'medical', 'appointment', 'won\'t share', 'refused to tell'],
  'MedicalNeglect': ['hospital', 'er', 'medicine', 'health', 'treatment', 'injury', 'sick'],
  'RecordRefusal': ['medical record', 'won\'t give', 'refused records', 'records request'],
  'MedsWithheld': ['medication', 'prescription', 'medicine', 'withheld', 'wouldn\'t give'],
  'ProviderConflict': ['doctor', 'provider', 'conflict', 'disagree', 'won\'t allow'],
  'NoResponse': ['no response', 'won\'t respond', 'ignore', 'unresponsive', 'didn\'t answer'],
  'RefusalToCoordinate': ['won\'t coordinate', 'refuse', 'won\'t work together', 'uncooperative'],
  'AbusiveLanguage': ['curse', 'name calling', 'verbal abuse', 'insult', 'swear'],
  'PropertyDamage': ['damage', 'broke', 'destroyed', 'vandal', 'smashed'],
  'PoliceReport': ['police', 'cops', 'officer', 'report', '911', 'called police'],
  'RestrainingOrder': ['restraining order', 'protective order', 'tro', 'violation'],
  'Texts': ['text', 'texted', 'sms', 'message'],
  'Email': ['email', 'sent email', 'received email'],
  'Voicemail': ['voicemail', 'voice mail', 'left message'],
  'Photo': ['photo', 'picture', 'image', 'screenshot'],
  'MedicalRecord': ['medical record', 'health record', 'doctor note'],
  'SchoolNote': ['school note', 'teacher email', 'principal letter'],
};

export function AddRecord({ onSave, isDecoyMode }: { onSave: (record: Omit<RecordType, 'id' | 'createdAt' | 'contentHash' | 'eventLog'>) => void; isDecoyMode: boolean }) {
  const [dateTime, setDateTime] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
    return localISOTime;
  });
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [people, setPeople] = useState<string[]>([]);
  const [personInput, setPersonInput] = useState('');
  const [location, setLocation] = useState('');
  const [severity, setSeverity] = useState<number>(3);
  const [files, setFiles] = useState<AttachmentType[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [taxonomy, setTaxonomy] = useState<HashtagCategory[]>(DEFAULT_TAXONOMY);

  // Load custom taxonomy from localStorage
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

  // Smart tag suggestions based on description
  const analyzeDescription = (text: string) => {
    const lowerText = text.toLowerCase();
    const suggestions: string[] = [];
    
    Object.entries(TAG_KEYWORDS).forEach(([tag, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        if (!selectedTags.includes(tag)) {
          suggestions.push(tag);
        }
      }
    });
    
    setSuggestedTags(suggestions.slice(0, 3));
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    if (value.length > 10) {
      analyzeDescription(value);
    } else {
      setSuggestedTags([]);
    }
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
    // Remove from suggestions if selected
    setSuggestedTags(suggestedTags.filter(t => t !== tag));
  };

  const handleAddCustomTag = () => {
    const formatted = customTag.trim().replace(/\s+/g, '');
    const withHash = formatted.startsWith('#') ? formatted : `#${formatted}`;
    if (formatted && !selectedTags.includes(withHash)) {
      setSelectedTags([...selectedTags, withHash]);
      setCustomTag('');
    }
  };

  const handleAddPerson = () => {
    if (personInput.trim() && !people.includes(personInput.trim())) {
      setPeople([...people, personInput.trim()]);
      setPersonInput('');
    }
  };

  const handleRemovePerson = (person: string) => {
    setPeople(people.filter(p => p !== person));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList) {
      const filePromises = Array.from(fileList).map(async (file) => {
        let type: AttachmentType['type'] = 'document';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type === 'application/pdf') type = 'pdf';
        else if (file.type.startsWith('audio/')) type = 'audio';
        else if (file.type.startsWith('video/')) type = 'video';

        // Convert file to data URL for persistent storage
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => resolve(URL.createObjectURL(file)); // Fallback to blob URL
          reader.readAsDataURL(file);
        });

        return {
          id: crypto.randomUUID(),
          name: file.name,
          url: dataUrl, // Now using data URL instead of blob URL
          type,
          source: 'files',
        };
      });

      const newFiles = await Promise.all(filePromises);
      setFiles([...files, ...newFiles]);
    }
  };

  const handleRemoveFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const handleVoiceInput = async () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const newText = description ? `${description} ${transcript}` : transcript;
        handleDescriptionChange(newText);
      };

      recognition.start();
    } else {
      alert('Voice input is not supported in this browser. Try Chrome or Safari.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDecoyMode) {
      // In decoy mode, just show success and reset
      alert('Entry saved');
      resetForm();
      return;
    }
    
    if (!description.trim() || selectedTags.length === 0) {
      alert('Please provide a description and at least one tag');
      return;
    }

    onSave({
      dateTime,
      description: description.trim(),
      tags: selectedTags,
      people: people.length > 0 ? people : undefined,
      location: location.trim() || undefined,
      severity,
      files: files.length > 0 ? files : undefined,
    });

    resetForm();
  };

  const resetForm = () => {
    setDescription('');
    setSelectedTags([]);
    setSuggestedTags([]);
    setPeople([]);
    setLocation('');
    setSeverity(3);
    setFiles([]);
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
    setDateTime(localISOTime);
  };

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-slate-900 mb-1">New Entry</h1>
        <p className="text-slate-600">Document with timestamp and tags</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date & Time */}
        <div>
          <Label className="flex items-center gap-2 mb-2 text-slate-700">
            <Calendar className="w-4 h-4" />
            Date & Time (Auto-stamped)
          </Label>
          <Input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="w-full"
            required
          />
        </div>

        {/* Description with Voice Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-slate-700">What Happened</Label>
            <Button
              type="button"
              onClick={handleVoiceInput}
              variant="ghost"
              size="sm"
              className={isRecording ? 'text-red-600' : 'text-slate-600'}
            >
              <Mic className={`w-4 h-4 mr-1 ${isRecording ? 'animate-pulse' : ''}`} />
              {isRecording ? 'Listening...' : 'Voice'}
            </Button>
          </div>
          <Textarea
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Be specific and factual. Include who, what, when, where..."
            className="w-full min-h-32 resize-none"
            required
          />
          <p className="text-xs text-slate-500 mt-1">
            💡 Tip: Write contemporaneous notes as soon after the event as possible
          </p>
        </div>

        {/* Smart Tag Suggestions */}
        {suggestedTags.length > 0 && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm text-blue-900 mb-2">✨ Suggested tags based on your entry:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className="px-3 py-1.5 rounded-full text-sm bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        <div>
          <Label className="flex items-center gap-2 mb-3 text-slate-700">
            <Tag className="w-4 h-4" />
            Categories (Hashtags)
          </Label>

          {/* Organized by category */}
          <div className="space-y-4 mb-4">
            {taxonomy.map((category) => (
              <div key={category.name}>
                <h4 className="text-xs text-slate-500 uppercase tracking-wide mb-2">{category.name}</h4>
                <div className="flex flex-wrap gap-2">
                  {category.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Selected tags display */}
          {selectedTags.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-100 mb-3">
              <p className="text-xs text-purple-900 mb-2">Selected tags:</p>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag}
                    className="bg-purple-600 text-white hover:bg-purple-700"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className="ml-1.5 hover:text-purple-200"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Custom tag input */}
          <div className="flex gap-2">
            <Input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              placeholder="Add custom #tag..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomTag();
                }
              }}
            />
            <Button
              type="button"
              onClick={handleAddCustomTag}
              variant="outline"
              disabled={!customTag.trim()}
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              Add
            </Button>
          </div>
        </div>

        {/* People Involved */}
        <div>
          <Label className="flex items-center gap-2 mb-2 text-slate-700">
            <Users className="w-4 h-4" />
            People Involved <span className="text-slate-500">(optional)</span>
          </Label>
          <div className="flex gap-2 mb-2">
            <Input
              type="text"
              value={personInput}
              onChange={(e) => setPersonInput(e.target.value)}
              placeholder="e.g., Parent A, Dr. Smith, Principal"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddPerson();
                }
              }}
            />
            <Button
              type="button"
              onClick={handleAddPerson}
              variant="outline"
              disabled={!personInput.trim()}
            >
              Add
            </Button>
          </div>
          {people.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {people.map((person) => (
                <span
                  key={person}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm"
                >
                  {person}
                  <button
                    type="button"
                    onClick={() => handleRemovePerson(person)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Severity Level */}
        <div>
          <Label className="flex items-center gap-2 mb-2 text-slate-700">
            <AlertCircle className="w-4 h-4" />
            Severity Level
          </Label>
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setSeverity(level)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  severity === level
                    ? level <= 2
                      ? 'bg-yellow-500 text-white scale-110'
                      : level === 3
                      ? 'bg-orange-500 text-white scale-110'
                      : 'bg-red-500 text-white scale-110'
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            1 = Minor concern, 5 = Critical/urgent
          </p>
        </div>

        {/* Location */}
        <div>
          <Label className="flex items-center gap-2 mb-2 text-slate-700">
            <MapPin className="w-4 h-4" />
            Location <span className="text-slate-500">(optional)</span>
          </Label>
          <Input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Where did this occur?"
            className="w-full"
          />
        </div>

        {/* File Upload */}
        <div>
          <Label className="flex items-center gap-2 mb-2 text-slate-700">
            <Paperclip className="w-4 h-4" />
            Evidence / Attachments <span className="text-slate-500">(optional)</span>
          </Label>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
            accept="image/*,.pdf,.doc,.docx,audio/*,video/*"
          />
          <label
            htmlFor="file-upload"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-purple-300 rounded-lg text-slate-600 hover:border-purple-400 hover:text-purple-600 transition-colors cursor-pointer"
          >
            <Paperclip className="w-5 h-5" />
            <span>Upload screenshots, scans, photos, or audio</span>
          </label>
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between bg-purple-50 rounded-lg px-3 py-2 border border-purple-100"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-700 truncate">{file.name}</span>
                    <Badge variant="outline" className="text-xs">{file.type}</Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(file.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
          Save Entry (Time-stamped & Hashed)
        </Button>

        <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
          <p className="text-xs text-purple-900">
            🔒 This entry will be cryptographically time-stamped and stored securely on your device.
          </p>
        </div>
      </form>
    </div>
  );
}
