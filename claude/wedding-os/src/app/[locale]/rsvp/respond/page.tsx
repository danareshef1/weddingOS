'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Heart, CheckCircle, XCircle, HelpCircle, Loader2 } from 'lucide-react';

type State =
  | { phase: 'loading' }
  | { phase: 'choose'; guestName: string; firstName: string; couple: string }
  | { phase: 'submitting' }
  | { phase: 'done'; answer: string; guestName: string; couple: string }
  | { phase: 'error'; message: string };

const ANSWERS = [
  { value: 'yes', label: 'כן, אגיע!', labelEn: "Yes, I'll be there!", icon: CheckCircle, color: 'bg-emerald-500 hover:bg-emerald-600' },
  { value: 'maybe', label: 'אולי', labelEn: 'Maybe', icon: HelpCircle, color: 'bg-amber-500 hover:bg-amber-600' },
  { value: 'no', label: 'לצערי לא אוכל', labelEn: "Can't make it", icon: XCircle, color: 'bg-gray-400 hover:bg-gray-500' },
] as const;

function doneMessage(answer: string) {
  if (answer === 'yes') return { he: 'תודה! אנחנו מצפים לראותך! ❤️', en: "Thank you! We can't wait to see you! ❤️" };
  if (answer === 'maybe') return { he: 'תודה שעדכנת! נשמח לשמוע ממך כשתדע בוודאות.', en: 'Thanks for letting us know! Hope you can make it.' };
  return { he: 'תודה שהודעת. נפספס אותך! 💙', en: "Thanks for letting us know. We'll miss you! 💙" };
}

function RsvpContent() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [state, setState] = useState<State>({ phase: 'loading' });

  useEffect(() => {
    if (!token) {
      setState({ phase: 'error', message: 'No RSVP token found in this link.' });
      return;
    }
    // Validate token against the server
    fetch(`/api/rsvp/respond?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Invalid link');
        setState({
          phase: 'choose',
          guestName: data.guestName,
          firstName: data.firstName,
          couple: data.weddingCouple,
        });
      })
      .catch((err) => {
        setState({ phase: 'error', message: err.message });
      });
  }, [token]);

  async function handleAnswer(answer: string) {
    if (state.phase !== 'choose') return;
    const { guestName, couple } = state;
    setState({ phase: 'submitting' });
    try {
      const res = await fetch('/api/rsvp/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, answer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error');
      setState({ phase: 'done', answer, guestName, couple });
    } catch (err) {
      setState({ phase: 'error', message: err instanceof Error ? err.message : 'Something went wrong.' });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-rose-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
          <Heart className="h-7 w-7 text-rose-500" />
        </div>

        {state.phase === 'loading' && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
            <p className="text-sm text-gray-400">טוען...</p>
          </div>
        )}

        {state.phase === 'choose' && (
          <>
            <h1 className="font-serif text-2xl font-bold text-gray-900">אישור הגעה</h1>
            <p className="mt-1 text-gray-400 text-sm">Wedding RSVP</p>
            {state.guestName && (
              <p className="mt-4 text-base text-gray-700">
                שלום <strong>{state.firstName}</strong> 👋
              </p>
            )}
            <p className="mt-2 text-gray-700">האם תוכל/י להגיע לחתונה?</p>
            <p className="text-sm text-gray-400">Will you be attending?</p>
            <div className="mt-8 flex flex-col gap-3">
              {ANSWERS.map(({ value, label, labelEn, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => handleAnswer(value)}
                  className={`flex items-center justify-center gap-3 rounded-xl px-6 py-4 text-white font-semibold text-lg transition-colors ${color}`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                  <span className="text-sm font-normal opacity-80">/ {labelEn}</span>
                </button>
              ))}
            </div>
            {state.couple && (
              <p className="mt-6 text-xs text-gray-300">— {state.couple}</p>
            )}
          </>
        )}

        {state.phase === 'submitting' && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
            <p className="text-gray-600">שומר את תשובתך...</p>
          </div>
        )}

        {state.phase === 'done' && (() => {
          const msg = doneMessage(state.answer);
          return (
            <>
              <div className="mb-4 flex justify-center">
                {state.answer === 'yes' ? (
                  <CheckCircle className="h-16 w-16 text-emerald-500" />
                ) : state.answer === 'maybe' ? (
                  <HelpCircle className="h-16 w-16 text-amber-500" />
                ) : (
                  <XCircle className="h-16 w-16 text-gray-400" />
                )}
              </div>
              <h1 className="font-serif text-2xl font-bold text-gray-900">
                {state.guestName ? `תודה, ${state.guestName.split(' ')[0]}!` : 'תודה!'}
              </h1>
              <p className="mt-3 text-gray-600">{msg.he}</p>
              <p className="mt-1 text-sm text-gray-400">{msg.en}</p>
              {state.couple && (
                <p className="mt-6 text-xs text-gray-300">— {state.couple}</p>
              )}
            </>
          );
        })()}

        {state.phase === 'error' && (
          <>
            <h1 className="font-serif text-xl font-bold text-gray-900">שגיאה</h1>
            <p className="mt-3 text-gray-500">{state.message}</p>
            <p className="mt-1 text-sm text-gray-400">This RSVP link may be invalid or expired.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function RsvpRespondPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-rose-50">
          <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
        </div>
      }
    >
      <RsvpContent />
    </Suspense>
  );
}
