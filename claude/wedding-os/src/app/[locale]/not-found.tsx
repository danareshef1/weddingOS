export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ marginBottom: '0.5rem' }}>404 — Page Not Found</h2>
      <a href="/" style={{ color: '#6366f1' }}>Go Home</a>
    </div>
  );
}
