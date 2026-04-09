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
  // Usamos la versión 10.7.1 que es altamente estable para importaciones dinámicas
  import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js").then(async ({ initializeApp }) => {
      const { getDatabase, ref, get, child } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js");
  
      const firebaseConfig = {
          apiKey: "AIzaSyAjPnsWU7bdiRl12bYM-UdgpEJZcePBcnE",
          authDomain: "menubarrancas.firebaseapp.com",
          databaseURL: "https://menubarrancas-default-rtdb.firebaseio.com",
          projectId: "menubarrancas",
          storageBucket: "menubarrancas.firebasestorage.app",
          messagingSenderId: "415717810155",
          appId: "1:415717810155:web:8a41095ab084acea65c3ae"
      };
  
      // Inicialización
      const app = initializeApp(firebaseConfig);
      const db = getDatabase(app);
  
      // ===== FUNCIÓN PARA CARGAR CARTA =====
      async function cargarCarta() {
          const menuContainer = document.getElementById('menu');
          if (!menuContainer) return;
  
          try {
              console.log('📡 Obteniendo datos desde Firebase...');
              // Traemos la raíz para procesar todo el contenido
              const snapshot = await get(child(ref(db), '/')); 
              
              if (!snapshot.exists()) {
                  console.warn('⚠️ No se encontraron datos en la base.');
                  return;
              }
  
              const data = snapshot.val();
              console.log('📦 Datos recibidos:', data);
              
              // Limpiar contenedor antes de renderizar
              menuContainer.innerHTML = '';
  
              // Detectar si los datos están envueltos en "entrada" o vienen directos
              const base = data.entrada || data;
  
              // Creamos una lista de secciones a procesar (platos, bebidas, etc.)
              // Esto permite que el código entre un nivel más profundo
              const grupos = ['platos', 'bebidas'];
              
              grupos.forEach(grupo => {
                  if (base[grupo]) {
                      // Recorremos cada categoría dentro de platos/bebidas (Ej: Entradas, Pastas, Cervezas)
                      Object.entries(base[grupo]).forEach(([id, categoria]) => {
                          renderSeccion(id, categoria, menuContainer);
                      });
                  }
              });
  
              // También procesamos categorías que no estén dentro de platos/bebidas pero tengan formato de categoría
              Object.entries(base).forEach(([id, contenido]) => {
                  if (!grupos.includes(id) && id !== 'menu-dia' && contenido.Categoria) {
                      renderSeccion(id, contenido, menuContainer);
                  }
              });
  
              console.log('✅ Carta completa renderizada');
              
              // Disparar efectos visuales si existen
              if (typeof iniciarEfectoScroll === 'function') {
                  iniciarEfectoScroll();
              }
  
          } catch (err) {
              console.error('💥 Error al cargar la carta:', err);
              menuContainer.innerHTML = '<p style="text-align:center; color:white;">Error al cargar el menú. Por favor, intente más tarde.</p>';
          }
      }
  
      // ===== FUNCIÓN AUXILIAR PARA RENDERIZAR SECCIONES =====
      function renderSeccion(id, categoria, container) {
          // Validar que la categoría tenga items
          const items = categoria.Platos || categoria.Bebidas || [];
          if (Object.keys(items).length === 0) return;
  
          const section = document.createElement('section');
          section.className = 'menu-section';
          section.id = id;
  
          section.innerHTML = `
              <div class="section-header">
                  <h2>${categoria.Categoria || id}</h2>
              </div>
          `;
  
          // Iterar sobre los items de la categoría
          Object.values(items).forEach(item => {
              const nombre = item.Plato || item.bebida || 'Sin nombre';
              const desc = item.Descripcion || '';
              const precioNum = Number(item.Precio || item.precio);
              const precioFormat = !isNaN(precioNum) && precioNum > 0 
                  ? `$${precioNum.toLocaleString('es-AR')}` 
                  : '';
  
              const itemDiv = document.createElement('div');
              itemDiv.className = 'menu-item';
              itemDiv.innerHTML = `
                  <div class="info">
                      <h3>${nombre}</h3>
                      <p>${desc}</p>
                  </div>
                  <span class="price">${precioFormat}</span>
              `;
              section.appendChild(itemDiv);
          });
  
          container.appendChild(section);
      }
  
      // Ejecutar la carga inicial
      cargarCarta();
  
  }).catch(err => {
      console.error("❌ Error cargando los módulos de Firebase:", err);
  });
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
