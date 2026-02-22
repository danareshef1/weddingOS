'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

export function CsvImport() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const response = await fetch('/api/guests/import', {
        method: 'POST',
        body: text,
      });

      const data = await response.json();
      if (data.success) {
        setResult(`Imported ${data.imported} guests`);
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch {
      setResult('Import failed');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        onChange={handleImport}
        className="hidden"
        id="csv-import"
      />
      <Button
        variant="outline"
        size="sm"
        disabled={importing}
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="me-2 h-4 w-4" />
        {importing ? 'Importing...' : 'Import CSV'}
      </Button>
      {result && <p className="mt-2 text-sm text-muted-foreground">{result}</p>}
    </div>
  );
}
