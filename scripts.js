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
      const menuContainer = document.getElementById('menu');
      try {
        console.log('📡 Obteniendo datos completos...');
        // Pedimos la raíz "/" para ver TODO (menu-dia, platos, bebidas, etc.)
        const snapshot = await get(child(ref(db), '/')); 
        
        if (!snapshot.exists()) return;
    
        const data = snapshot.val();
        console.log('📦 Estructura completa recibida:', data);
    
        menuContainer.innerHTML = '';
    
        // 1. PROCESAR PLATOS Y BEBIDAS
        // Buscamos dentro de 'entrada/platos' y 'entrada/bebidas' si existen
        const categoriasBase = data.entrada || data; 
        
        // Unificamos todas las categorías posibles (platos y bebidas)
        const todasLasCategorias = { 
          ...(categoriasBase.platos || {}), 
          ...(categoriasBase.bebidas || {}) 
        };
    
        Object.entries(todasLasCategorias).forEach(([id, categoria]) => {
          // Ignorar si no es un objeto o no tiene platos/bebidas
          if (typeof categoria !== 'object' || (!categoria.Platos && !categoria.Bebidas)) return;
    
          const section = document.createElement('section');
          section.className = 'menu-section';
          section.id = id;
    
          section.innerHTML = `
            <div class="section-header">
              <h2>${categoria.Categoria || id}</h2>
            </div>
          `;
    
          const items = categoria.Platos || categoria.Bebidas || [];
          
          Object.values(items).forEach(item => {
            const precioNum = Number(item.Precio || item.precio);
            const precioFormat = !isNaN(precioNum) ? `$${precioNum.toLocaleString('es-AR')}` : '';
            
            const itemDiv = document.createElement('div');
            itemDiv.className = 'menu-item';
            itemDiv.innerHTML = `
              <div class="info">
                <h3>${item.Plato || item.bebida || 'Sin nombre'}</h3>
                <p>${item.Descripcion || ''}</p>
              </div>
              <span class="price">${precioFormat}</span>
            `;
            section.appendChild(itemDiv);
          });
    
          menuContainer.appendChild(section);
        });
    
        console.log('✅ Carta completa renderizada');
        if (typeof iniciarEfectoScroll === 'function') iniciarEfectoScroll();
    
      } catch (err) {
        console.error('💥 Error:', err);
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
    window.addEventListener("scroll", () => {
      document.querySelectorAll(".section-header").forEach(header => {
        const rect = header.getBoundingClientRect();
        if (rect.top <= 0 && rect.bottom > 0) {
          header.classList.add("is-sticky");
        } else {
          header.classList.remove("is-sticky");
        }
      });
    });

    cargarCarta();
  });
});
