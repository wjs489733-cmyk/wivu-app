/* ────────────────────────────────────────────────────────────
 * 라우트 경로 — Figma 프레임 ↔ 코드 화면 대응표 (단일 기준)
 * 모든 화면 간 이동은 이 상수를 쓴다.
 * ──────────────────────────────────────────────────────────── */
export const P = {
  // ① 진입 · 스플래시 – 소개
  splash: '/splash', // 334:9435
  intro: (n: 1 | 2 | 3) => `/intro/${n}`, // 366:9791 · 366:9817 · 410:8227
  // ② 진입 · 학교 선택 – 로그인
  school: '/school', // 352:1158
  schoolSearch: '/school/search', // 416:8372 (+ 지역 선택 시트 416:12064)
  login: '/login', // 366:9848 빈 · 411:8210 입력 중 · 411:8258 오류(?error=1)
  linking: '/login/linking', // 411:11957
  // ③ 진입 · 초기 설정
  setupNotifications: '/setup/notifications', // 411:12022 (+ 시스템 권한 411:12110)
  setupQuickMenu: '/setup/quick-menu', // 411:12208

  // 홈
  home: '/home', // 308:11640 출석 전 · 308:11881 출석 완료 · 308:11745 레디얼(오버레이)
  homeFreeDay: '/home/free-day', // 433:9519 공강 홈 (목 9/10)
  notifications: '/notifications', // 428:8938
  meal: '/meal', // 429:8987
  notices: '/notices', // (코드 추가) 학사 공지 목록
  academicNotice: (id = 'n1') => `/notices/${id}`, // 430:9007
  campusMap: '/map', // 431:9033

  // 출석
  attendance: '/attendance', // 392:7302 탭 루트
  attendanceCourse: (id = 'service-design') => `/attendance/course/${id}`, // 406:8047
  attendancePin: '/attendance/pin', // 372:7253 · 432:9081 · 432:9226 · 432:9371(?error=1)
  attendanceDone: '/attendance/done', // 372:7221
  attendanceQr: '/attendance/qr', // 408:8098
  studentId: '/student-id', // 407:8067

  // 수강과목
  courses: '/courses', // 392:7404
  course: (id = 'service-design') => `/courses/${id}`, // 398:7666
  assignment: (id = 'service-design', aid = 'a1') => `/courses/${id}/assignments/${aid}`, // 398:7694
  assignmentSubmit: (id = 'service-design', aid = 'a1') => `/courses/${id}/assignments/${aid}/submit`, // 398:7717
  assignmentDone: (id = 'service-design', aid = 'a1') => `/courses/${id}/assignments/${aid}/done`, // 400:7849
  courseNotice: (id = 'service-design', nid = 'c1') => `/courses/${id}/notices/${nid}`, // 398:7759
  courseMaterials: (id = 'service-design') => `/courses/${id}/materials`, // 398:7782

  // 시간표 · 캘린더
  timetable: '/timetable', // 392:7472 (+ 수업 상세 시트 402:7846)
  timetableAdd: '/timetable/add', // 403:7931 (+ 추가 완료 403:8007)
  calendar: '/timetable/calendar', // 392:7540
  calendarEvent: (id = 'e1') => `/calendar/events/${id}`, // 404:7979
  calendarNew: '/calendar/new', // 405:8022

  // 게시판
  board: '/board', // 418:8600
  boardCourse: (id = 'service-design') => `/board/course/${id}`, // 419:8518
  boardPost: (pid = 'p1') => `/board/posts/${pid}`, // 420:8564
  boardWrite: '/board/write', // 420:8691

  // 홈 › 마이·설정
  my: '/my', // 424:8665
  myQuickMenu: '/my/quick-menu', // 425:8741
  myNotifications: '/my/notifications', // 426:8846
  mySchool: '/my/school', // 426:8952

  // 개발·전시용
  designSystem: '/design-system',
} as const;

/** Figma Flow starting points (전시 데스크톱 패널에서 바로가기) */
export const FLOWS = [
  { id: 'start', label: '시작부터 홈까지', path: P.splash, figma: '334:9435' },
  { id: 'attendance', label: '② 출석', path: P.attendance, figma: '392:7302' },
  { id: 'courses', label: '③ 수강과목 → 과제 제출', path: P.courses, figma: '392:7404' },
  { id: 'timetable', label: '④ 시간표', path: P.timetable, figma: '392:7472' },
  { id: 'calendar', label: '④-2 시간표 › 캘린더', path: P.calendar, figma: '392:7540' },
  { id: 'board', label: '⑤ 게시판', path: P.board, figma: '418:8600' },
  { id: 'err-login', label: '예외 · 로그인 오류', path: `${P.login}?error=1`, figma: '411:8258' },
  { id: 'err-pin', label: '예외 · PIN 오류', path: `${P.attendancePin}?error=1`, figma: '432:9371' },
  { id: 'free-day', label: '예외 · 공강 홈', path: P.homeFreeDay, figma: '433:9519' },
] as const;
