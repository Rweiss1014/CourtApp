import { useState } from 'react';
import { RecordType } from '../App';
import { Search, Filter, Calendar, Tag, MapPin, Trash2, Download, Users, AlertCircle, FileText } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { pdfExport } from '../lib/pdfExport';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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

function formatDateLong(dateString: string) {
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

export function RecordsList({
  records,
  onDelete,
  onUpdate,
  isDecoyMode,
}: {
  records: RecordType[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<RecordType>) => void;
  isDecoyMode: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [onlyWithAttachments, setOnlyWithAttachments] = useState(false);
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'tag'>('date-desc');
  const [selectedRecord, setSelectedRecord] = useState<RecordType | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  // Get all unique tags
  const allTags = Array.from(
    new Set(records.flatMap(r => r.tags))
  ).sort();

  // Filter and sort records
  const filteredRecords = records
    .filter(record => {
      const matchesSearch =
        searchQuery === '' ||
        record.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (record.people && record.people.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        (record.location && record.location.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTag = selectedTag === 'all' || record.tags.includes(selectedTag);
      const matchesSeverity = selectedSeverity === 'all' || record.severity?.toString() === selectedSeverity;
      const matchesAttachments = !onlyWithAttachments || (record.files && record.files.length > 0);

      return matchesSearch && matchesTag && matchesSeverity && matchesAttachments;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime();
        case 'date-asc':
          return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
        case 'tag':
          return a.tags[0]?.localeCompare(b.tags[0] || '') || 0;
        default:
          return 0;
      }
    });

  const handleDeleteClick = (id: string) => {
    setRecordToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (recordToDelete) {
      onDelete(recordToDelete);
      setShowDeleteDialog(false);
      setRecordToDelete(null);
    }
  };

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-slate-900 mb-1">{isDecoyMode ? 'My Entries' : 'All Evidence'}</h1>
            <p className="text-slate-600">{filteredRecords.length} records found</p>
          </div>
          {!isDecoyMode && filteredRecords.length > 0 && (
            <Button
              onClick={async () => {
                try {
                  const today = new Date();
                  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                  const filename = `evidence-report-${dateStr}.pdf`;

                  // Convert records to PDF format
                  const convertedRecords = filteredRecords.map(record => ({
                    timestamp: new Date(record.dateTime).getTime(),
                    type: record.severity ? `Severity ${record.severity}` : 'Incident',
                    content: record.description,
                    tags: record.tags.join(','),
                    hash: record.contentHash || 'N/A',
                    files: record.files || [],
                    people: record.people,
                    location: record.location,
                  }));

                  await pdfExport.downloadReport(convertedRecords as any, filename, {
                    title: 'Evidence Report',
                    includeIntegrityHash: true
                  });
                } catch (error) {
                  console.error('Failed to generate PDF:', error);
                  alert('Failed to generate PDF report. Check console for details.');
                }
              }}
              size="sm"
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Download className="w-4 h-4 mr-1" />
              Export PDF
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-600 mb-1 block">Filter by Tag</label>
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger>
                <SelectValue placeholder="All tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tags</SelectItem>
                {allTags.map(tag => (
                  <SelectItem key={tag} value={tag}>#{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-slate-600 mb-1 block">Severity</label>
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                <SelectItem value="5">⚠️ Critical (5)</SelectItem>
                <SelectItem value="4">High (4)</SelectItem>
                <SelectItem value="3">Medium (3)</SelectItem>
                <SelectItem value="2">Low (2)</SelectItem>
                <SelectItem value="1">Minor (1)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-600 mb-1 block">Sort by</label>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest first</SelectItem>
                <SelectItem value="date-asc">Oldest first</SelectItem>
                <SelectItem value="tag">By category</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm cursor-pointer hover:bg-slate-50 w-full">
              <input
                type="checkbox"
                checked={onlyWithAttachments}
                onChange={(e) => setOnlyWithAttachments(e.target.checked)}
                className="rounded"
              />
              <FileText className="w-4 h-4" />
              Has files
            </label>
          </div>
        </div>
      </div>

      {/* Records List */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600">No records found</p>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const getSeverityColor = (severity?: number) => {
              if (!severity) return '';
              if (severity >= 4) return 'border-red-200 bg-red-50';
              if (severity === 3) return 'border-orange-200';
              return '';
            };
            
            return (
            <div
              key={record.id}
              className={`bg-white rounded-xl p-4 shadow-sm border ${getSeverityColor(record.severity) || 'border-slate-100'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm text-slate-500">
                    {formatDate(record.dateTime)}
                  </div>
                  {record.severity && (
                    <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
                      record.severity >= 4 ? 'bg-red-100 text-red-700' :
                      record.severity === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      <AlertCircle className="w-3 h-3" />
                      {record.severity}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedRecord(record)}
                    className="text-purple-600 hover:text-purple-700 text-sm"
                  >
                    View
                  </button>
                  {!isDecoyMode && (
                    <button
                      onClick={() => handleDeleteClick(record.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <p className="text-slate-900 mb-3 line-clamp-2">{record.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-2">
                {record.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {record.people && record.people.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-slate-600 mb-1">
                  <Users className="w-3 h-3" />
                  {record.people.join(', ')}
                </div>
              )}

              {record.location && (
                <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                  <MapPin className="w-3 h-3" />
                  {record.location}
                </div>
              )}

              {record.files && record.files.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded inline-flex">
                  📎 {record.files.length} attachment{record.files.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          )})
        )}
      </div>

      {/* Record Detail Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          {selectedRecord && (
            <>
              <DialogHeader>
                <DialogTitle>Record Details</DialogTitle>
                <DialogDescription>
                  {formatDateLong(selectedRecord.dateTime)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {selectedRecord.severity && (
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    selectedRecord.severity >= 4 ? 'bg-red-50 border border-red-200' :
                    selectedRecord.severity === 3 ? 'bg-orange-50 border border-orange-200' :
                    'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <span className="text-sm">Severity Level</span>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">{selectedRecord.severity}/5</span>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm text-slate-600 mb-1">Description</h4>
                  <p className="text-slate-900">{selectedRecord.description}</p>
                </div>

                <div>
                  <h4 className="text-sm text-slate-600 mb-2">Categories (Hashtags)</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecord.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedRecord.people && selectedRecord.people.length > 0 && (
                  <div>
                    <h4 className="text-sm text-slate-600 mb-2">People Involved</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecord.people.map((person) => (
                        <span
                          key={person}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm"
                        >
                          <Users className="w-3 h-3" />
                          {person}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRecord.location && (
                  <div>
                    <h4 className="text-sm text-slate-600 mb-1">Location</h4>
                    <div className="flex items-center gap-1 text-slate-900">
                      <MapPin className="w-4 h-4" />
                      {selectedRecord.location}
                    </div>
                  </div>
                )}

                {selectedRecord.files && selectedRecord.files.length > 0 && (
                  <div>
                    <h4 className="text-sm text-slate-600 mb-2">Evidence Attachments</h4>
                    <div className="space-y-2">
                      {selectedRecord.files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between bg-purple-50 rounded-lg px-3 py-2 border border-purple-100"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-700">{file.name}</span>
                            <span className="text-xs text-slate-500">({file.type})</span>
                          </div>
                          <a
                            href={file.url}
                            download={file.name}
                            className="text-purple-600 hover:text-purple-700 text-sm"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-slate-500 pt-2 border-t border-slate-200 space-y-1">
                  <div>Created: {formatDateLong(selectedRecord.createdAt)}</div>
                  {selectedRecord.editedAt && (
                    <div>Last edited: {formatDateLong(selectedRecord.editedAt)}</div>
                  )}
                  {selectedRecord.contentHash && (
                    <div className="font-mono text-xs">Hash: {selectedRecord.contentHash.slice(0, 16)}...</div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setSelectedRecord(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Record?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This record will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
