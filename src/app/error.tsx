'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">오류가 발생했습니다</h2>
        <p className="text-gray-600 mb-4">문제가 발생했습니다. 다시 시도해 주세요.</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-[#C17B6B] text-white rounded hover:bg-[#A86855]"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}