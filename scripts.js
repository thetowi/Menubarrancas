document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM listo, iniciando app');

    // === DESTACAR "MENÚ DEL DÍA" SI ESTÁ EN HORARIO ===
    const ahora = new Date();
    const totalMinutos = ahora.getHours() * 60 + ahora.getMinutes();
    const dentroDelHorario = totalMinutos >= 750 && totalMinutos <= 900;

    const menuDiaLink = document.querySelector(".menu-dia-link");
    if (menuDiaLink) {
        dentroDelHorario ? menuDiaLink.classList.add("destacado") : menuDiaLink.classList.remove("destacado");
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

        const app = initializeApp(firebaseConfig);
        const db = getDatabase(app);

        // ===== FUNCIÓN PARA CARGAR CARTA =====
        async function cargarCarta() {
            const menuContainer = document.getElementById('menu');
            if (!menuContainer) return;

            try {
                console.log('📡 Obteniendo datos desde Firebase...');
                const snapshot = await get(child(ref(db), '/'));
                if (!snapshot.exists()) return;

                const data = snapshot.val();
                menuContainer.innerHTML = '';

                const base = data.entrada || data;
                const grupos = ['platos', 'bebidas'];

                grupos.forEach(grupo => {
                    if (base[grupo]) {
                        Object.entries(base[grupo]).forEach(([id, categoria]) => {
                            renderSeccion(id, categoria, menuContainer);
                        });
                    }
                });

                Object.entries(base).forEach(([id, contenido]) => {
                    if (!grupos.includes(id) && id !== 'menu-dia' && contenido.Categoria) {
                        renderSeccion(id, contenido, menuContainer);
                    }
                });

                console.log('✅ Carta completa renderizada');
                iniciarEfectoScroll();

            } catch (err) {
                console.error('💥 Error al cargar la carta:', err);
            }
        }
        function renderMenuDia(data, container) {
                const section = document.createElement("section");
                section.className = "menu-dia";
                section.id = "menu-dia";
                
                section.innerHTML = `
                    <div class="menu-dia-header ${dentroDelHorario ? "" : "fuera-horario"}">
                        <h2>${data.Categoria}</h2>
                        <p class="horario">Disponible de ${data.Horario}</p>
                        <p class="precio">$${Number(data.Precio).toLocaleString("es-AR")} <small>p/p</small></p>
                        ${!dentroDelHorario ? '<button id="btnVerDia" class="btn-ver-menu">Ver opciones igualmente</button>' : ''}
                    </div>
                    <div class="menu-dia-opciones ${dentroDelHorario ? 'open' : ''}" id="contDia" style="${dentroDelHorario ? '' : 'display:none;'}">
                        <div class="columna"><h3>Principales</h3><ul>${(data.Platos || []).map(p => `<li>${p}</li>`).join('')}</ul></div>
                        <div class="columna"><h3>Postres</h3><ul>${(data.Postres || []).map(p => `<li>${p}</li>`).join('')}</ul></div>
                        <div class="columna"><h3>Bebidas</h3><ul>${(data.Bebidas || []).map(p => `<li>${p}</li>`).join('')}</ul></div>
                    </div>
                `;
                container.appendChild(section);
    
                // Evento para el botón si está fuera de horario
                const btn = section.querySelector("#btnVerDia");
                if (btn) {
                    btn.onclick = () => {
                        const cont = section.querySelector("#contDia");
                        const isHidden = cont.style.display === "none";
                        cont.style.display = isHidden ? "flex" : "none";
                        btn.textContent = isHidden ? "Ocultar opciones" : "Ver opciones igualmente";
                    };
                }
            }
        function renderSeccion(id, categoria, container) {
            const items = categoria.Platos || categoria.Bebidas || [];
            if (Object.keys(items).length === 0) return;

            const section = document.createElement('section');
            section.className = 'menu-section';
            section.id = id;
            section.innerHTML = `<div class="section-header"><h2>${categoria.Categoria || id}</h2></div>`;

            Object.values(items).forEach(item => {
                const nombre = item.Plato || item.bebida || 'Sin nombre';
                const precioNum = Number(item.Precio || item.precio);
                const precioFormat = !isNaN(precioNum) && precioNum > 0 ? `$${precioNum.toLocaleString('es-AR')}` : '';

                const itemDiv = document.createElement('div');
                itemDiv.className = 'menu-item';
                itemDiv.innerHTML = `
                    <div class="info">
                        <h3>${nombre}</h3>
                        <p>${item.Descripcion || ''}</p>
                    </div>
                    <span class="price">${precioFormat}</span>
                `;
                section.appendChild(itemDiv);
            });
            container.appendChild(section);
        }

        function iniciarEfectoScroll() {
            const io = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.intersectionRatio > 0.6) entry.target.classList.add('active');
                    else entry.target.classList.remove('active');
                });
            }, { threshold: [0.4, 0.6, 0.8] });
            document.querySelectorAll('.section-header').forEach(h => io.observe(h));
        }

        // Ejecutar carga inicial de Firebase
        cargarCarta();

    }).catch(err => console.error("❌ Error Firebase:", err));

    // ===== STICKY HEADER SCROLL =====
    window.addEventListener("scroll", () => {
        document.querySelectorAll(".section-header").forEach(header => {
            const rect = header.getBoundingClientRect();
            if (rect.top <= 0 && rect.bottom > 0) header.classList.add("is-sticky");
            else header.classList.remove("is-sticky");
        });
    });
});
