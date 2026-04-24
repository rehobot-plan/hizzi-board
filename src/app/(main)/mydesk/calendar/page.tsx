// 블록 ⑤ (세션 #70) — 달력은 패널 피어 탭으로 이관. 기존 deep link / bookmark / history 보호를 위한 legacy redirect.
import { redirect } from 'next/navigation';

export default function LegacyCalendarRedirect() {
  redirect('/');
}
