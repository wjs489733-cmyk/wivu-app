import { create } from 'zustand';

/* 진입 섹션 전용 상태 — '학교를 직접 골랐는지'
 * 학교 이름 자체는 전역 useApp.selectedSchool(setSchool)에 둔다. 전역 초기값이 대구가톨릭대학교라서
 * 로그인 화면이 'v5 학교 선택 전(667:4519)'과 '학교 선택 후(669:4633)' 중 어느 쪽인지는 여기서 구분한다.
 * 스플래시에서 초기화, 대학교 검색 시트에서 고르면 true, 마이 › 학교 연동 해제(?school=1)로 오면 false. */
type EntryState = {
  schoolPicked: boolean;
  pickSchool: () => void;
  clearSchool: () => void;
};

export const useEntry = create<EntryState>((set) => ({
  schoolPicked: false,
  pickSchool: () => set({ schoolPicked: true }),
  clearSchool: () => set({ schoolPicked: false }),
}));
