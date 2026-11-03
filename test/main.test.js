import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('main entry point', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a .shop and at least one .card inside #app', async () => {
    const app = document.createElement('div');
    app.id = 'app';
    document.body.appendChild(app);

    await import('../src/main');

    const $shop = app.querySelector('.shop');
    expect($shop).not.toBeNull();
    expect(app.querySelector('.card')).not.toBeNull();
  });

  it('does not throw when there is no #app element', async () => {
    await expect(import('../src/main')).resolves.toBeDefined();
  });

  it('exports nothing', async () => {
    const app = document.createElement('div');
    app.id = 'app';
    document.body.appendChild(app);

    const mod = await import('../src/main');

    expect(Object.keys(mod)).toEqual([]);
  });
});
