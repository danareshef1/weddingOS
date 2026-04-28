'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { createTodo, updateTodoStatus, deleteTodo } from '@/actions/todos';
import { Plus, Trash2, Loader2, Circle, Clock, CheckCircle2, ListChecks } from 'lucide-react';

type Status = 'todo' | 'in_progress' | 'done';

type TodoItem = {
  id: string;
  title: string;
  status: Status;
  createdAt: string;
};

const STATUSES: {
  value: Status;
  labelKey: string;
  icon: React.ElementType;
  pill: string;
  dot: string;
}[] = [
  {
    value: 'todo',
    labelKey: 'todoStatusTodo',
    icon: Circle,
    pill: 'bg-gray-100 text-gray-600',
    dot: 'bg-gray-300',
  },
  {
    value: 'in_progress',
    labelKey: 'todoStatusInProgress',
    icon: Clock,
    pill: 'bg-amber-50 text-amber-700',
    dot: 'bg-amber-400',
  },
  {
    value: 'done',
    labelKey: 'todoStatusDone',
    icon: CheckCircle2,
    pill: 'bg-green-50 text-green-700',
    dot: 'bg-green-500',
  },
];

function statusMeta(s: Status) {
  return STATUSES.find((x) => x.value === s)!;
}

export default function TodosPage() {
  const t = useTranslations('dashboard');
  const inputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<'all' | Status>('all');

  useEffect(() => {
    fetch('/api/todos')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    const item = await createTodo(title);
    setItems((prev) => [item as TodoItem, ...prev]);
    setNewTitle('');
    setAdding(false);
    inputRef.current?.focus();
  }

  async function handleStatus(id: string, status: Status) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    await updateTodoStatus(id, status);
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await deleteTodo(id);
  }

  const counts = {
    all: items.length,
    todo: items.filter((i) => i.status === 'todo').length,
    in_progress: items.filter((i) => i.status === 'in_progress').length,
    done: items.filter((i) => i.status === 'done').length,
  };
  const filtered = filter === 'all' ? items : items.filter((i) => i.status === filter);
  const doneCount = counts.done;
  const total = counts.all;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">{t('todosTitle')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {doneCount} / {total} {t('todosDoneOf')}
          </p>
        </div>

        {/* Progress ring */}
        {total > 0 && (
          <div className="relative flex h-14 w-14 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="#f3f4f6" strokeWidth="4" />
              <circle
                cx="24" cy="24" r="20" fill="none"
                stroke="#f43f5e" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <span className="text-xs font-semibold text-gray-700">{progress}%</span>
          </div>
        )}
      </div>

      {/* Add input */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Plus className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={t('todosPlaceholder')}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 ps-10 pe-4 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={adding || !newTitle.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-600 disabled:opacity-50"
        >
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {t('todosAdd')}
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'todo', 'in_progress', 'done'] as const).map((f) => {
          const labelKey = f === 'all' ? 'todosAll' : statusMeta(f).labelKey;
          const active = filter === f;
          const meta = f !== 'all' ? statusMeta(f) : null;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                active
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {meta && (
                <span className={`h-2 w-2 rounded-full ${active ? 'bg-white/70' : meta.dot}`} />
              )}
              {t(labelKey as any)}
              <span className={`rounded-full px-1.5 text-xs ${active ? 'bg-white/20' : 'bg-gray-200 text-gray-500'}`}>
                {counts[f]}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <ListChecks className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-400">{t('todosEmpty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const meta = statusMeta(item.status);
            const Icon = meta.icon;
            const done = item.status === 'done';
            return (
              <div
                key={item.id}
                className={`group flex items-center gap-4 rounded-2xl border bg-white px-5 py-4 shadow-sm transition-all hover:shadow-md ${
                  done ? 'border-gray-100 opacity-60' : 'border-gray-100'
                }`}
              >
                {/* Status icon — click to cycle */}
                <button
                  onClick={() => {
                    const idx = STATUSES.findIndex((s) => s.value === item.status);
                    const next = STATUSES[(idx + 1) % STATUSES.length].value;
                    handleStatus(item.id, next);
                  }}
                  className="shrink-0 transition-transform hover:scale-110"
                  title={t(meta.labelKey as any)}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      item.status === 'todo'
                        ? 'text-gray-300'
                        : item.status === 'in_progress'
                        ? 'text-amber-400'
                        : 'text-green-500'
                    }`}
                  />
                </button>

                {/* Title */}
                <p
                  className={`flex-1 text-sm font-medium ${
                    done ? 'text-gray-400 line-through' : 'text-gray-800'
                  }`}
                >
                  {item.title}
                </p>

                {/* Status badge */}
                <span className={`hidden shrink-0 rounded-full px-3 py-1 text-xs font-medium sm:block ${meta.pill}`}>
                  {t(meta.labelKey as any)}
                </span>

                {/* Status select (mobile) */}
                <select
                  value={item.status}
                  onChange={(e) => handleStatus(item.id, e.target.value as Status)}
                  className="block shrink-0 rounded-lg border-0 bg-gray-50 px-2 py-1 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-200 sm:hidden"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{t(s.labelKey as any)}</option>
                  ))}
                </select>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="shrink-0 rounded-lg p-1.5 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
