import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, push, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBfDGBOWT7L9htPnljVjtWE8hq_XALgbjk",
  authDomain: "xusfine.firebaseapp.com",
  projectId: "xusfine",
  storageBucket: "xusfine.firebasestorage.app",
  messagingSenderId: "607144663172",
  appId: "1:607144663172:web:ecd8ac868bd25e24a6cad1",
  measurementId: "G-DSL1NBHZD8"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app, 'https://xusfine-default-rtdb.asia-southeast1.firebasedatabase.app/');

// ── DEMO FALLBACK PROPERTIES ──
window._demoProperties = [
  {
    id: 'demo1',
    name: 'Modern Villa in Surigao',
    type: 'Villa',
    location: 'Surigao City',
    beds: 4, baths: 3, area: '250 sqm',
    price: '15,000,000',
    desc: 'Beautiful modern villa with ocean views, perfect for families.',
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'],
    status: 'For Sale', featured: true
  },
  {
    id: 'demo2',
    name: 'Cozy Apartment Downtown',
    type: 'Apartment',
    location: 'Butuan City',
    beds: 2, baths: 1, area: '85 sqm',
    price: '3,500,000',
    desc: 'Convenient downtown apartment with city views.',
    images: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80'],
    status: 'For Sale', featured: false
  },
  {
    id: 'demo3',
    name: 'Luxury Condo with Pool',
    type: 'Condo',
    location: 'Davao City',
    beds: 3, baths: 2, area: '120 sqm',
    price: '8,000,000',
    desc: 'High-end condominium with resort-style amenities.',
    images: ['https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=500&q=80'],
    status: 'For Sale', featured: true
  }
];

window._loadProperties = async function() {
  try {
    const propertiesRef = ref(db, 'properties');
    onValue(propertiesRef, (snap) => {
      const data = snap.val();
      const props = [];
      if (data) {
        Object.keys(data).forEach(key => {
          props.push({ id: key, ...data[key] });
        });
      }
      props.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      window._renderProperties(props);
    });
  } catch(e) {
    console.warn("Firebase not configured – using demo data.", e);
    window._renderProperties(window._demoProperties);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  renderSkeletonCards();
  setTimeout(window._loadProperties, 300);
  initContactForm();
});

let _allProperties = [];

// ── RENDER PROPERTIES ──
window._renderProperties = function(props) {
  _allProperties = props;
  renderGrid(props);
  updateLocations(props);
};

function renderSkeletonCards(count = 6) {
  const grid = document.getElementById('propertiesGrid');
  const skeletons = Array(count).fill().map((_, i) => `
    <div class="property-card skeleton reveal" style="transition-delay:${i * 0.08}s">
      <div class="property-img"></div>
      <div class="property-body">
        <div class="property-type"></div>
        <div class="property-name"></div>
        <div class="property-location"></div>
        <div class="property-specs">
          <div class="spec-item"></div>
          <div class="spec-item"></div>
          <div class="spec-item"></div>
        </div>
        <div class="property-footer">
          <div class="property-price"></div>
          <div class="btn-details"></div>
        </div>
      </div>
    </div>
  `).join('');
  grid.innerHTML = skeletons;
  initReveal();
}

function renderGrid(props) {
  const grid = document.getElementById('propertiesGrid');
  if (!props || props.length === 0) {
    grid.innerHTML = `<div class="no-properties">
      <div style="font-size:2.5rem;margin-bottom:12px;">🏠</div>
      <p style="font-size:1.1rem;">No properties found</p>
      <p>Try adjusting your search filters.</p>
    </div>`;
    return;
  }
  grid.innerHTML = props.map((p, i) => {
    const firstImage = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : p.image || '';
    const imgUrl = convertDriveUrl(firstImage);
    return `
      <div class="property-card reveal" style="transition-delay:${i * 0.08}s" onclick="openModal('${p.id}')">
        <div class="property-img">
          <img src="${imgUrl || 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=600&q=80'}"
               alt="${p.name}"
               loading="lazy" decoding="async"
               onerror="this.src='https://images.unsplash.com/photo-1560184897-ae75f418493e?w=600&q=80'">
          <div class="property-badge ${p.featured ? 'featured' : ''}">${p.featured ? '⭐ Featured' : p.status || 'For Sale'}</div>
        </div>
        <div class="property-body">
          <div class="property-type">${p.type || 'Property'}</div>
          <div class="property-name">${p.name}</div>
          <div class="property-location">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${p.location}
          </div>
          <div class="property-specs">
            <div class="spec-item"><div class="spec-icon">🛏</div>${p.beds || '–'} Beds</div>
            <div class="spec-item"><div class="spec-icon">🚿</div>${p.baths || '–'} Baths</div>
            <div class="spec-item"><div class="spec-icon">📐</div>${p.area || '–'}</div>
          </div>
          <div class="property-footer">
            <div class="property-price">₱${p.price}<span> / asking</span></div>
            <button class="btn-details">Details →</button>
          </div>
        </div>
      </div>`;
  }).join('');
  initReveal();
}

