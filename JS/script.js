const DATA_URL = 'data/countries.json';
let COUNTRIES = [];

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  fetchCountries();
  setupSearch();
  setupContactForm();
  setupDarkToggle();
  updateYear();
  if (document.getElementById('favorites-list')) {
    document.addEventListener('countriesLoaded', renderFavorites);
  }
});

/* ---------- Fetch Countries ---------- */
async function fetchCountries() {
  try {
    const res = await fetch(DATA_URL);
    if(!res.ok) throw new Error('Failed to load countries.json');
    const data = await res.json();
    COUNTRIES = data.countries || [];
    populateSidebar();
    document.dispatchEvent(new Event('countriesLoaded'));
  } catch (err) {
    console.error(err);
    const sidebar = document.getElementById('sidebar-countries');
    if(sidebar) sidebar.innerHTML = '<li class="text-danger p-2">Unable to load countries</li>';
  }
}

function populateSidebar() {
  const sidebar = document.getElementById('sidebar-countries');
  if(!sidebar) return;
  sidebar.innerHTML = '';
  COUNTRIES.forEach(c => {
    const li = document.createElement('li');
    li.className = 'nav-item';
    const a = document.createElement('a');
    a.className = 'nav-link';
    a.href = `country.html?id=${encodeURIComponent(c.id)}`;
    a.textContent = c.name;
    a.setAttribute('role','menuitem');
    li.appendChild(a);
    sidebar.appendChild(li);
  });
}

/* ---------- Search ---------- */
function setupSearch() {
  const input = document.getElementById('country-search');
  if (!input) return;
  let acBox;
  input.addEventListener('input', () => {
    const val = input.value.trim().toLowerCase();
    if (acBox) acBox.remove();
    if (!val) return;

    acBox = document.createElement('div');
    acBox.className = 'position-absolute bg-white border rounded shadow-sm mt-1';
    acBox.style.zIndex = 2000;
    acBox.style.width = input.offsetWidth + 'px';

    const matches = COUNTRIES.filter(c => c.name.toLowerCase().includes(val)).slice(0, 6);
    if(matches.length === 0) acBox.innerHTML = '<div class="p-2 text-muted">No results</div>';
    else {
      matches.forEach(m => {
        const row = document.createElement('div');
        row.className = 'p-2 text-dark';
        row.style.cursor = 'pointer';
        row.textContent = m.name;
        row.addEventListener('click', () => window.location.href = `country.html?id=${encodeURIComponent(m.id)}`);
        acBox.appendChild(row);
      });
    }
    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(acBox);
  });

  document.addEventListener('click', e => { if(acBox && !input.contains(e.target)) acBox.remove(); });

  input.addEventListener('keydown', e => {
    if(e.key === 'Enter') {
      const q = input.value.trim().toLowerCase();
      const found = COUNTRIES.find(c => c.name.toLowerCase() === q || c.id.toLowerCase() === q);
      if(found) window.location.href = `country.html?id=${encodeURIComponent(found.id)}`;
      else {
        const partial = COUNTRIES.find(c => c.name.toLowerCase().includes(q));
        if(partial) window.location.href = `country.html?id=${encodeURIComponent(partial.id)}`;
        else alert('Country not found.');
      }
    }
  });
}

/* ---------- Favorites ---------- */
function getFavorites() { return JSON.parse(localStorage.getItem('tourist_favorites') || '[]'); }
function saveFavorites(list) { localStorage.setItem('tourist_favorites', JSON.stringify(list)); }
function addToFavorites(countryId, cityId){
  const list = getFavorites();
  if(list.some(x => x.countryId===countryId && x.cityId===cityId)){ alert('Already in favorites'); return; }
  list.push({countryId, cityId});
  saveFavorites(list);
  alert('Added to favorites');
}
function renderFavorites(){
  const container = document.getElementById('favorites-list');
  if(!container) return;
  const list = getFavorites();
  if(list.length===0){ container.innerHTML='<p class="text-center">No favorites yet</p>'; return; }
  container.innerHTML = '';
  list.forEach(fav => {
    const country = COUNTRIES.find(c=>c.id===fav.countryId);
    if(!country) return;
    const city = country.cities.find(c=>c.id===fav.cityId);
    if(!city) return;

    const col = document.createElement('div'); col.className='col-md-4 mb-3';
    const card = document.createElement('div'); card.className='card city-card fade-in';
    card.innerHTML = `
    <img src="${city.image}" class="card-img-top" alt="${city.name}">
    <div class="card-body position-relative">
      <h5 class="card-title">${city.name}</h5>
      <p class="card-text">
        <strong>Hotel:</strong> ${city.hotel}<br>
        <strong>Restaurant:</strong> ${city.restaurant}
      </p>
      <ul>${city.attractions.map(a=>`<li>${a}</li>`).join('')}</ul>
      <button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
        onclick="removeFromFavorites('${country.id}','${city.id}')">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>`;  
    col.appendChild(card);
    container.appendChild(col);
  });
}
// remove favorite button
function removeFromFavorites(countryId, cityId) {
  const list = getFavorites();
  const updated = list.filter(x => !(x.countryId === countryId && x.cityId === cityId));
  saveFavorites(updated);
  renderFavorites(); // re-render the list immediately
}

/* ---------- Country Page ---------- */
document.addEventListener('countriesLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if(!id) return;

  const country = COUNTRIES.find(c=>c.id===id);
  if(!country) return;

  const title = document.getElementById('country-title'); if(title) title.textContent = country.name;
  const container = document.getElementById('country-cities');
  if(!container) return;

  container.innerHTML = '';
  country.cities.forEach(city=>{
    const col = document.createElement('div'); col.className='col-md-4 mb-3';
    const card = document.createElement('div'); card.className='card city-card fade-in position-relative';
    card.innerHTML = `
      <img src="${city.image}" class="card-img-top" alt="${city.name}">
      <div class="card-body">
        <h5 class="card-title">${city.name}</h5>
        <p class="card-text"><strong>Hotel:</strong> ${city.hotel}<br><strong>Restaurant:</strong> ${city.restaurant}</p>
        <ul>${city.attractions.map(a=>`<li>${a}</li>`).join('')}</ul>
        <button class="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-2" onclick="addToFavorites('${country.id}','${city.id}')">
          <i class="fa-solid fa-heart"></i>
        </button>
      </div>`;
    col.appendChild(card);
    container.appendChild(col);
  });
});

/* ---------- Contact Form ---------- */
function setupContactForm() {
  const form = document.getElementById('contact-form');
  if(!form) return;
  form.addEventListener('submit', e=>{
    e.preventDefault();
    document.getElementById('contact-status').textContent = 'Message sent!';
    form.reset();
  });
}

/* ---------- Dark Mode Toggle ---------- */
function setupDarkToggle() {
  const btn = document.getElementById('theme-toggle');
  if(!btn) return;
  btn.addEventListener('click', () => document.body.classList.toggle('dark'));
}

/* ---------- Footer Year ---------- */
function updateYear() { document.getElementById('year').textContent = new Date().getFullYear(); }
