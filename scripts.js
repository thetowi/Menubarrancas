document.addEventListener('DOMContentLoaded', async () => {
  console.log('✅ DOM listo, iniciando app');

  // === DESTACAR "MENÚ DEL DÍA" SI ESTÁ EN HORARIO ===
  const ahora = new Date();
  const hora = ahora.getHours();
  const minutos = ahora.getMinutes();
  const totalMinutos = hora * 60 + minutos;
  // Horario de 12:30 a 15:00 (750 a 900 minutos)
  const dentroDelHorario = totalMinutos >= 750 && totalMinutos <= 900;

  const menuDiaLink = document.querySelector(".menu-dia-link");

  if (menuDiaLink) {
    if (dentroDelHorario) {
      menuDiaLink.classList.add("destacado");
    } else {
      menuDiaLink.classList.remove("destacado");
    }
  }
  // ===== MENÚ HAMBURGUESA + SCROLL SUAVE =====
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('menuNav');

  if (toggle && nav) {
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

  // ===== CONFIGURAR FIREBASE =====
  import("https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js").then(async ({ initializeApp }) => {
    const { getDatabase, ref, get, child } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js");

    const firebaseConfig = {
      apiKey: "AIzaSyAjPnsWU7bdiRl12bYM-UdgpEJZcePBcnE",
      authDomain: "menubarrancas.firebaseapp.com",
      databaseURL: "https://menubarrancas-default-rtdb.firebaseio.com",
      projectId: "menubarrancas",
      storageBucket: "menubarrancas.firebasestorage.app",
      messagingSenderId: "415717810155",
      appId: "1:415717810155:web:8a41095ab084acea65c3ae"
    };

    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);

    // ===== FUNCIÓN PARA CARGAR CARTA =====
    async function cargarCarta() {
      const menu = document.getElementById('menu');
      try {
        console.log('📡 Obteniendo datos desde Firebase...');
        const snapshot = await get(child(ref(db), '/'));
        if (!snapshot.exists()) throw new Error('No se encontraron datos en la base');

        const data = snapshot.val();
        console.log('📦 Datos recibidos:', data);

        // Limpiar menú
        menu.innerHTML = '';

        // Recorrer categorías (entradas, elaborados, etc.)
        Object.entries(data).forEach(([id, categoria]) => {
          const section = document.createElement('section');
          section.className = 'menu-section';
          section.id = id;

          // Header
          const headerDiv = document.createElement('div');
          headerDiv.className = 'section-header';
          const h2 = document.createElement('h2');
          h2.textContent = categoria.Categoria;
          headerDiv.appendChild(h2);
          section.appendChild(headerDiv);

          // Platos
          if (Array.isArray(categoria.Platos)) {
            categoria.Platos.forEach(plato => {
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
          }

          menu.appendChild(section);
        });

        console.log('✅ Carta renderizada desde Firebase');
        iniciarEfectoScroll();

      } catch (err) {
        console.error('💥 Error al cargar la carta:', err);
        document.getElementById('menu').innerHTML = '<p>Error al cargar la carta.</p>';
      }
    }

    // ===== EFECTO DE SCROLL EN LOS TÍTULOS =====
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
});
