import { RecordType } from '../App';
import { Calendar, Tag, MapPin, TrendingUp, Users, AlertCircle } from 'lucide-react';

export function Dashboard({ records, userName, isDecoyMode }: { records: RecordType[]; userName: string | null; isDecoyMode: boolean }) {
  const currentMonth = new Date();
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  const thisMonthRecords = records.filter(r => {
    const recordDate = new Date(r.dateTime);
    return recordDate >= monthStart && recordDate <= monthEnd;
  });

  const recentRecords = records.slice(0, 5);

  // Count records by tag
  const tagCounts = records.reduce((acc, record) => {
    record.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-slate-900 mb-1">
          {isDecoyMode ? 'My Journal' : userName ? `Welcome back, ${userName}` : 'Record Keeper'}
        </h1>
        <p className="text-slate-600">
          {isDecoyMode ? 'Personal notes and reflections' : 'Document incidents with confidence'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-600 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">This Month</span>
          </div>
          <div className="text-slate-900">{thisMonthRecords.length}</div>
          <p className="text-xs text-slate-500 mt-1">Records logged</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-600 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Total</span>
          </div>
          <div className="text-slate-900">{records.length}</div>
          <p className="text-xs text-slate-500 mt-1">All records</p>
        </div>
      </div>

      {/* Top Tags */}
      {topTags.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-slate-600" />
            <h3 className="text-slate-900">Top Categories</h3>
          </div>
          <div className="space-y-2">
            {topTags.map(([tag, count]) => (
              <div key={tag} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{tag}</span>
                <span className="text-sm text-slate-500">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Records */}
      <div className="mb-6">
        <h3 className="text-slate-900 mb-3">Recent Records</h3>
        {recentRecords.length === 0 ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 mb-1">No records yet</p>
            <p className="text-sm text-slate-500">
              Tap the + button to create your first record
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentRecords.map((record) => (
              <RecordCard key={record.id} record={record} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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

function RecordCard({ record }: { record: RecordType }) {
  const getSeverityColor = (severity?: number) => {
    if (!severity) return 'bg-slate-100';
    if (severity <= 2) return 'bg-yellow-100 border-yellow-300';
    if (severity === 3) return 'bg-orange-100 border-orange-300';
    return 'bg-red-100 border-red-300';
  };

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border ${record.severity && record.severity >= 4 ? 'border-red-200' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="text-sm text-slate-500">
          {formatDate(record.dateTime)}
        </div>
        <div className="flex items-center gap-2">
          {record.severity && (
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${getSeverityColor(record.severity)}`}>
              <AlertCircle className="w-3 h-3" />
              {record.severity}
            </div>
          )}
          {record.files && record.files.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
              📎 {record.files.length}
            </div>
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
        <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
          <Users className="w-3 h-3" />
          {record.people.join(', ')}
        </div>
      )}

      {record.location && (
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="w-3 h-3" />
          {record.location}
        </div>
      )}
    </div>
  );
}
