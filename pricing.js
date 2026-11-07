// Matches cotizador-EG v2.4.1: round each panel's billable area before
// multiplying by quantity, then round each subtotal before summing.
export const units = { in: 25.4, ft: 304.8, yd: 914.4, mm: 1, cm: 10, m: 1000 };
export const round2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
export function calculate(panels, unit, basis, rate) {
  const price = rate === '' ? null : Number(rate);
  const priceValid = price !== null && Number.isFinite(price) && price >= 0;
  const rows = panels.map(p => {
    const h = Number(p.height), w = Number(p.width), qty = Number(p.quantity);
    const valid = [h,w,qty].every(n => Number.isFinite(n) && n > 0) && Number.isInteger(qty);
    if (!valid) return { ...p, valid: false };
    const squareInches = (h * units[unit] / 25.4) * (w * units[unit] / 25.4);
    const area = round2(squareInches / (basis === 'ft2' ? 144 : 1));
    const billableArea = round2(area * qty);
    const subtotal = priceValid ? round2(billableArea * price) : null;
    return {...p, valid: [area,billableArea,squareInches,subtotal ?? 0].every(Number.isFinite), area, billableArea, squareInches: squareInches * qty, subtotal };
  });
  const validRows = rows.filter(r => r.valid);
  const ready = rows.length > 0 && rows.every(r => r.valid) && priceValid;
  const total = ready ? round2(rows.reduce((sum,r) => sum + r.subtotal, 0)) : null;
  return { rows, priceValid, ready: ready && Number.isFinite(total), total: Number.isFinite(total) ? total : null,
    area: round2(validRows.reduce((sum,r)=>sum+r.billableArea,0)),
    squareInches: validRows.reduce((sum,r)=>sum+r.squareInches,0),
    quantity: validRows.reduce((sum,r)=>sum+Number(r.quantity),0) };
}
export function convert(value, from, to) {
  if(value === '') return '';
  return String(Number((Number(value) * units[from] / units[to]).toPrecision(15)));
}
