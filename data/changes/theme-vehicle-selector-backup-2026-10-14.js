/**
 * Vehicle Selector Component
 * YMM (Year/Make/Model) fitment selector using Shopify tag-based filtering.
 *
 * Fetches available makes/models/years from /collections/all/products.json,
 * then navigates to collection with filter.p.tag params for server-side filtering.
 *
 * Vehicle selection is persisted in localStorage.
 */

const STORAGE_KEY = 'stehlen-vehicle';

class VehicleSelector extends HTMLElement {
  constructor() {
    super();
    this._refs = {};
    this._fitmentData = null;
  }

  connectedCallback() {
    // Gather refs
    this.querySelectorAll('[ref]').forEach(el => {
      this._refs[el.getAttribute('ref')] = el;
    });

    const { trigger, close, form, dialog, makeSelect, modelSelect, yearSelect } = this._refs;

    // Open/close dialog
    trigger.addEventListener('click', () => this._openDialog());
    close.addEventListener('click', () => this._closeDialog());
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) this._closeDialog();
    });

    // Cascading selects
    makeSelect.addEventListener('change', () => this._onMakeChange());
    modelSelect.addEventListener('change', () => this._onModelChange());
    yearSelect.addEventListener('change', () => this._updateGoButton());

    // Form submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._onSubmit();
    });

    // Clear button
    this._refs.clearButton.addEventListener('click', () => this._clearVehicle());

    // Load fitment data and restore saved vehicle
    this._loadFitmentData().then(() => {
      this._restoreSavedVehicle();
    });
  }

  async _loadFitmentData() {
    // Fetch all product tags to build make/model/year tree
    // Use a cached version if available
    const cached = sessionStorage.getItem('stehlen-fitment-data');
    if (cached) {
      try {
        this._fitmentData = JSON.parse(cached);
        this._populateMakes();
        return;
      } catch(e) { /* fall through to fetch */ }
    }

    try {
      // Fetch products in batches to build the fitment tree
      const tree = {}; // { make: { model: Set<year> } }
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const resp = await fetch(`/collections/all/products.json?limit=250&page=${page}`);
        const data = await resp.json();

        if (!data.products || data.products.length === 0) {
          hasMore = false;
          break;
        }

        for (const product of data.products) {
          const tags = Array.isArray(product.tags) ? product.tags.map(t => t.trim()) : product.tags.split(',').map(t => t.trim());
          const makes = [];
          const models = [];
          const years = [];

          for (const tag of tags) {
            if (tag.startsWith('make:')) makes.push(tag.slice(5));
            else if (tag.startsWith('model:')) models.push(tag.slice(6));
            else if (tag.startsWith('year:')) years.push(tag.slice(5));
          }

          for (const make of makes) {
            if (!tree[make]) tree[make] = {};
            for (const model of models) {
              if (!tree[make][model]) tree[make][model] = new Set();
              for (const year of years) {
                tree[make][model].add(year);
              }
            }
            // If no models found, still track the make
            if (models.length === 0) {
              if (!tree[make]['_all']) tree[make]['_all'] = new Set();
              for (const year of years) {
                tree[make]['_all'].add(year);
              }
            }
          }
        }

        page++;
        if (data.products.length < 250) hasMore = false;
      }

      // Convert Sets to sorted arrays
      const fitmentData = {};
      for (const make of Object.keys(tree).sort()) {
        fitmentData[make] = {};
        for (const model of Object.keys(tree[make]).sort()) {
          if (model === '_all') continue;
          fitmentData[make][model] = [...tree[make][model]].sort((a, b) => Number(b) - Number(a));
        }
      }

      this._fitmentData = fitmentData;
      sessionStorage.setItem('stehlen-fitment-data', JSON.stringify(fitmentData));
      this._populateMakes();
    } catch (err) {
      console.error('Vehicle selector: failed to load fitment data', err);
    }
  }

  _populateMakes() {
    const { makeSelect } = this._refs;
    if (!this._fitmentData) return;

    const makes = Object.keys(this._fitmentData).sort();
    makeSelect.innerHTML = '<option value="">— Select —</option>';
    for (const make of makes) {
      const opt = document.createElement('option');
      opt.value = make;
      opt.textContent = make;
      makeSelect.appendChild(opt);
    }
  }

  _onMakeChange() {
    const { makeSelect, modelSelect, yearSelect } = this._refs;
    const make = makeSelect.value;

    modelSelect.innerHTML = '<option value="">— Select —</option>';
    yearSelect.innerHTML = '<option value="">— Select —</option>';
    yearSelect.disabled = true;

    if (make && this._fitmentData[make]) {
      const models = Object.keys(this._fitmentData[make]).sort();
      for (const model of models) {
        const opt = document.createElement('option');
        opt.value = model;
        opt.textContent = model;
        modelSelect.appendChild(opt);
      }
      modelSelect.disabled = false;
    } else {
      modelSelect.disabled = true;
    }

    this._updateGoButton();
  }

  _onModelChange() {
    const { makeSelect, modelSelect, yearSelect } = this._refs;
    const make = makeSelect.value;
    const model = modelSelect.value;

    yearSelect.innerHTML = '<option value="">— Select —</option>';

    if (make && model && this._fitmentData[make]?.[model]) {
      const years = this._fitmentData[make][model];
      for (const year of years) {
        const opt = document.createElement('option');
        opt.value = year;
        opt.textContent = year;
        yearSelect.appendChild(opt);
      }
      yearSelect.disabled = false;
    } else {
      yearSelect.disabled = true;
    }

    this._updateGoButton();
  }

  _updateGoButton() {
    const { makeSelect, modelSelect, goButton } = this._refs;
    // Enable GO if at least make and model are selected
    goButton.disabled = !(makeSelect.value && modelSelect.value);
  }

  _onSubmit() {
    const { makeSelect, modelSelect, yearSelect } = this._refs;
    const make = makeSelect.value;
    const model = modelSelect.value;
    const year = yearSelect.value;

    if (!make || !model) return;

    // Save to localStorage
    const vehicle = { make, model, year };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicle));

    // Build collection URL with metafield filter params
    const url = new URL('/collections/all', window.location.origin);
    url.searchParams.append('filter.p.m.custom.make', make);
    url.searchParams.append('filter.p.m.custom.model', model);
    if (year) {
      url.searchParams.append('filter.p.m.custom.year', year);
    }

    this._closeDialog();
    window.location.href = url.toString();
  }

  _restoreSavedVehicle() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const vehicle = JSON.parse(saved);
      const { triggerText, savedVehicle, savedText, makeSelect, modelSelect, yearSelect } = this._refs;

      // Update trigger button text
      const label = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ');
      triggerText.textContent = label;
      this.classList.add('vehicle-selector--active');

      // Show saved vehicle in dialog
      savedText.textContent = label;
      savedVehicle.style.display = '';

      // Pre-populate dropdowns with saved values
      if (vehicle.make && this._fitmentData) {
        makeSelect.value = vehicle.make;
        this._onMakeChange();
        if (vehicle.model) {
          modelSelect.value = vehicle.model;
          this._onModelChange();
          if (vehicle.year) {
            yearSelect.value = vehicle.year;
            this._updateGoButton();
          }
        }
      }
    } catch(e) { /* ignore */ }
  }

  _clearVehicle() {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem('stehlen-fitment-data');
    const { triggerText, savedVehicle, makeSelect, modelSelect, yearSelect } = this._refs;
    triggerText.textContent = 'SELECT YOUR VEHICLE';
    this.classList.remove('vehicle-selector--active');
    savedVehicle.style.display = 'none';
    makeSelect.value = '';
    modelSelect.innerHTML = '<option value="">— Select —</option>';
    modelSelect.disabled = true;
    yearSelect.innerHTML = '<option value="">— Select —</option>';
    yearSelect.disabled = true;
    this._updateGoButton();

    // If on a filtered collection page, redirect to unfiltered
    if (window.location.search.includes('filter.p.tag')) {
      window.location.href = '/collections/all';
    }
  }

  _openDialog() {
    const dialog = this._refs.dialog;
    const trigger = this._refs.trigger;
    // Position below trigger button
    const rect = trigger.getBoundingClientRect();
    dialog.style.position = 'fixed';
    dialog.style.top = (rect.bottom + 4) + 'px';
    dialog.style.right = (window.innerWidth - rect.right) + 'px';
    dialog.style.left = 'auto';
    dialog.style.margin = '0';
    dialog.show();
  }

  _closeDialog() {
    this._refs.dialog.close();
  }
}

customElements.define('vehicle-selector', VehicleSelector);
