'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { deleteDocument } from '@/actions/documents';
import { Upload, Trash2, Download, FileText, FileImage, File, Loader2 } from 'lucide-react';

type Doc = {
  id: string;
  name: string;
  url: string;
  fileType: string;
  size: number;
  category: string;
  notes: string | null;
  createdAt: string;
};

function categoryColor(value: string) {
  const map: Record<string, string> = {
    contract: 'bg-blue-100 text-blue-700',
    deposit: 'bg-amber-100 text-amber-700',
    invoice: 'bg-purple-100 text-purple-700',
    receipt: 'bg-green-100 text-green-700',
    other: 'bg-gray-100 text-gray-600',
  };
  return map[value] ?? map.other;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ fileType }: { fileType: string }) {
  if (fileType.startsWith('image/')) return <FileImage className="h-5 w-5 text-rose-400" />;
  if (fileType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
  return <File className="h-5 w-5 text-gray-400" />;
}

export default function DocumentsPage() {
  const t = useTranslations('dashboard');

  const CATEGORIES = [
    { value: 'contract', label: t('documentsContract') },
    { value: 'deposit', label: t('documentsDeposit') },
    { value: 'invoice', label: t('documentsInvoice') },
    { value: 'receipt', label: t('documentsReceipt') },
    { value: 'other', label: t('documentsOther') },
  ];

  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('other');
  const [notes, setNotes] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function fetchDocs() {
    const res = await fetch('/api/upload-document/list');
    if (res.ok) setDocs(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchDocs(); }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const form = new FormData();
    form.append('file', file);
    form.append('category', category);
    form.append('notes', notes);
    const res = await fetch('/api/upload-document', { method: 'POST', body: form });
    if (res.ok) {
      const doc = await res.json();
      setDocs((prev) => [doc, ...prev]);
      setNotes('');
    } else {
      const body = await res.json().catch(() => ({}));
      setUploadError(body.error ?? `Upload failed (${res.status})`);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleDelete(id: string) {
    await deleteDocument(id);
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  const categoryLabel = (value: string) =>
    CATEGORIES.find((c) => c.value === value)?.label ?? value;

  const filtered = filter === 'all' ? docs : docs.filter((d) => d.category === filter);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold">{t('documentsTitle')}</h1>

      {/* Upload area */}
      <Card className="border-2 border-dashed border-rose-200 bg-rose-50/30">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    {t('documentsCategory')}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-[2]">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    {t('documentsNotes')}
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('documentsNotesPlaceholder')}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                </div>
              </div>
            </div>
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="shrink-0 bg-rose-500 hover:bg-rose-600"
            >
              {uploading
                ? <Loader2 className="me-2 h-4 w-4 animate-spin" />
                : <Upload className="me-2 h-4 w-4" />}
              {uploading ? t('documentsUploading') : t('documentsUpload')}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="*/*"
              className="hidden"
              onChange={handleUpload}
            />
          </div>
          <p className="mt-2 text-xs text-gray-400">{t('documentsSupports')}</p>
          {uploadError && (
            <p className="mt-2 text-sm text-red-600">{uploadError}</p>
          )}
        </CardContent>
      </Card>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            filter === 'all' ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('documentsAll')} ({docs.length})
        </button>
        {CATEGORIES.map((c) => {
          const count = docs.filter((d) => d.category === c.value).length;
          if (count === 0) return null;
          return (
            <button
              key={c.value}
              onClick={() => setFilter(c.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === c.value ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Document list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <File className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-gray-500">{t('documentsEmpty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((doc) => (
            <Card key={doc.id} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                  <FileIcon fileType={doc.fileType} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{doc.name}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColor(doc.category)}`}>
                      {categoryLabel(doc.category)}
                    </span>
                    <span className="text-xs text-gray-400">{formatSize(doc.size)}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {doc.notes && (
                    <p className="mt-1 truncate text-xs text-gray-500">{doc.notes}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <a href={doc.url} download={doc.name} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-400 hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
