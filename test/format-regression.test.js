import { describe, it, expect } from 'vitest';
import { money, plural } from '../src/format';

describe('format regression', () => {
  it('money(12.3) returns "$12.30"', () => {
    expect(money(12.3)).toBe('$12.30');
  });
  it('money(12.345) returns "$12.35"', () => {
    expect(money(12.345)).toBe('$12.35');
  });
  it('money(0) returns "$0.00"', () => {
    expect(money(0)).toBe('$0.00');
  });
  it('plural(1, "plant") returns "1 plant"', () => {
    expect(plural(1, 'plant')).toBe('1 plant');
  });
  it('plural(0, "plant") returns "0 plants"', () => {
    expect(plural(0, 'plant')).toBe('0 plants');
  });
  it('plural(2, "plant") returns "2 plants"', () => {
    expect(plural(2, 'plant')).toBe('2 plants');
  });
});
