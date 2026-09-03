'use client';

import { useCallback, useEffect, useState } from 'react';

import type { User } from '@supabase/supabase-js';

import { createClient } from '@/shared/lib/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * AUTH-014: 인증을 마친 뒤 돌아갈 경로를 콜백 URL 에 실어 보낸다.
   * 콜백이 이 값을 읽어 원래 보던 화면으로 되돌린다.
   */
  const signInWithKakao = useCallback(async (nextPath?: string) => {
    const supabase = createClient();

    const callbackUrl = new URL('/auth/callback', window.location.origin);
    if (nextPath && nextPath !== '/') {
      callbackUrl.searchParams.set('next', nextPath);
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          scope: 'profile_nickname',
        },
      },
    });

    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  }, []);

  return {
    user,
    isLoggedIn: Boolean(user),
    isLoading,
    signInWithKakao,
    signOut,
  };
}
