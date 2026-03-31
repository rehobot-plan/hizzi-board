'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FDF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', border: '1px solid #EDE5DC', padding: 40, width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2C1810' }}>
            HIZZI BOARD
          </div>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginTop: 6 }}>
            사내 게시판
          </div>
        </div>

        <div style={{ borderTop: '1px solid #EDE5DC', margin: '24px 0' }} />

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ fontSize: 11, color: '#C17B6B', marginBottom: 12, textAlign: 'center' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="이메일"
              required
              style={{
                width: '100%',
                border: 'none',
                borderBottom: '1px solid #EDE5DC',
                padding: '10px 0',
                fontSize: 13,
                color: '#2C1810',
                background: 'transparent',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호"
              required
              style={{
                width: '100%',
                border: 'none',
                borderBottom: '1px solid #EDE5DC',
                padding: '10px 0',
                fontSize: 13,
                color: '#2C1810',
                background: 'transparent',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 12,
              background: loading ? '#9E8880' : '#2C1810',
              color: '#FDF8F4',
              border: 'none',
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#9E8880' }}>
          계정이 없으신가요?{' '}
          <Link href="/signup" style={{ color: '#C17B6B', textDecoration: 'none' }}>
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
