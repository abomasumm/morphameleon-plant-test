// Rendering with jQuery. Each function returns a jQuery element.
import $ from 'jquery';
import { money, plural } from './format';
import type { Plant } from './catalog';
import type { createCart } from './cart';

type Cart = ReturnType<typeof createCart>;

export function plantCard(plant: Plant, inCart: number): JQuery {
  const soldOut = plant.stock < 1;
  const full = inCart >= plant.stock;
  const $card = $('<article class="card"></article>').attr('data-id', plant.id);
  $card.append($('<div class="art"></div>').text(plant.art));
  $card.append($('<h3></h3>').text(plant.name));
  $card.append($('<div class="meta"></div>').text(plant.light + ' light · ' + (soldOut ? 'sold out' : plant.stock + ' left')));
  const $row = $('<div class="row"></div>');
  $row.append($('<strong></strong>').text(money(plant.price)));
  $row.append($('<button class="add"></button>').text(soldOut ? 'Sold out' : full ? 'All in cart' : 'Add').prop('disabled', soldOut || full));
  return $card.append($row);
}

export function cartPanel(cart: Cart): JQuery {
  const $panel = $('<aside class="cart"></aside>');
  $panel.append($('<h2></h2>').text('Cart (' + plural(cart.count(), 'plant') + ')'));
  if (cart.lines.length === 0) {
    $panel.append($('<p class="empty"></p>').text('Your cart is empty.'));
    return $panel;
  }
  const $ul = $('<ul></ul>');
  cart.lines.forEach(function (line) {
    const $li = $('<li></li>').attr('data-id', line.id);
    $li.append($('<span></span>').text(line.qty + ' × ' + line.name));
    $li.append($('<span></span>').text(money(line.price * line.qty)));
    $li.append($('<button class="remove"></button>').attr('aria-label', 'Remove ' + line.name).text('✕'));
    $ul.append($li);
  });
  $panel.append($ul);
  const $totals = $('<div class="totals"></div>');
  $totals.append($('<div><span>Subtotal</span><span class="subtotal"></span></div>').find('.subtotal').text(money(cart.subtotal())).end());
  $totals.append($('<div><span>Shipping</span><span class="shipping"></span></div>').find('.shipping').text(cart.shipping() ? money(cart.shipping()) : 'Free').end());
  $totals.append($('<div class="grand"><span>Total</span><span class="total"></span></div>').find('.total').text(money(cart.total())).end());
  $panel.append($totals);
  const left = cart.toFreeShipping();
  const pct = Math.min(100, Math.round((cart.subtotal() / 75) * 100));
  const $ship = $('<div class="ship"></div>').text(left > 0 ? money(left) + ' more for free shipping' : 'You get free shipping');
  $ship.append($('<div class="bar"><span></span></div>').find('span').css('width', pct + '%').end());
  return $panel.append($ship);
}
