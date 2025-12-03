'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth-service';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      console.error('Google Auth Error:', error);
      router.push('/login?error=GoogleAuthFailed');
      return;
    }

    if (code) {
      authService
        .exchangeGoogleCode(code)
        .then(() => {
          window.location.href = '/';
        })
        .catch((err) => {
          console.error('Token exchange failed:', err);
          router.push('/login?error=TokenExchangeFailed');
        });
    } else {
      console.error('Google Auth Failed: No code found');
      router.push('/login?error=GoogleAuthFailed');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Authenticating...</h2>
        <p className="text-muted-foreground">Please wait while we log you in.</p>
      </div>
    </div>
  );
}
