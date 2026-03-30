'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { usePanelStore } from '@/store/panelStore';
import { useUserStore } from '@/store/userStore';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuthStore();
  const { panels, updatePanel } = usePanelStore();
  const { addUser } = useUserStore();
  const router = useRouter();
  const passwordMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim());
      const availablePanel = panels.find((panel) => !panel.ownerEmail);
      const assignedPanelId = availablePanel?.id;
      if (availablePanel) {
        await updatePanel(availablePanel.id, {
          name: `${name.trim()} 패널`,
          ownerEmail: email.trim(),
        });
      }
      await addUser({
        name: name.trim(),
        email: email.trim(),
        role: 'user',
        panelId: assignedPanelId,
      });
      router.push('/');
    } catch (err: any) {
      setError(err.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Hizzi Board 회원가입</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">이름</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-[#81D8D0] focus:border-[#81D8D0] focus:z-10 sm:text-sm"
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">이메일 주소</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#81D8D0] focus:border-[#81D8D0] focus:z-10 sm:text-sm"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">비밀번호</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#81D8D0] focus:border-[#81D8D0] focus:z-10 sm:text-sm"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">비밀번호 확인</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-[#81D8D0] focus:border-[#81D8D0] focus:z-10 sm:text-sm"
                placeholder="비밀번호 확인"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#81D8D0] hover:bg-[#6BC4BB] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81D8D0] disabled:opacity-50"
              disabled={loading || !passwordMatch}
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
            {!passwordMatch && confirmPassword && (
              <p className="text-red-500 text-xs mt-1">비밀번호가 일치하지 않습니다.</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}