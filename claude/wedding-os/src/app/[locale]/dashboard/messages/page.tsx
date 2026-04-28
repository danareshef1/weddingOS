'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Send,
  MessageSquare,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import {
  sendRsvpMessages,
  getGuestsWithMessageStatus,
  getMessageHistory,
  updateGuestRsvp,
} from '@/actions/messages';

type RsvpStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'MAYBE';
type Channel = 'SMS' | 'EMAIL' | 'WHATSAPP';

type Guest = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  rsvpStatus: RsvpStatus;
  messageSentAt: string | null;
  respondedAt: string | null;
};

type SendRecord = {
  id: string;
  body: string;
  channel: Channel;
  recipientCount: number;
  sentAt: string;
  successCount: number;
  failedCount: number;
};

const STATUS_CONFIG: Record<
  RsvpStatus,
  { label: string; icon: React.ElementType; cls: string }
> = {
  ACCEPTED: { label: 'Attending', icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700' },
  DECLINED: { label: 'Not Attending', icon: XCircle, cls: 'bg-red-100 text-red-700' },
  MAYBE: { label: 'Maybe', icon: HelpCircle, cls: 'bg-amber-100 text-amber-700' },
  PENDING: { label: 'No Response', icon: Clock, cls: 'bg-gray-100 text-gray-500' },
};

const CHANNEL_LABELS: Record<Channel, string> = {
  WHATSAPP: 'WhatsApp',
  SMS: 'SMS',
  EMAIL: 'Email',
};

const DEFAULT_BODY =
  'היי {FIRST_NAME}❤️,\n\nאנחנו שמחים להזמין אותך לחתונתנו!💍\nנשמח מאוד לדעת האם תוכל/י להגיע.\n\nאוהבים, דנה ורן🤍\n\nלחץ/י על הקישור הבא לאישור הגעה:\n{RSVP_LINK}';

function StatusBadge({ status }: { status: RsvpStatus }) {
  const { label, icon: Icon, cls } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function ChannelIcon({ channel }: { channel: Channel }) {
  if (channel === 'WHATSAPP') return <Phone className="h-3.5 w-3.5 text-emerald-600" />;
  if (channel === 'SMS') return <MessageSquare className="h-3.5 w-3.5 text-blue-600" />;
  return <Mail className="h-3.5 w-3.5 text-purple-600" />;
}

export default function MessagesPage() {
  const t = useTranslations('dashboard');

  const [guests, setGuests] = useState<Guest[]>([]);
  const [history, setHistory] = useState<SendRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [channel, setChannel] = useState<Channel>('WHATSAPP');
  const [filter, setFilter] = useState<RsvpStatus | 'ALL'>('ALL');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    const [g, h] = await Promise.all([getGuestsWithMessageStatus(), getMessageHistory()]);
    setGuests(
      g.map((guest) => ({
        ...guest,
        messageSentAt: guest.messageSentAt ? String(guest.messageSentAt) : null,
        respondedAt: guest.respondedAt ? String(guest.respondedAt) : null,
      }))
    );
    setHistory(h.map((r) => ({ ...r, channel: r.channel as Channel })));
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function handleSend() {
    setSendResult(null);
    setSending(true);
    try {
      const result = await sendRsvpMessages(body, channel);
      setSendResult(result);
      await refresh();
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(guestId: string, status: RsvpStatus) {
    setUpdatingId(guestId);
    await updateGuestRsvp(guestId, status);
    setGuests((prev) =>
      prev.map((g) =>
        g.id === guestId ? { ...g, rsvpStatus: status, respondedAt: new Date().toISOString() } : g
      )
    );
    setUpdatingId(null);
  }

  const pending = guests.filter((g) => g.rsvpStatus !== 'ACCEPTED');
  const attending = guests.filter((g) => g.rsvpStatus === 'ACCEPTED');
  const filteredGuests = filter === 'ALL' ? guests : guests.filter((g) => g.rsvpStatus === filter);

  const stats = [
    { label: 'Total', count: guests.length, color: 'text-gray-700' },
    { label: 'Attending', count: attending.length, color: 'text-emerald-600' },
    { label: 'Maybe', count: guests.filter((g) => g.rsvpStatus === 'MAYBE').length, color: 'text-amber-600' },
    { label: 'Declined', count: guests.filter((g) => g.rsvpStatus === 'DECLINED').length, color: 'text-red-600' },
    { label: 'No Response', count: guests.filter((g) => g.rsvpStatus === 'PENDING').length, color: 'text-gray-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold">{t('messages')}</h1>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`me-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Composer */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Compose RSVP Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Channel */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Channel</label>
                <div className="flex gap-2">
                  {(['WHATSAPP', 'SMS', 'EMAIL'] as Channel[]).map((ch) => (
                    <button
                      key={ch}
                      onClick={() => setChannel(ch)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        channel === ch
                          ? 'border-rose-400 bg-rose-50 text-rose-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <ChannelIcon channel={ch} />
                      {CHANNEL_LABELS[ch]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Message Text
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={9}
                  className="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-rose-300"
                  placeholder="Write your RSVP message..."
                />
                <p className="mt-1 text-xs text-gray-400">
                  Placeholders:{' '}
                  <code className="rounded bg-gray-100 px-1">{'{FIRST_NAME}'}</code>{' '}
                  <code className="rounded bg-gray-100 px-1">{'{NAME}'}</code>{' '}
                  <code className="rounded bg-gray-100 px-1">{'{RSVP_LINK}'}</code>
                </p>
              </div>

              {/* Recipients */}
              <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <strong>{pending.length}</strong> guest{pending.length !== 1 ? 's' : ''} will receive this message
                {attending.length > 0 && (
                  <span className="mt-0.5 block text-xs text-amber-600">
                    ({attending.length} already confirmed as Attending — excluded)
                  </span>
                )}
              </div>

              {/* Send */}
              <Button
                onClick={handleSend}
                disabled={sending || pending.length === 0 || !body.trim()}
                className="w-full bg-rose-500 hover:bg-rose-600"
              >
                {sending ? (
                  <><Loader2 className="me-2 h-4 w-4 animate-spin" />Sending...</>
                ) : (
                  <><Send className="me-2 h-4 w-4" />Send to {pending.length} guest{pending.length !== 1 ? 's' : ''}</>
                )}
              </Button>

              {sendResult && (
                <div
                  className={`rounded-lg px-4 py-3 text-sm ${
                    sendResult.failed > 0 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                  }`}
                >
                  ✓ Sent: <strong>{sendResult.sent}</strong>
                  {sendResult.failed > 0 && (
                    <span className="ml-3 text-red-600">✗ Failed: <strong>{sendResult.failed}</strong></span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Send history */}
          <Card>
            <CardHeader
              className="cursor-pointer select-none pb-3"
              onClick={() => setHistoryOpen((o) => !o)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Send History</CardTitle>
                {historyOpen ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </CardHeader>
            {historyOpen && (
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-sm text-gray-400">No messages sent yet.</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((r) => (
                      <div key={r.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <ChannelIcon channel={r.channel} />
                            <span className="font-medium text-gray-700">{CHANNEL_LABELS[r.channel]}</span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(r.sentAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">{r.body}</p>
                        <div className="mt-1.5 flex gap-3 text-xs">
                          <span className="text-emerald-600">✓ {r.successCount} sent</span>
                          {r.failedCount > 0 && (
                            <span className="text-red-500">✗ {r.failedCount} failed</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>

        {/* Guest list */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Guest RSVP Status</CardTitle>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(['ALL', 'PENDING', 'ACCEPTED', 'MAYBE', 'DECLINED'] as const).map((f) => {
                const count =
                  f === 'ALL' ? guests.length : guests.filter((g) => g.rsvpStatus === f).length;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      filter === f
                        ? 'bg-rose-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f === 'ALL' ? 'All' : STATUS_CONFIG[f].label} ({count})
                  </button>
                );
              })}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
              </div>
            ) : filteredGuests.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-sm text-gray-400">
                No guests found.
              </div>
            ) : (
              <div className="divide-y">
                {filteredGuests.map((guest) => (
                  <div
                    key={guest.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-semibold text-rose-600">
                      {guest.firstName[0]}{guest.lastName[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {guest.firstName} {guest.lastName}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        {guest.phone && (
                          <span className="flex items-center gap-0.5 text-xs text-gray-400">
                            <Phone className="h-3 w-3" />
                            {guest.phone}
                          </span>
                        )}
                        {guest.email && !guest.phone && (
                          <span className="flex items-center gap-0.5 text-xs text-gray-400">
                            <Mail className="h-3 w-3" />
                            {guest.email}
                          </span>
                        )}
                        {guest.messageSentAt && (
                          <span className="text-xs text-gray-300">· msg sent</span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={guest.rsvpStatus} />
                      <select
                        value={guest.rsvpStatus}
                        onChange={(e) =>
                          handleStatusChange(guest.id, e.target.value as RsvpStatus)
                        }
                        disabled={updatingId === guest.id}
                        className="rounded border border-gray-200 bg-white px-1 py-0.5 text-xs text-gray-500 focus:outline-none focus:ring-1 focus:ring-rose-300"
                      >
                        <option value="PENDING">No Response</option>
                        <option value="ACCEPTED">Attending</option>
                        <option value="MAYBE">Maybe</option>
                        <option value="DECLINED">Not Attending</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