function convertDriveUrl(url) {
  if (!url) return '';
  let fileId = null;
  const match1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match1) fileId = match1[1];
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (!fileId && match2) fileId = match2[1];
  if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
  return url;
}

// ── UPDATE LOCATIONS ──
function updateLocations(props) {
  const uniqueLocations = [...new Set(
    props.map(p => p.location ? p.location.split(',').pop().trim() : '').filter(loc => loc)
  )].sort();

  const locationsUl = document.getElementById('footerLocations');
  if (locationsUl) {
    locationsUl.innerHTML = uniqueLocations.map(location =>
      `<li><a href="#properties" data-location="${location}">${location}</a></li>`
    ).join('');
  }

  const searchSelect = document.getElementById('searchLocation');
  if (searchSelect) {
    searchSelect.innerHTML = '<option>All Cities</option>';
    uniqueLocations.forEach(location => {
      const option = document.createElement('option');
      option.value = location;
      option.textContent = location;
      searchSelect.appendChild(option);
    });
  }
  attachFooterListeners();
}

// ── FILTER ──
function parsePrice(value) {
  if (value == null) return 0;
  const digits = ('' + value).replace(/[^0-9]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

function filterProperties() {
  const loc = document.getElementById('searchLocation').value;
  const type = document.getElementById('searchType').value;
  const price = document.getElementById('searchPrice').value;

  const priceBounds = { min: 0, max: Infinity };
  if (price === 'Under ₱5M') { priceBounds.max = 5_000_000; }
  else if (price === '₱5M – ₱15M') { priceBounds.min = 5_000_000; priceBounds.max = 15_000_000; }
  else if (price === '₱15M – ₱30M') { priceBounds.min = 15_000_000; priceBounds.max = 30_000_000; }
  else if (price === '₱30M+') { priceBounds.min = 30_000_000; }

  const filtered = _allProperties.filter(p => {
    if (loc !== 'All Cities' && (!p.location || p.location.split(',').pop().trim().toLowerCase() !== loc.toLowerCase())) return false;
    if (type !== 'All Types' && p.type && p.type.toLowerCase() !== type.toLowerCase()) return false;
    const propertyPrice = parsePrice(p.price);
    if (propertyPrice < priceBounds.min) return false;
    if (propertyPrice > priceBounds.max) return false;
    return true;
  });

  renderGrid(filtered);
  document.getElementById('properties').scrollIntoView({ behavior: 'smooth' });
}
window.filterProperties = filterProperties;

// ── ALL PROPERTIES MODAL ──
function openAllPropertiesModal() {
  document.body.classList.add('modal-open');
  const grid = document.getElementById('allPropertiesGrid');
  if (!_allProperties || _allProperties.length === 0) {
    grid.innerHTML = `<div class="no-properties">
      <div style="font-size:2.5rem;margin-bottom:12px;">🏠</div>
      <p style="font-size:1.1rem;">No properties found</p>
    </div>`;
  } else {
    let grouped = {};
    _allProperties.forEach(p => {
      const type = (p.type || 'Other').trim();
      let normalizedType = type;
      if (type.toLowerCase() === 'villa') normalizedType = 'Villa';
      if (type.toLowerCase() === 'house') normalizedType = 'House';
      if (type.toLowerCase() === 'condo' || type.toLowerCase() === 'condominium') normalizedType = 'Condo';
      if (type.toLowerCase() === 'apartment') normalizedType = 'Apartment';
      if (type.toLowerCase() === 'commercial') normalizedType = 'Commercial';
      if (type.toLowerCase().includes('lot')) normalizedType = 'Lot Only';
      if (!grouped[normalizedType]) grouped[normalizedType] = [];
      grouped[normalizedType].push(p);
    });

    Object.keys(grouped).forEach(type => {
      grouped[type].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    });

    let html = '';
    let featured = _allProperties.filter(p => p.featured);
    if (featured.length > 0) {
      html += '<h3 style="margin-top:0;color:var(--accent);">⭐ Featured Properties</h3>';
      html += '<div class="property-grid">' + featured.map(p => generatePropertyCard(p)).join('') + '</div>';
    }

    const allTypes = ['Villa', 'House', 'Condo', 'Apartment', 'Commercial', 'Lot Only', 'Vacant Lot'];
    Object.keys(grouped).forEach(type => {
      if (!allTypes.includes(type) && type !== 'Other') allTypes.push(type);
    });
    if (grouped['Other']) allTypes.push('Other');

    allTypes.forEach(type => {
      const items = grouped[type] || [];
      const typeId = type.toLowerCase().replace(/\s+/g, '-');
      html += `<h3>${type}</h3>`;
      if (items.length > 0) {
        html += `<div class="property-grid" id="carousel-${typeId}">` + items.map(p => generatePropertyCard(p)).join('') + '</div>';
      } else {
        html += `<div class="no-properties" style="text-align:center;padding:40px;color:var(--mid);">
          <div style="font-size:2.5rem;margin-bottom:12px;">🏠</div>
          <p>No ${type.toLowerCase()} properties available</p>
        </div>`;
      }
    });

    grid.innerHTML = html;
  }
  document.getElementById('allPropertiesModal').classList.add('open');
}

function generatePropertyCard(p) {
  const firstImage = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : p.image || '';
  const imgUrl = convertDriveUrl(firstImage) || 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=600&q=80';
  return `
    <div class="property-card" data-id="${p.id}" onclick="openModal('${p.id}'); closeAllPropertiesModal();">
      <div class="property-img">
        <img src="${imgUrl}" alt="${p.name}" loading="lazy" decoding="async">
        <div class="property-badge ${p.featured ? 'featured' : ''}">${p.featured ? '⭐ Featured' : p.status || 'For Sale'}</div>
      </div>
      <div class="property-body">
        <div class="property-type">${p.type || 'Property'}</div>
        <div class="property-name">${p.name}</div>
        <div class="property-location">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${p.location}
        </div>
        <div class="property-specs">
          <div class="spec-item"><div class="spec-icon">🛏</div>${p.beds || '–'} Beds</div>
          <div class="spec-item"><div class="spec-icon">🚿</div>${p.baths || '–'} Baths</div>
          <div class="spec-item"><div class="spec-icon">📐</div>${p.area || '–'}</div>
        </div>
        <div class="property-footer">
          <div class="property-price">₱${p.price}<span> / asking</span></div>
          <button class="btn-details">Details →</button>
        </div>
      </div>
    </div>
  `;
}

function closeAllPropertiesModal() {
  document.getElementById('allPropertiesModal').classList.remove('open');
  document.body.classList.remove('modal-open');
}
window.openAllPropertiesModal = openAllPropertiesModal;
window.closeAllPropertiesModal = closeAllPropertiesModal;

document.getElementById('allPropertiesModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeAllPropertiesModal();
});

// Auto-filter on change
document.getElementById('searchLocation').addEventListener('change', filterProperties);
document.getElementById('searchType').addEventListener('change', filterProperties);
document.getElementById('searchPrice').addEventListener('change', filterProperties);

// ── MODAL ──
let currentImageIndex = 0;
let currentImages = [];

function openModal(id) {
  const p = _allProperties.find(x => x.id === id);
  if (!p) return;

  currentImages = Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image || ''];
  currentImageIndex = 0;

  updateModalImage();
  setupCarouselIndicators();

  document.getElementById('modalName').textContent = p.name;
  document.getElementById('modalBadge').textContent = (p.featured ? '⭐ Featured · ' : '') + (p.type || 'Property') + ' · ' + (p.status || 'For Sale');
  document.getElementById('modalBadge').className = 'property-badge' + (p.featured ? ' featured' : '');
  document.getElementById('modalLocation').innerHTML = `📍 ${p.location}`;
  document.getElementById('modalDesc').textContent = p.desc || 'Detailed description not available. Contact us for more information.';
  document.getElementById('modalPrice').textContent = '₱' + p.price;
  document.getElementById('modalSpecs').innerHTML = `
    <div class="spec-item"><div class="spec-icon">🛏</div><strong>${p.beds || '–'}</strong>&nbsp;Bedrooms</div>
    <div class="spec-item"><div class="spec-icon">🚿</div><strong>${p.baths || '–'}</strong>&nbsp;Bathrooms</div>
    <div class="spec-item"><div class="spec-icon">📐</div><strong>${p.area || '–'}</strong>&nbsp;Floor Area</div>
  `;
  document.getElementById('propertyModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
window.openModal = openModal;

function updateModalImage() {
  const imgElement = document.getElementById('modalImg');
  const imgUrl = convertDriveUrl(currentImages[currentImageIndex]);

  preloadImage(convertDriveUrl(currentImages[(currentImageIndex + 1) % currentImages.length]));
  preloadImage(convertDriveUrl(currentImages[currentImageIndex === 0 ? currentImages.length - 1 : currentImageIndex - 1]));

  imgElement.classList.add('fade-out');
  setTimeout(() => {
    imgElement.src = imgUrl || 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800&q=80';
    imgElement.classList.remove('fade-out');
  }, 150);

  imgElement.onerror = function() {
    this.src = 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800&q=80';
  };
}

function preloadImage(url) {
  if (!url) return;
  const img = new Image();
  img.src = url;
}

function setupCarouselIndicators() {
  const indicatorsContainer = document.getElementById('carouselIndicators');
  const prevBtn = document.querySelector('.carousel-btn.prev');
  const nextBtn = document.querySelector('.carousel-btn.next');
  indicatorsContainer.innerHTML = '';

  if (currentImages.length <= 1) {
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    indicatorsContainer.style.display = 'none';
    return;
  }

  if (prevBtn) prevBtn.style.display = 'flex';
  if (nextBtn) nextBtn.style.display = 'flex';
  indicatorsContainer.style.display = 'flex';

  currentImages.forEach((_, index) => {
    const indicator = document.createElement('div');
    indicator.className = 'carousel-indicator' + (index === currentImageIndex ? ' active' : '');
    indicator.onclick = () => goToImage(index);
    indicatorsContainer.appendChild(indicator);
  });
}

function nextImage() {
  if (currentImages.length <= 1) return;
  currentImageIndex = (currentImageIndex + 1) % currentImages.length;
  updateModalImage(); updateIndicators();
}

function prevImage() {
  if (currentImages.length <= 1) return;
  currentImageIndex = currentImageIndex === 0 ? currentImages.length - 1 : currentImageIndex - 1;
  updateModalImage(); updateIndicators();
}

function goToImage(index) {
  currentImageIndex = index;
  updateModalImage(); updateIndicators();
}

function updateIndicators() {
  document.querySelectorAll('.carousel-indicator').forEach((indicator, index) => {
    indicator.classList.toggle('active', index === currentImageIndex);
  });
}

window.nextImage = nextImage;
window.prevImage = prevImage;

function closeModal() {
  document.getElementById('propertyModal').classList.remove('open');
  document.body.style.overflow = '';
}
window.closeModal = closeModal;

function toggleFullscreen() {
  const img = document.getElementById('modalImg');
  if (!document.fullscreenElement) {
    (img.requestFullscreen || img.webkitRequestFullscreen || img.msRequestFullscreen)?.call(img);
  } else {
    (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen)?.call(document);
  }
}

document.addEventListener('fullscreenchange', () => {
  const img = document.getElementById('modalImg');
  img.classList.toggle('fullscreen-landscape', !!document.fullscreenElement && window.innerWidth <= 600);
});
window.toggleFullscreen = toggleFullscreen;

document.getElementById('propertyModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// Touch/swipe
let touchStartX = 0;
document.getElementById('modalImg').addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; });
document.getElementById('modalImg').addEventListener('touchend', e => {
  const diff = e.changedTouches[0].screenX - touchStartX;
  if (Math.abs(diff) > 50) diff < 0 ? nextImage() : prevImage();
});

// ── NAV SCROLL ──
window.addEventListener('scroll', () => {
  document.getElementById('mainNav').classList.toggle('scrolled', window.scrollY > 60);
});

// ── SCROLL REVEAL ──
function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}
initReveal();

