export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '4rem', margin: '0 0 1rem 0' }}>404</h1>
      <h2 style={{ margin: '0 0 1rem 0' }}>Page Not Found</h2>
      <p style={{ margin: '0 0 2rem 0' }}>
        The page you're looking for doesn't exist.
      </p>
      <a
        href="/"
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#0070f3',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
        }}
      >
        Go Home
      </a>
    </div>
  );
}
