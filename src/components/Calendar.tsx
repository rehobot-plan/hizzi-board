import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';

// 2026년 한국 공휴일 데이터
const HOLIDAYS_2026 = [
  { date: '2026-01-01', name: '신정' },
  { date: '2026-01-28', name: '설날연휴' },
  { date: '2026-01-29', name: '설날연휴' },
  { date: '2026-01-30', name: '설날연휴' },
  { date: '2026-03-01', name: '삼일절' },
  { date: '2026-05-05', name: '어린이날' },
  { date: '2026-05-15', name: '부처님오신날' },
  { date: '2026-06-06', name: '현충일' },
  { date: '2026-08-15', name: '광복절' },
  { date: '2026-09-24', name: '추석연휴' },
  { date: '2026-09-25', name: '추석연휴' },
  { date: '2026-09-26', name: '추석연휴' },
  { date: '2026-10-03', name: '개천절' },
  { date: '2026-10-09', name: '한글날' },
  { date: '2026-12-25', name: '크리스마스' },
];

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  authorId: string;
  color: string;
  createdAt: any;
}

function getMonthMatrix(year: number, month: number) {
  // month: 0-indexed
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const matrix = [];
  let week = [];
  let day = 1 - firstDay.getDay();
  while (day <= lastDay.getDate()) {
    week = [];
    for (let i = 0; i < 7; i++, day++) {
      if (day < 1 || day > lastDay.getDate()) {
        week.push(null);
      } else {
        week.push(new Date(year, month, day));
      }
    }
    matrix.push(week);
  }
  return matrix;
}

export default function Calendar() {
  // ...구현 예정 (UI, Firestore 연동, 권한, 일정 CRUD, 월 이동, 공휴일 표시 등)
  return (
    <div className="bg-white border-2 border-[#81D8D0] rounded-lg p-4 h-[420px] w-full max-w-2xl mx-auto">
      <div className="text-center text-lg font-bold mb-2">공유 달력 (2026년 공휴일 포함)</div>
      {/* 달력 UI, 일정, 월 이동, 입력 등 구현 예정 */}
      <div className="text-gray-400 text-center mt-20">달력 UI 구현 예정</div>
    </div>
  );
}
