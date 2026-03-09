'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ marginBottom: '1rem' }}>Something went wrong</h2>
      <button
        onClick={() => reset()}
        style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderRadius: '0.25rem', border: '1px solid #ccc' }}
      >
        Try again
      </button>
    </div>
  );
}
