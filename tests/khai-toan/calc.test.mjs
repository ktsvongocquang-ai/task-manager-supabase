// Kiểm thử số liệu (không cần trình duyệt): node --test tests/khai-toan/calc.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../../public/khai-toan/calc.js';
import { CASES } from './cases.mjs';

const K = globalThis.KhaiToanCalc;

test('Cấu hình mẫu 100m², 3PN, 2WC, Tiêu chuẩn, Hiện đại, phạm vi mặc định = 1.050.793.750đ, 55 ngày', () => {
  const r = K.calculate({ area: 100, beds: 3, baths: 2, tier: 'standard', style: 'modern', startDate: '2026-11-09', scope: {} });
  assert.equal(r.total, 1050793750);
  assert.equal(K.money(r.total).replace(/\s/g, ' '), '1.050.793.750 ₫');
  assert.equal(r.schedule.workDays, 55);
});

test('Các cấu hình mẫu khớp số đã chốt (lấy từ app.js gốc trên trình duyệt thật)', () => {
  for (const c of CASES) {
    const r = K.calculate(c.input);
    assert.equal(r.total, c.expect.total, c.name + ': tổng');
    assert.equal(r.schedule.workDays, c.expect.workDays, c.name + ': ngày làm việc');
  }
});

test('validateRequest: chặn sai, nhận đúng', () => {
  assert.equal(K.validateRequest({ area: 10, beds: 2, baths: 2, tier: 'standard', style: 'modern' }).ok, false);
  assert.equal(K.validateRequest({ area: 70, beds: 2, baths: 2, tier: 'vip', style: 'modern' }).ok, false);
  assert.equal(K.validateRequest({ area: 70, beds: 2, baths: 2, tier: 'standard', style: 'modern', scope: { wood: 'oak' } }).ok, false);
  assert.equal(K.validateRequest({ area: 70, beds: 2, baths: 2, tier: 'standard', style: 'modern', hacker: 1 }).ok, false);
  assert.equal(K.validateRequest({ area: 70, beds: 2, baths: 2, tier: 'standard', style: 'modern', startDate: '2026-02-30' }).ok, false);
  const ok = K.validateRequest({ area: 70, beds: 2, baths: 2, tier: 'Tiêu chuẩn', style: 'Hiện đại', scope: { demoLevel: '50' } });
  assert.equal(ok.ok, true);
  assert.equal(ok.value.tier, 'standard');
  assert.equal(ok.value.scope.demoLevel, 50);
  assert.equal(ok.value.showSchedule, false);
});

test('encodeCfg/decodeCfg khứ hồi, không chứa tên/SĐT', () => {
  const v = K.validateRequest({ clientName: 'Nguyễn Thị Hoa', phone: '0909123456', area: 70, beds: 2, baths: 2, tier: 'standard', style: 'modern', startDate: '2026-11-09' }).value;
  const back = K.decodeCfg(K.encodeCfg(v));
  assert.equal(back.area, 70);
  assert.equal(back.clientName, undefined);
  assert.equal(back.phone, undefined);
  assert.deepEqual(back.scope, v.scope);
});
