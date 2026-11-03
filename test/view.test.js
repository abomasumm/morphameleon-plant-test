import { describe, it, expect } from 'vitest';
import $ from 'jquery';
import { plantCard, cartPanel } from '../src/view';
import { createCart } from '../src/cart';

function plant(overrides) {
  return { id: 'fern', name: 'Fern', art: '🌿', price: 10, light: 'low', stock: 5, ...overrides };
}

describe('view', () => {
  describe('plantCard', () => {
    it('returns a jQuery article.card with data-id equal to plant.id', () => {
      const $card = plantCard(plant(), 0);
      expect($card.is('article.card')).toBe(true);
      expect($card.attr('data-id')).toBe('fern');
    });

    it('renders the art, name, and meta text with stock', () => {
      const $card = plantCard(plant({ art: '🪴', name: 'Monstera', light: 'bright', stock: 4 }), 0);
      expect($card.find('.art').text()).toBe('🪴');
      expect($card.find('h3').text()).toBe('Monstera');
      expect($card.find('.meta').text()).toBe('bright light · 4 left');
    });

    it('shows "sold out" instead of stock when stock < 1', () => {
      const $card = plantCard(plant({ stock: 0 }), 0);
      expect($card.find('.meta').text()).toBe('low light · sold out');
    });

    it('formats the price with two decimals', () => {
      expect(plantCard(plant({ price: 16.5 }), 0).find('.row strong').text()).toBe('$16.50');
      expect(plantCard(plant({ price: 29.99 }), 0).find('.row strong').text()).toBe('$29.99');
      expect(plantCard(plant({ price: 0 }), 0).find('.row strong').text()).toBe('$0.00');
    });

    it('shows an enabled Add button while inCart is below stock', () => {
      const $card = plantCard(plant({ stock: 5 }), 0);
      const $button = $card.find('button.add');
      expect($button.text()).toBe('Add');
      expect($button.prop('disabled')).toBe(false);
    });

    it('shows an enabled Add button while inCart is below stock even with a few in cart', () => {
      const $card = plantCard(plant({ stock: 5 }), 3);
      const $button = $card.find('button.add');
      expect($button.text()).toBe('Add');
      expect($button.prop('disabled')).toBe(false);
    });

    it('shows a disabled "All in cart" button when inCart >= stock', () => {
      const $card = plantCard(plant({ stock: 5 }), 5);
      const $button = $card.find('button.add');
      expect($button.text()).toBe('All in cart');
      expect($button.prop('disabled')).toBe(true);

      // inCart beyond stock is also pinned as full
      expect(plantCard(plant({ stock: 5 }), 6).find('button.add').text()).toBe('All in cart');
      expect(plantCard(plant({ stock: 5 }), 6).find('button.add').prop('disabled')).toBe(true);
    });

    it('shows a disabled "Sold out" button when stock < 1', () => {
      const $card = plantCard(plant({ stock: 0 }), 0);
      const $button = $card.find('button.add');
      expect($button.text()).toBe('Sold out');
      expect($button.prop('disabled')).toBe(true);
    });
  });

  describe('cartPanel', () => {
    it('renders an aside.cart with heading and an empty message on an empty cart', () => {
      const $panel = cartPanel(createCart());
      expect($panel.is('aside.cart')).toBe(true);
      expect($panel.find('h2').text()).toBe('Cart (0 plants)');
      expect($panel.find('p.empty').text()).toBe('Your cart is empty.');
      expect($panel.find('ul').length).toBe(0);
    });

    it('pluralizes the heading based on cart.count()', () => {
      const cart = createCart();
      cart.add({ id: 'a', name: 'A', price: 10, stock: 5 });
      expect(cartPanel(cart).find('h2').text()).toBe('Cart (1 plant)');

      cart.add({ id: 'b', name: 'B', price: 10, stock: 5 });
      expect(cartPanel(cart).find('h2').text()).toBe('Cart (2 plants)');
    });

    it('renders one li[data-id] per line with quantity, name, and formatted line total', () => {
      const cart = createCart();
      cart.add({ id: 'fern', name: 'Fern', price: 16.5, stock: 5 });
      cart.add({ id: 'zz', name: 'ZZ plant', price: 21, stock: 5 });
      cart.add({ id: 'fern', name: 'Fern', price: 16.5, stock: 5 });

      const $items = cartPanel(cart).find('li');
      expect($items.length).toBe(2);
      expect($items.eq(0).attr('data-id')).toBe('fern');
      expect($items.eq(0).find('span').eq(0).text()).toBe('2 × Fern');
      expect($items.eq(0).find('span').eq(1).text()).toBe('$33.00');
      expect($items.eq(1).attr('data-id')).toBe('zz');
      expect($items.eq(1).find('span').eq(0).text()).toBe('1 × ZZ plant');
      expect($items.eq(1).find('span').eq(1).text()).toBe('$21.00');
    });

    it('gives each remove button a "Remove <name>" aria-label', () => {
      const cart = createCart();
      cart.add({ id: 'fern', name: 'Fern', price: 10, stock: 5 });
      const $remove = cartPanel(cart).find('button.remove');
      expect($remove.attr('aria-label')).toBe('Remove Fern');
      expect($remove.text()).toBe('✕');
    });

    it('shows subtotal, shipping, and total in the totals block', () => {
      const cart = createCart();
      cart.add({ id: 'a', name: 'A', price: 29.99, stock: 5 });
      cart.add({ id: 'b', name: 'B', price: 16.5, stock: 5 });

      const $panel = cartPanel(cart);
      expect($panel.find('.subtotal').text()).toBe('$46.49');
      // 0 < subtotal < 75 costs the flat shipping
      expect($panel.find('.shipping').text()).toBe('$6.50');
      expect($panel.find('.total').text()).toBe('$52.99');
    });

    it('shows "Free" shipping when the subtotal is zero or reaches the threshold', () => {
      const cart = createCart();
      cart.add({ id: 'a', name: 'A', price: 75, stock: 5 });
      const $panel = cartPanel(cart);
      expect($panel.find('.subtotal').text()).toBe('$75.00');
      expect($panel.find('.shipping').text()).toBe('Free');
      expect($panel.find('.total').text()).toBe('$75.00');
    });

    it('shows the remaining amount for free shipping below the threshold', () => {
      const cart = createCart();
      cart.add({ id: 'a', name: 'A', price: 16.5, stock: 5 });
      expect(cartPanel(cart).find('.ship').text()).toContain('$58.50 more for free shipping');
    });

    it('shows the free-shipping message at or above the threshold', () => {
      const cart = createCart();
      cart.add({ id: 'a', name: 'A', price: 75, stock: 5 });
      expect(cartPanel(cart).find('.ship').text()).toContain('You get free shipping');
    });

    it('scales the progress bar width with the subtotal', () => {
      const cart = createCart();
      cart.add({ id: 'a', name: 'A', price: 16.5, stock: 5 });
      // round(16.5 / 75 * 100) === 22
      expect(cartPanel(cart).find('.bar span').css('width')).toBe('22%');

      cart.add({ id: 'b', name: 'B', price: 29.99, stock: 5 });
      // round(46.49 / 75 * 100) === 62
      expect(cartPanel(cart).find('.bar span').css('width')).toBe('62%');
    });

    it('caps the progress bar width at 100%', () => {
      const cart = createCart();
      cart.add({ id: 'a', name: 'A', price: 100, stock: 5 });
      expect(cartPanel(cart).find('.bar span').css('width')).toBe('100%');

      cart.add({ id: 'b', name: 'B', price: 200, stock: 5 });
      expect(cartPanel(cart).find('.bar span').css('width')).toBe('100%');
    });

    it('rounds the bar width down to 0% for a tiny subtotal', () => {
      // The smallest non-empty subtotal in the real catalog is 16.5 → 22%.
      // A crafted subtotal of 0.1 pins the actual Math.round behavior: round(0.1/75*100) === 0.
      const cart = createCart();
      cart.lines.push({ id: 'a', name: 'A', price: 0.1, qty: 1 });
      expect(cartPanel(cart).find('.bar span').css('width')).toBe('0%');
    });
  });
});
