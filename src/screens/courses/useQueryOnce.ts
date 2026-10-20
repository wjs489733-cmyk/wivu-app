import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

/**
 * 진입 쿼리(?sheet=menu · ?dialog=leave)를 처음 한 번만 읽고 주소에서는 지운다.
 * 시트·확인창은 같은 라우트의 상태 — 뒤로 돌아왔을 때 다시 열리지 않게 히스토리 항목만 바꾼다(화면 재마운트 없음).
 */
export function useQueryOnce(key: string) {
  const [params] = useSearchParams();
  const [value] = useState(() => params.get(key));
  useEffect(() => {
    if (!value) return;
    const [path, qs = ''] = window.location.hash.split('?');
    const rest = new URLSearchParams(qs);
    rest.delete(key);
    const tail = rest.toString();
    window.history.replaceState(window.history.state, '', tail ? `${path}?${tail}` : path);
  }, [value, key]);
  return value;
}
