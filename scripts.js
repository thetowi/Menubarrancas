document.addEventListener('DOMContentLoaded', async () => {
  console.log('✅ App iniciando...');

  // =========================
  // CONFIG FIREBASE
  // =========================
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js");
  const { getDatabase, ref, get, child } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js");

  const firebaseConfig = {
    apiKey: "AIzaSyCe67XEXCVCsCLxRIfGDCWmoW190toBVkE",
    authDomain: "menubarrancas-b648a.firebaseapp.com",
    databaseURL: "https://menubarrancas-b648a-default-rtdb.firebaseio.com",
    projectId: "menubarrancas-b648a",
    storageBucket: "menubarrancas-b648a.firebasestorage.app",
    messagingSenderId: "712270431648",
    appId: "1:712270431648:web:098c53ed6d248eb3f610c5"
  };

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  const menu = document.getElementById("menu");

  // =========================
  // HORARIO MENÚ DEL DÍA
  // =========================
  const ahora = new Date();
  const totalMinutos = ahora.getHours() * 60 + ahora.getMinutes();
  const dentroDelHorario = totalMinutos >= 750 && totalMinutos <= 900;

  const menuDiaLink = document.querySelector(".menu-dia-link");
  if (menuDiaLink) {
    menuDiaLink.classList.toggle("destacado", dentroDelHorario);
  }

  // =========================
  // MENÚ HAMBURGUESA
  // =========================
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('menuNav');

    // === 2. MENÚ HAMBURGUESA + SCROLL SUAVE ===
    const toggle = document.getElementById('menuToggle');
    const nav = document.getElementById('menuNav');

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
  const loading = menu.querySelector("p");

    if (loading) {
      loading.classList.add("fade-out");

      setTimeout(() => {
        menu.innerHTML = "";
      }, 300);
    }
  menu.style.display = "block";
  loading.textContent = "Cargando carta...";
  // =========================
  // MENÚ DEL DÍA
  // =========================
  async function cargarMenuDia() {
    try {
      const snapshot = await get(child(ref(db), "entrada/menu-dia"));
      if (!snapshot.exists()) return;

      const data = snapshot.val();

      const section = document.createElement("section");
      section.className = "menu-dia";
      section.id = "menu-dia";

      let headerHTML = `
        <div class="menu-dia-header ${dentroDelHorario ? "" : "fuera-horario"}">
          <h2>${data.Categoria}</h2>
          <p class="horario">Disponible de ${data.Horario}</p>
          <p class="precio">
            $${Number(data.Precio).toLocaleString("es-AR")}
            <br>
            <small class="iva"><em>S/IMP. NAC: $${(data.Precio * 0.8265).toLocaleString("es-AR")}</em></small>
          </p>
      `;

      if (!dentroDelHorario) {
        headerHTML += `
          <p class="aviso">❌ Fuera de horario ❌</p>
          <button id="verMenuIgualmente" class="btn-ver-menu">Ver menú igualmente</button>
        `;
      }

      headerHTML += `</div>`;
      section.innerHTML = headerHTML;

      const contenido = document.createElement("div");
      contenido.className = "menu-dia-opciones";

      contenido.innerHTML = `
        <div class="columna"><h3>Platos</h3><ul>${(data.Platos || []).map(p => `<li>${p}</li>`).join('')}</ul></div>
        <div class="columna"><h3>Postres</h3><ul>${(data.Postres || []).map(p => `<li>${p}</li>`).join('')}</ul></div>
        <div class="columna"><h3>Bebidas</h3><ul>${(data.Bebidas || []).map(p => `<li>${p}</li>`).join('')}</ul></div>
      `;

      section.appendChild(contenido);
      menu.appendChild(section);

      const btn = section.querySelector("#verMenuIgualmente");

      function abrirSuave(el) {
        el.classList.add("open");
        el.style.maxHeight = el.scrollHeight + "px";
      }

      function cerrarSuave(el) {
        el.style.maxHeight = "0px";
        el.classList.remove("open");
      }

      // Estado inicial
      contenido.style.maxHeight = "0px";
      contenido.style.overflow = "hidden";
      contenido.style.transition = "max-height 0.4s ease";

      // Si está dentro del horario → abrir automáticamente
      if (dentroDelHorario) {
        abrirSuave(contenido);
      }

      if (btn) {
        btn.addEventListener("click", () => {
          const abierto = contenido.classList.contains("open");

          if (abierto) {
            cerrarSuave(contenido);
            btn.textContent = "Ver menú igualmente";
          } else {
            abrirSuave(contenido);
            btn.textContent = "Ocultar menú";
          }
        });
      }

    } catch (e) {
      console.error("Error menú del día:", e);
    }
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
  // =========================
  // RENDER CATEGORÍA
  // =========================
  function renderCategoria(id, data) {
    const section = document.createElement("section");
    section.className = "menu-section";
    section.id = id;

    section.innerHTML = `
      <div class="section-header">
        <h2>${data.Categoria || id}</h2>
      </div>
    `;

    const items = data.Platos || data.Bebidas || [];
    Object.values(items).forEach(item => {
      const precio = item.Precio || item.precio;

      section.innerHTML += `
        <div class="menu-item">
          <div class="info">
            <h3>${item.Plato || item.bebida || ""}</h3>
            <p>${item.Descripcion || ""}</p>
          </div>
          <span class="price">
            ${
              precio
                ? `$${Number(precio).toLocaleString("es-AR")}`
                : ""
            }
            ${
              precio
                ? `<br><small class="iva"><em>S/IMP. NAC: $${(Number(precio) * 0.8265).toLocaleString("es-AR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}</em></small>`
                : ""
            }
          </span>
        </div>
      `;
    });

    menu.appendChild(section);
  }

  // =========================
  // CARGAR PLATOS
  // =========================
  async function cargarPlatos() {
    const snapshot = await get(child(ref(db), "entrada/platos"));
    if (!snapshot.exists()) return;

    const data = snapshot.val();

    const orden = [
      "entradas",
      "elaborados",
      "grillados-guarnicion",
      "guarnicion",
      "pastas",
      "ensaladas",
      "infantil",
      "postres"
    ];

    orden.forEach(k => data[k] && renderCategoria(k, data[k]));
  }

  // =========================
  // CARGAR BEBIDAS
  // =========================
  async function cargarBebidas() {
    const snapshot = await get(child(ref(db), "entrada/bebidas"));
    if (!snapshot.exists()) {
      console.warn("❌ No hay bebidas");
      return;
    }

    const data = snapshot.val();
    console.log("🍷 Bebidas:", data);

    // 🔹 Función recursiva para recorrer TODO
    function recorrer(obj) {
      Object.entries(obj).forEach(([key, value]) => {

        // Si tiene items (caso final)
        if (value.Bebidas || value.Platos) {
          const cleanId = key
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "")
            .replace(/-/g, "");

          renderCategoria(cleanId, value);
        }

        // Si es un objeto intermedio (ej: con-alcohol)
        else if (typeof value === "object") {
          recorrer(value);
        }

      });
    }

  recorrer(data);
}

  // =========================
  // SCROLL EFFECT
  // =========================
  function iniciarScroll() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        entry.target.classList.toggle("active", entry.intersectionRatio > 0.6);
      });
    }, { threshold: [0.4, 0.6, 0.8] });

    document.querySelectorAll('.section-header').forEach(el => io.observe(el));
  }

  // =========================
  // INIT
  // =========================
  await cargarMenuDia();
  await cargarPlatos();
  await cargarBebidas();
  iniciarScroll();

  console.log('✅ Menú cargado correctamente');
});
