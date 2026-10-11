import { AttendanceSheet } from './AttendanceSheet';

/**
 * (통합 단계에서 정리) 파일럿 AttendanceSheet의 'QR' 키 이동 버그(닫힐 때 타이머가 지워짐)를
 * 시트 쪽에서 고쳤으므로 이제 그대로 전달만 한다. 기존 import 경로 유지용.
 */
export function AttendanceSheetHost({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <AttendanceSheet open={open} onClose={onClose} />;
}
