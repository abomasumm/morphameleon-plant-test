import { describe, it, expect } from 'vitest';
import { createCart } from '../src/cart';

function plant(overrides) {
  return { id: 'fern', name: 'Fern', price: 10, stock: 5, ...overrides };
}

describe('cart', () => {
  it('adds a new in-stock plant as a line with qty 1', () => {
    const cart = createCart();
    expect(cart.add(plant())).toBe(true);
    expect(cart.lines).toEqual([{ id: 'fern', name: 'Fern', price: 10, qty: 1 }]);
    expect(Object.keys(cart.lines[0])).toEqual(['id', 'name', 'price', 'qty']);
  });

  it('increments qty on a repeated add and stops at stock', () => {
    const cart = createCart();
    cart.add(plant());
    expect(cart.add(plant())).toBe(true);
    expect(cart.lines[0].qty).toBe(2);

    // stock is 5, so adding until qty reaches stock works
    cart.add(plant());
    cart.add(plant());
    cart.add(plant());
    expect(cart.add(plant())).toBe(false);
    expect(cart.lines).toEqual([{ id: 'fern', name: 'Fern', price: 10, qty: 5 }]);
  });

  it('rejects a plant with stock 0 without touching lines', () => {
    const cart = createCart();
    expect(cart.add(plant({ stock: 0 }))).toBe(false);
    expect(cart.lines).toEqual([]);
  });

  it('notifies listeners only on successful mutation', () => {
    const cart = createCart();
    const calls = [];
    cart.onChange(() => calls.push('change'));

    // one successful add → one change
    cart.add(plant());
    expect(calls).toEqual(['change']);

    // rejected adds call no listener
    cart.add(plant({ stock: 0, id: 'dead', name: 'Dead', price: 1 }));
    expect(calls).toEqual(['change']);

    // repeats succeed until qty reaches stock (5), each notifying once
    cart.add(plant());
    cart.add(plant());
    cart.add(plant());
    cart.add(plant());
    expect(calls).toEqual(['change', 'change', 'change', 'change', 'change']);

    // add at qty === stock is rejected and stays silent
    cart.add(plant());
    expect(calls).toEqual(['change', 'change', 'change', 'change', 'change']);
    expect(cart.lines).toEqual([{ id: 'fern', name: 'Fern', price: 10, qty: 5 }]);
  });

  it('removes only the first matching line and ignores unknown ids', () => {
    const cart = createCart();
    cart.add(plant({ id: 'a', name: 'A', price: 1 }));
    cart.add(plant({ id: 'b', name: 'B', price: 2 }));

    const calls = [];
    cart.onChange(() => calls.push('change'));

    cart.remove('a');
    expect(cart.lines).toEqual([{ id: 'b', name: 'B', price: 2, qty: 1 }]);
    expect(calls).toEqual(['change']);

    cart.remove('nope');
    expect(cart.lines).toEqual([{ id: 'b', name: 'B', price: 2, qty: 1 }]);
    expect(calls).toEqual(['change']);
  });

  it('removes only the first of several lines sharing an id', () => {
    // duplicate ids cannot arise through add (it merges by id), so push
    // them directly into the exposed mutable lines array to pin removal
    const cart = createCart();
    cart.lines.push({ id: 'a', name: 'A', price: 1, qty: 1 });
    cart.lines.push({ id: 'a', name: 'A', price: 1, qty: 1 });
    cart.lines.push({ id: 'b', name: 'B', price: 2, qty: 1 });

    const calls = [];
    cart.onChange(() => calls.push('change'));

    cart.remove('a');
    expect(cart.lines).toEqual([
      { id: 'a', name: 'A', price: 1, qty: 1 },
      { id: 'b', name: 'B', price: 2, qty: 1 },
    ]);
    expect(calls).toEqual(['change']);
  });

  it('computes count, subtotal, shipping, total, and toFreeShipping', () => {
    const cart = createCart();

    // empty cart: shipping is free at subtotal 0
    expect(cart.count()).toBe(0);
    expect(cart.subtotal()).toBe(0);
    expect(cart.shipping()).toBe(0);
    expect(cart.total()).toBe(0);
    expect(cart.toFreeShipping()).toBe(75);

    cart.add(plant({ id: 'a', name: 'A', price: 16.5, stock: 5 }));
    cart.add(plant({ id: 'b', name: 'B', price: 29.99, stock: 5 }));
    expect(cart.count()).toBe(2);
    expect(cart.subtotal()).toBeCloseTo(46.49, 10);

    // 0 < subtotal < 75 costs flat 6.5 shipping
    expect(cart.shipping()).toBe(6.5);
    expect(cart.total()).toBeCloseTo(52.99, 10);
    expect(cart.toFreeShipping()).toBeCloseTo(28.51, 10);

    // at or above 75 shipping is free again
    cart.add(plant({ id: 'c', name: 'C', price: 30, stock: 5 }));
    expect(cart.subtotal()).toBeCloseTo(76.49, 10);
    expect(cart.shipping()).toBe(0);
    expect(cart.total()).toBeCloseTo(76.49, 10);
    expect(cart.toFreeShipping()).toBe(0);
  });

  it('keeps shipping and total receiver-sensitive', () => {
    const cart = createCart();
    expect(cart.shipping.call({ subtotal: () => 10 })).toBe(6.5);
    expect(cart.shipping.call({ subtotal: () => 0 })).toBe(0);
    expect(cart.shipping.call({ subtotal: () => 100 })).toBe(0);
    expect(cart.total.call({ subtotal: () => 10, shipping: () => 2 })).toBe(12);
  });
});
