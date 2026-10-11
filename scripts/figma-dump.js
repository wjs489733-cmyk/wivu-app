// READ-ONLY Figma 프레임 덤프 (use_figma에 그대로 붙여 넣어 실행)
// FRAME_IDS 배열만 바꿔서 쓴다. 텍스트·박스·색(변수 이름)·반경·반응을 들여쓰기 트리로 반환.
// 절대 노드를 수정하지 않는다.
const FRAME_IDS = ['308:11640'];
const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
async function varName(id) {
  try { const v = await figma.variables.getVariableByIdAsync(id); return v ? v.name : null; } catch { return null; }
}
async function paint(node, key) {
  const ps = node[key];
  if (!ps || ps === figma.mixed || !ps.length) return '';
  const out = [];
  for (const p of ps) {
    if (p.visible === false) continue;
    if (p.type === 'SOLID') {
      const b = p.boundVariables && p.boundVariables.color ? await varName(p.boundVariables.color.id) : null;
      out.push((b ? b : hex(p.color)) + (p.opacity !== undefined && p.opacity < 1 ? '@' + Math.round(p.opacity * 100) : ''));
    } else if (p.type === 'IMAGE') out.push('IMAGE');
    else out.push(p.type);
  }
  return out.join('+');
}
const lines = [];
async function walk(node, depth, ox, oy) {
  if (node.visible === false) return;
  const x = Math.round(node.absoluteTransform[0][2] - ox), y = Math.round(node.absoluteTransform[1][2] - oy);
  const pad = '  '.repeat(depth);
  const box = `${x},${y} ${Math.round(node.width)}×${Math.round(node.height)}`;
  if (node.type === 'TEXT') {
    const fs = node.fontSize === figma.mixed ? 'mix' : node.fontSize;
    const fw = node.fontName === figma.mixed ? 'mix' : node.fontName.style;
    let st = '';
    if (node.textStyleId && node.textStyleId !== figma.mixed) { const s = await figma.getStyleByIdAsync(node.textStyleId); st = s ? ' [' + s.name.replace('WivU Type/', '') + ']' : ''; }
    lines.push(`${pad}T ${box} "${node.characters.replace(/\n/g, '⏎')}" ${fs}/${fw} ${await paint(node, 'fills')}${st}`);
    return;
  }
  const fill = 'fills' in node ? await paint(node, 'fills') : '';
  const stroke = 'strokes' in node ? await paint(node, 'strokes') : '';
  const r = 'cornerRadius' in node && node.cornerRadius !== figma.mixed && node.cornerRadius ? ` r${node.cornerRadius}` : '';
  const al = 'layoutMode' in node && node.layoutMode && node.layoutMode !== 'NONE' ? ` AL:${node.layoutMode[0]} gap${node.itemSpacing} p${node.paddingTop}/${node.paddingRight}/${node.paddingBottom}/${node.paddingLeft}` : '';
  const rx = 'reactions' in node && node.reactions && node.reactions.length ? ' ⚡' + node.reactions.map((re) => (re.trigger ? re.trigger.type : '') + '→' + (re.actions || []).map((a) => a.type === 'NODE' ? (a.navigation + ':' + a.destinationId) : a.type).join(',')).join(' ; ') : '';
  const comp = node.type === 'INSTANCE' ? ` <${(await node.getMainComponentAsync())?.name ?? '?'}>` : '';
  const isIcon = node.type === 'INSTANCE' && node.width <= 24 && node.height <= 24;
  lines.push(`${pad}${node.type[0]} ${box} ${node.name}${comp}${fill ? ' fill:' + fill : ''}${stroke ? ' stroke:' + stroke : ''}${r}${al}${rx}`);
  if (isIcon || node.type === 'VECTOR' || node.type === 'BOOLEAN_OPERATION') return;
  if ('children' in node) for (const c of node.children) await walk(c, depth + 1, ox, oy);
}
const result = {};
for (const id of FRAME_IDS) {
  const f = await figma.getNodeByIdAsync(id);
  if (!f) { result[id] = 'not found'; continue; }
  lines.length = 0;
  const ox = f.absoluteTransform[0][2], oy = f.absoluteTransform[1][2];
  lines.push(`FRAME ${f.name} ${Math.round(f.width)}×${Math.round(f.height)} fixedChildren=${f.numberOfFixedChildren ?? 0} fill:${await paint(f, 'fills')}`);
  for (const c of f.children) await walk(c, 1, ox, oy);
  result[id] = lines.join('\n');
}
return result;