// ── COUNTER ANIMATION ──
function animateCounters() {
  document.querySelectorAll('.stat-num[data-target]').forEach(el => {
    const target = parseInt(el.getAttribute('data-target'));
    const suffix = el.querySelector('span').textContent;
    let current = 0;
    const step = target / 60;
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      const display = target >= 1000 ? Math.round(current).toLocaleString() : Math.round(current);
      el.innerHTML = display + '<span>' + suffix + '</span>';
      if (current >= target) clearInterval(interval);
    }, 25);
  });
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { animateCounters(); statsObserver.disconnect(); } });
}, { threshold: 0.5 });
statsObserver.observe(document.querySelector('.stats-bar'));

if (!window._loadProperties) {
  window._renderProperties(window._demoProperties);
}

// ── FOOTER FILTER LISTENERS ──
function attachFooterListeners() {
  document.querySelectorAll('.footer-col a[data-type], .footer-col a[data-location]').forEach(link => {
    link.addEventListener('click', () => {
      const type = link.getAttribute('data-type');
      const location = link.getAttribute('data-location');
      let filtered = _allProperties.slice();
      if (type) filtered = filtered.filter(p => p.type === type);
      if (location) filtered = filtered.filter(p => p.location && p.location.split(',').pop().trim() === location);
      renderGrid(filtered);
    });
  });
}
attachFooterListeners();

