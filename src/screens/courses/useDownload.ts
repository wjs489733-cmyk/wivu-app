import { useEffect, useRef, useState } from 'react';
import { toast } from '@/ui';
import { useCourses } from './store';
import type { FileItem } from './data';

/* ── 다운로드 시뮬레이션 (실제 파일 없음: 진행률 → 완료 토스트) ── */
export type DlState = { status: 'idle' | 'loading' | 'done'; progress: number };

export function useDownload(file: FileItem) {
  const done = useCourses((st) => st.downloaded.includes(file.id));
  const mark = useCourses((st) => st.markDownloaded);
  const [st, setSt] = useState<DlState>({ status: 'idle', progress: 0 });
  const timer = useRef<number>(0);
  useEffect(() => () => clearInterval(timer.current), []);

  const start = () => {
    if (file.kind === 'link') return toast('외부 링크 열기는 다음 버전에서 열려요');
    if (file.kind === 'video') return toast('강의 영상 재생은 다음 버전에서 열려요');
    if (st.status === 'loading') return;
    if (done) return toast('이미 받은 파일이에요 · 파일 앱에서 열 수 있어요', 'file');
    // 용량에 비례해 0.8–1.8초
    const mb = parseFloat(file.size) * (file.size.includes('KB') ? 1 / 1024 : 1) || 1;
    const total = Math.min(1800, 700 + mb * 220);
    const startAt = performance.now();
    setSt({ status: 'loading', progress: 4 });
    timer.current = window.setInterval(() => {
      const p = Math.min(100, ((performance.now() - startAt) / total) * 100);
      setSt({ status: 'loading', progress: p });
      if (p >= 100) {
        clearInterval(timer.current);
        setSt({ status: 'done', progress: 100 });
        mark(file.id);
        toast(`${file.name} 다운로드 완료`, 'check');
      }
    }, 60);
  };

  const status: DlState['status'] = st.status === 'loading' ? 'loading' : done ? 'done' : 'idle';
  return { status, progress: st.progress, start };
}
