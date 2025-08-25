import React from 'react';

export default function MarketplacePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>Marketplace</h1>
        <p style={{ color: '#666', marginTop: '.25rem' }}>
          Buy and sell Dojo items, skins, and collectibles.
        </p>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        {Array.from({ length: 6 }).map((_, idx) => (
          <article
            key={idx}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: '1rem',
              background: 'white',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <div
              style={{
                width: '100%',
                height: 140,
                borderRadius: 6,
                background:
                  'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15))',
                marginBottom: '.75rem',
              }}
            />
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
              Sample Listing #{idx + 1}
            </h2>
            <p style={{ margin: '.25rem 0 .75rem', color: '#555' }}>$—</p>
            <button
              type="button"
              style={{
                padding: '.5rem .75rem',
                borderRadius: 6,
                border: '1px solid #1d4ed8',
                background: '#2563eb',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              View
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}
