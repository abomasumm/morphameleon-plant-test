import { describe, it, expect, beforeEach } from 'vitest';
import $ from 'jquery';
import { mount } from '../src/app';
import { PLANTS } from '../src/catalog';

describe('mount', () => {
  let root;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
  });

  it('clears the root and renders the shop skeleton', () => {
    root.innerHTML = '<p>stale content</p>';
    mount(root);
    expect(root.innerHTML).not.toContain('stale content');
    expect($(root).children().length).toBe(1);
    const $shop = $(root).children().eq(0);
    expect($shop.is('div.shop')).toBe(true);
    expect($shop.children().eq(0).is('h1')).toBe(true);
    expect($shop.find('h1').text()).toContain('Fern & Folly');
    expect($shop.find('h1 small').text()).toBe('Houseplants, delivered.');
    expect($shop.find('main').length).toBe(1);
  });

  it('renders one filter button per light value with the right labels', () => {
    mount(root);
    const $buttons = $(root).find('.filters button');
    expect($buttons.length).toBe(4);
    expect($buttons.map((_, b) => $(b).attr('data-light')).get()).toEqual(['all', 'low', 'medium', 'bright']);
    expect($buttons.map((_, b) => $(b).text()).get()).toEqual(['All', 'low light', 'medium light', 'bright light']);
  });

  it('activates the "all" filter on the initial render', () => {
    mount(root);
    expect($(root).find('.filters button.active').attr('data-light')).toBe('all');
  });

  it('renders one card per plant in the grid', () => {
    mount(root);
    const $cards = $(root).find('.grid .card');
    expect($cards.length).toBe(PLANTS.length);
    expect($cards.map((_, c) => $(c).attr('data-id')).get()).toEqual(PLANTS.map((p) => p.id));
    // every card carries an add button, disabled for sold-out plants
    $cards.each((_, card) => {
      expect($(card).find('button.add').length).toBe(1);
    });
    expect($(root).find('.card[data-id="pothos"] button.add').prop('disabled')).toBe(true);
    expect($(root).find('.card[data-id="monstera"] button.add').prop('disabled')).toBe(false);
  });

  it('renders the cart slot with an empty cart panel', () => {
    mount(root);
    expect($(root).find('aside.cart h2').text()).toBe('Cart (0 plants)');
    expect($(root).find('aside.cart p.empty').text()).toBe('Your cart is empty.');
  });

  it('returns the live cart and adds through the UI, notifying listeners', () => {
    const cart = mount(root);
    const calls = [];
    cart.onChange(() => calls.push('change'));

    $(root).find('.card[data-id="monstera"] button.add').trigger('click');

    expect(cart.count()).toBe(1);
    expect(cart.lines).toEqual([{ id: 'monstera', name: 'Monstera', price: 38, qty: 1 }]);
    expect(calls).toEqual(['change']);
    // the panel rerendered through cart.onChange
    expect($(root).find('aside.cart h2').text()).toBe('Cart (1 plant)');
  });

  it('removes a line through the rendered remove button', () => {
    const cart = mount(root);
    $(root).find('.card[data-id="snake"] button.add').trigger('click');
    expect(cart.count()).toBe(1);

    $(root).find('aside.cart li[data-id="snake"] button.remove').trigger('click');

    expect(cart.lines).toEqual([]);
    expect(cart.count()).toBe(0);
    expect($(root).find('aside.cart h2').text()).toBe('Cart (0 plants)');
  });

  it('filters the grid and moves the active class on filter clicks', () => {
    mount(root);
    $(root).find('.filters button[data-light="low"]').trigger('click');

    expect($(root).find('.filters button.active').attr('data-light')).toBe('low');
    expect($(root).find('.grid .card').map((_, c) => $(c).attr('data-id')).get()).toEqual(['snake', 'pothos', 'zz']);

    // switching back to all restores every plant
    $(root).find('.filters button[data-light="all"]').trigger('click');
    expect($(root).find('.grid .card').length).toBe(PLANTS.length);
  });

  it('does not throw for a null root and leaves the document unchanged', () => {
    const before = document.body.innerHTML;
    expect(() => mount(null)).not.toThrow();
    expect(document.body.innerHTML).toBe(before);
  });
});
