const mostradas = new Set(); // para no repetir fotos

categorias[cat].forEach(plato => {
  const div = document.createElement("div");
  div.className = "menu-item";

  // mostrar imagen solo una vez por categoría
  let imagenHTML = "";
  if (!mostradas.has(cat) && plato.Imagen) {
    const imagenSrc = plato.Imagen.startsWith('http')
      ? plato.Imagen
      : `img/${plato.Imagen}`;
    imagenHTML = `<img src="${imagenSrc}" alt="${cat}" class="menu-foto">`;
    mostradas.add(cat);
  }

  div.innerHTML = `
    ${imagenHTML}
    <div class="info">
      <h3>${plato.Plato}</h3>
      <p>${plato.Descripcion || ""}</p>
    </div>
    <span class="price">$${Number(plato.Precio).toLocaleString('es-AR')}</span>
  `;
  section.appendChild(div);
});
