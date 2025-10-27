document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ DOM listo, iniciando app');

  // ===== MENÚ HAMBURGUESA + SCROLL =====
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('menuNav');

  if (!toggle || !nav) {
    console.warn('⚠️ No se encontró #menuToggle o #menuNav');
  } else {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('active');
      document.body.classList.toggle('menu-open');
    });

    document.querySelectorAll('.menu-nav a').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const id = a.getAttribute('href').slice(1);
        const el = document.getElementById(id);
        if (!el) return;
        const y = el.getBoundingClientRect().top + window.scrollY - 110;
        window.scrollTo({ top: y, behavior: 'smooth' });
        nav.classList.remove('active');
        document.body.classList.remove('menu-open');
      });
    });
  }

  // ===== CARGAR DATOS GOOGLE SHEETS =====
  const API_URL = 'https://sheetdb.io/api/v1/kia309vxzlfie';
  const menu = document.getElementById('menu');

  async function cargarCarta() {
    try {
      console.log('📡 Fetch a:', API_URL);
      const res = await fetch(API_URL, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        menu.innerHTML = '<p>No hay datos para mostrar.</p>';
        console.warn('⚠️ Respuesta vacía o no es array:', data);
        return;
      }

      const categorias = {};
      data.forEach(item => {
        const id = (item.ID || '').trim();
        const nombre = (item.Categoria || '').trim();
        if (!id || !nombre) return;

        if (!categorias[id]) categorias[id] = { nombre, platos: [] };
        categorias[id].platos.push(item);
      });

      // Limpiar y renderizar secciones
      menu.innerHTML = '';
      Object.keys(categorias).forEach(id => {
        const { nombre, platos } = categorias[id];
        const section = document.createElement('section');
        section.className = 'menu-section';
        section.id = id;

        // Wrapper sticky para mejor centrado
        const headerDiv = document.createElement('div');
        headerDiv.className = 'section-header';

        const h2 = document.createElement('h2');
        h2.textContent = nombre;
        headerDiv.appendChild(h2);
        section.appendChild(headerDiv);

        platos.forEach(plato => {
          const div = document.createElement('div');
          div.className = 'menu-item';
          const precioNum = Number(plato.Precio);
          const precio = Number.isFinite(precioNum) ? precioNum.toLocaleString('es-AR') : '-';
          div.innerHTML = `
            <div class="info">
              <h3>${plato.Plato || ''}</h3>
              <p>${plato.Descripcion || ''}</p>
            </div>
            <span class="price">${precio === '-' ? '' : '$' + precio}</span>
          `;
          section.appendChild(div);
        });

        menu.appendChild(section);
      });

      console.log('✅ Carta renderizada');
      iniciarEfectoScroll(); // <-- activamos el efecto al terminar de cargar
    } catch (err) {
      console.error('💥 Error al cargar la carta:', err);
      menu.innerHTML = '<p>Error al cargar la carta.</p>';
    }
  }

  // ===== EFECTO DE SCROLL EN LOS TITULOS =====
  function iniciarEfectoScroll() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const header = entry.target;
        if (entry.intersectionRatio > 0.6) {
          header.classList.add('active');
        } else {
          header.classList.remove('active');
        }
      });
    }, { threshold: [0.4, 0.6, 0.8] });

    document.querySelectorAll('.section-header').forEach(h => io.observe(h));
  }

  cargarCarta();
});
