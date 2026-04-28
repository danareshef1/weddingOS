'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Message = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS: Record<string, string[]> = {
  en: [
    'Suggest a full wedding day timeline',
    'Which vendors am I still missing?',
    'How many tables do I need?',
    'What should I be doing 3 months before the wedding?',
    'How much alcohol should I order?',
    'Build me a checklist for the week before the wedding',
  ],
  he: [
    'הצע לוח זמנים מלא ליום החתונה',
    'אילו ספקים עדיין חסרים לי?',
    'כמה שולחנות אני צריך?',
    'מה כדאי לעשות 3 חודשים לפני החתונה?',
    'כמה אלכוהול להזמין?',
    'בנה לי רשימת בדיקה לשבוע לפני החתונה',
  ],
};

export default function AiPlannerPage() {
  const params = useParams();
  const locale = (params.locale as string) ?? 'en';
  const t = useTranslations('dashboard');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const suggestions = SUGGESTIONS[locale] ?? SUGGESTIONS.en;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: 'user', content: trimmed };
    const history = [...messages, userMsg];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          locale,
        }),
      });

      if (!res.ok || !res.body) throw new Error('request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setMessages([...history, { role: 'assistant', content: reply }]);
      }
    } catch {
      const errMsg =
        locale === 'he' ? 'אירעה שגיאה. אנא נסה שוב.' : 'Something went wrong. Please try again.';
      setMessages([...history, { role: 'assistant', content: errMsg }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50">
          <Sparkles className="h-5 w-5 text-rose-500" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold">{t('aiPlanner')}</h1>
          <p className="text-sm text-muted-foreground">{t('aiPlannerSubtitle')}</p>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto rounded-xl border bg-gray-50 p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 pb-8">
            <div className="text-center">
              <div className="mb-3 text-5xl">✨</div>
              <p className="max-w-sm text-sm text-muted-foreground">{t('aiPlannerEmpty')}</p>
            </div>
            <div className="flex max-w-lg flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="rounded-full border bg-white px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-rose-300 hover:text-rose-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.role === 'assistant' && (
                  <div className="me-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100">
                    <Sparkles className="h-3.5 w-3.5 text-rose-600" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                    msg.role === 'user'
                      ? 'rounded-ee-sm bg-rose-500 text-white'
                      : 'rounded-es-sm border bg-white text-gray-800 shadow-sm',
                    msg.role === 'assistant' && !msg.content && 'min-w-[3rem] animate-pulse',
                  )}
                >
                  {msg.content || (msg.role === 'assistant' ? '…' : '')}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input row */}
      <div className="flex items-end gap-2">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('aiPlannerInputPlaceholder')}
          disabled={loading}
          className="flex-1 resize-none rounded-xl border bg-white px-4 py-3 text-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-50"
          style={{ maxHeight: 120 }}
        />
        <Button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="h-11 w-11 shrink-0 rounded-xl p-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