// ── CONTACT FORM ──
function initContactForm() {
  const submitBtn = document.querySelector('.form-submit');
  if (!submitBtn) return;

  submitBtn.addEventListener('click', async () => {
    // Gather fields
    const firstName  = document.querySelector('input[placeholder="Juan"]')?.value.trim();
    const lastName   = document.querySelector('input[placeholder="dela Cruz"]')?.value.trim();
    const email      = document.querySelector('input[type="email"]')?.value.trim();
    const phone      = document.querySelector('input[type="tel"]')?.value.trim();
    const interest   = document.querySelector('.contact-form-wrap select')?.value;
    const message    = document.querySelector('textarea')?.value.trim();

    // Basic validation
    if (!firstName || !lastName || !email || !message) {
      showFormToast('Please fill in all required fields.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showFormToast('Please enter a valid email address.', 'error');
      return;
    }

    // Disable button + show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      const messagesRef = ref(db, 'messages');
      const newMsgRef = push(messagesRef);
      await set(newMsgRef, {
        firstName,
        lastName,
        email,
        phone:    phone    || '',
        interest: interest || '',
        message,
        sentAt:   Date.now(),
        read:     false
      });

      // Success
      submitBtn.textContent = '✓ Message Sent!';
      submitBtn.style.background = '#4CAF88';

      // Clear fields
      document.querySelector('input[placeholder="Juan"]').value      = '';
      document.querySelector('input[placeholder="dela Cruz"]').value  = '';
      document.querySelector('input[type="email"]').value             = '';
      document.querySelector('input[type="tel"]').value               = '';
      document.querySelector('.contact-form-wrap select').value       = 'Select type...';
      document.querySelector('textarea').value                        = '';

      // Reset button after 3s
      setTimeout(() => {
        submitBtn.disabled  = false;
        submitBtn.textContent = 'Send Message →';
        submitBtn.style.background = '';
      }, 3000);

    } catch(err) {
      console.error('Message send failed:', err);
      submitBtn.disabled  = false;
      submitBtn.textContent = 'Send Message →';
      showFormToast('Failed to send. Please try again.', 'error');
    }
  });
}

// Small in-page toast for the contact form
function showFormToast(msg, type = 'info') {
  // Remove existing
  document.querySelectorAll('.form-toast').forEach(t => t.remove());

  const colors = { error: '#E05555', success: '#4CAF88', info: '#C8A96E' };
  const toast = document.createElement('div');
  toast.className = 'form-toast';
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
    background: ${colors[type]}; color: #fff;
    padding: 12px 24px; border-radius: 999px;
    font-size: 0.875rem; font-weight: 500;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    z-index: 9999; animation: slideUp 0.3s ease;
    white-space: nowrap;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}