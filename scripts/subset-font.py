"""Pretendard Variable 서브셋 (OFL 1.1 — 서브셋·재배포 허용, 폰트 이름 유지)
글리프: ASCII + 기본 문장부호·기호 + KS X 1001 한글 2,350자 + 앱 소스에 쓰인 모든 문자
→ src/assets/fonts/PretendardVariable-subset.woff2 (전시장 오프라인·단일 파일 빌드용)
실행: npm run font:subset
"""
import pathlib, re, sys
from fontTools import subset

root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2'
out = root / 'src/assets/fonts/PretendardVariable-subset.woff2'

chars = set(chr(c) for c in range(0x20, 0x7F))
chars |= set('·–—‘’“”…•‹›«»→←↑↓★☆●○◎※✓✔×÷±°%‰℃₩€¥©®™「」『』《》〈〉【】①②③④⑤⑥⑦⑧⑨⑩')
# KS X 1001 완성형 한글 2,350자
for hi in range(0xB0, 0xC9):
    for lo in range(0xA1, 0xFF):
        try:
            chars.add(bytes([hi, lo]).decode('euc-kr'))
        except UnicodeDecodeError:
            pass
chars |= set(chr(c) for c in range(0x3131, 0x3164))  # 호환 자모
for p in list((root / 'src').rglob('*.ts*')) + list((root / 'src').rglob('*.css')):
    chars |= set(p.read_text(encoding='utf-8'))
chars = {c for c in chars if c.isprintable() and ord(c) >= 0x20}

opts = subset.Options()
opts.flavor = 'woff2'
opts.layout_features = ['*']
opts.name_IDs = ['*']
opts.notdef_outline = True
font = subset.load_font(str(src), opts)
s = subset.Subsetter(opts)
s.populate(text=''.join(sorted(chars)))
s.subset(font)
out.parent.mkdir(parents=True, exist_ok=True)
subset.save_font(font, str(out), opts)
print(f'{len(chars)} chars → {out.name} {out.stat().st_size/1024:.0f} KB (원본 {src.stat().st_size/1024:.0f} KB)')
