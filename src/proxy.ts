import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  // Generate a random cryptographic nonce per request (Base64)
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // Strict Content-Security-Policy with strict-dynamic and nonce, no unsafe-eval, no wildcards
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.youtube.com https://s.ytimg.com https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' 'nonce-${nonce}' https://fonts.googleapis.com https://cdn.jsdelivr.net;
    img-src 'self' data: blob: https://res.cloudinary.com https://api.dicebear.com https://qr.sepay.vn https://i.ytimg.com https://s.ytimg.com https://img.youtube.com https://i.vimeocdn.com https://*.googleusercontent.com https://nqd-lms-be.onrender.com http://localhost:8080 https://images.unsplash.com https://*.100ms.live;
    font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net;
    connect-src 'self' https://nqd-lms-be.onrender.com http://localhost:8080 wss://nqd-lms-be.onrender.com ws://localhost:8080 https://api.cloudinary.com https://api.dicebear.com https://qr.sepay.vn https://*.100ms.live wss://*.100ms.live https://cdn.jsdelivr.net https://www.youtube.com;
    media-src 'self' data: blob: https://nqd-lms-be.onrender.com http://localhost:8080 https://res.cloudinary.com https://*.youtube.com https://*.googlevideo.com https://*.vimeocdn.com https://*.100ms.live;
    frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://small-forest-267978.app.100ms.live https://*.100ms.live;
    frame-ancestors 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self' https://nqd-lms-be.onrender.com;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icon.png|logo.png|logo.jpg).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
