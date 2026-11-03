// Cart state. Mutates in place and calls every listener after a change.
const FREE_SHIPPING_AT = 75;
const SHIPPING = 6.5;

interface Plant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface CartLine {
  id: string;
  name: string;
  price: number;
  qty: number;
}

type ChangeListener = () => void;

interface ShippingReceiver {
  subtotal(): number;
}

interface TotalReceiver extends ShippingReceiver {
  shipping(): number;
}

interface Cart {
  lines: CartLine[];
  onChange(fn: ChangeListener): void;
  add(plant: Plant): boolean;
  remove(id: string): void;
  count(): number;
  subtotal(): number;
  shipping(this: ShippingReceiver): number;
  total(this: TotalReceiver): number;
  toFreeShipping(this: ShippingReceiver): number;
}

export function createCart(): Cart {
  const lines: CartLine[] = [];
  const listeners: ChangeListener[] = [];

  function notify(): void {
    listeners.forEach((listener) => listener());
  }

  return {
    lines: lines,
    onChange: function (fn: ChangeListener): void { listeners.push(fn); },
    add: function (plant: Plant): boolean {
      const line = lines.find((l) => l.id === plant.id);
      if (line) {
        if (line.qty >= plant.stock) return false;
        line.qty++;
      } else {
        if (plant.stock < 1) return false;
        lines.push({ id: plant.id, name: plant.name, price: plant.price, qty: 1 });
      }
      notify();
      return true;
    },
    remove: function (id: string): void {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].id === id) { lines.splice(i, 1); notify(); return; }
      }
    },
    count: function (): number { return lines.reduce((s, l) => s + l.qty, 0); },
    subtotal: function (): number { return lines.reduce((s, l) => s + l.price * l.qty, 0); },
    shipping: function (this: ShippingReceiver): number {
      const sub = this.subtotal();
      return sub === 0 || sub >= FREE_SHIPPING_AT ? 0 : SHIPPING;
    },
    total: function (this: TotalReceiver): number { return this.subtotal() + this.shipping(); },
    toFreeShipping: function (this: ShippingReceiver): number { return Math.max(0, FREE_SHIPPING_AT - this.subtotal()); }
  };
}
