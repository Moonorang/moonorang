import type { User } from '@supabase/supabase-js';

/**
 * 화면에서 사용자를 부를 이름.
 * 비회원도 쓰는 화면이 있으므로(TEST-009) 이름이 없으면 "회원"으로 부른다.
 */
export function getDisplayName(user: User | null): string {
  const metadata = user?.user_metadata ?? {};
  const candidate = [metadata.name, metadata.nickname].find(
    (value) => typeof value === 'string' && value.trim() !== '',
  );

  return typeof candidate === 'string' ? candidate : '회원';
}
