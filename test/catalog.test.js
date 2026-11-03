import { describe, it, expect } from 'vitest';
import { PLANTS, byLight } from '../src/catalog';

describe('catalog', () => {
  it('byLight with "all" returns a new array with every plant in order', () => {
    const result = byLight(PLANTS, 'all');
    expect(result).not.toBe(PLANTS);
    expect(result).toEqual(PLANTS);
    expect(result.map((p) => p.id)).toEqual(PLANTS.map((p) => p.id));
  });

  it('byLight with "low" returns only low-light plants', () => {
    const result = byLight(PLANTS, 'low');
    expect(result.map((p) => p.id)).toEqual(['snake', 'pothos', 'zz']);
    result.forEach((p) => expect(p.light).toBe('low'));
  });

  it('a falsy light returns a shallow copy of all plants', () => {
    const result = byLight(PLANTS, undefined);
    expect(result).not.toBe(PLANTS);
    expect(result).toEqual(PLANTS);
    expect(byLight(PLANTS, null).map((p) => p.id)).toEqual(PLANTS.map((p) => p.id));
    expect(byLight(PLANTS, '').map((p) => p.id)).toEqual(PLANTS.map((p) => p.id));
  });

  it('an unknown light returns an empty array', () => {
    expect(byLight(PLANTS, 'nope')).toEqual([]);
  });

  it('does not mutate PLANTS or any plant object', () => {
    const snapshot = JSON.stringify(PLANTS);
    byLight(PLANTS, 'all');
    byLight(PLANTS, 'low');
    byLight(PLANTS, undefined);
    byLight(PLANTS, 'bright');
    expect(JSON.stringify(PLANTS)).toBe(snapshot);
    // the returned array is a copy: mutating it must not affect PLANTS
    const result = byLight(PLANTS, 'all');
    result.pop();
    expect(PLANTS.length).toBe(6);
    expect(PLANTS[0]).toEqual({ id: 'monstera', name: 'Monstera', art: '🪴', price: 38, light: 'bright', stock: 4 });
  });

  it('PLANTS pins the catalog data exactly', () => {
    expect(PLANTS).toEqual([
      { id: 'monstera', name: 'Monstera', art: '🪴', price: 38, light: 'bright', stock: 4 },
      { id: 'snake', name: 'Snake plant', art: '🌵', price: 24, light: 'low', stock: 9 },
      { id: 'pothos', name: 'Golden pothos', art: '🌿', price: 16.5, light: 'low', stock: 0 },
      { id: 'fiddle', name: 'Fiddle-leaf fig', art: '🌳', price: 64, light: 'bright', stock: 2 },
      { id: 'calathea', name: 'Calathea', art: '🍃', price: 29.99, light: 'medium', stock: 5 },
      { id: 'zz', name: 'ZZ plant', art: '🌱', price: 21, light: 'low', stock: 7 }
    ]);
  });
});
