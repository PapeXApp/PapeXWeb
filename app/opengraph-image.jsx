import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'PapeX - Digital Receipts Revolutionized';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

// Real brand assets, served from the live site (next/og fetches remote images).
const WORDMARK = 'https://papex.app/logos/main_logo.png'; // white "PapeX" + orange plane, for dark bg

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0a3d62 0%, #114e78 52%, #1e6491 100%)',
          padding: '70px 80px',
          fontFamily: 'sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* soft orange glow accent, top-right */}
        <div
          style={{
            position: 'absolute',
            top: -180,
            right: -140,
            width: 560,
            height: 560,
            borderRadius: 560,
            background:
              'radial-gradient(circle, rgba(255,153,51,0.40) 0%, rgba(255,153,51,0) 70%)',
            display: 'flex',
          }}
        />
        {/* subtle blue glow, bottom-left */}
        <div
          style={{
            position: 'absolute',
            bottom: -220,
            left: -160,
            width: 560,
            height: 560,
            borderRadius: 560,
            background:
              'radial-gradient(circle, rgba(208,228,244,0.18) 0%, rgba(208,228,244,0) 70%)',
            display: 'flex',
          }}
        />

        {/* centered hero: real PapeX wordmark + tagline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img src={WORDMARK} width={700} height={314} />
          <div
            style={{
              display: 'flex',
              marginTop: 16,
              fontSize: 48,
              color: '#cfe3f3',
              fontWeight: 500,
              textAlign: 'center',
            }}
          >
            Digital Receipts, Revolutionized.
          </div>
          {/* accent underline */}
          <div
            style={{
              display: 'flex',
              marginTop: 36,
              width: 220,
              height: 8,
              borderRadius: 8,
              background: '#ff9933',
            }}
          />
        </div>
      </div>
    ),
    size
  );
}
