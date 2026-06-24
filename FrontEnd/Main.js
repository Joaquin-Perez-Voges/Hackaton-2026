// FrontEnd/Main.js — combinado: mantiene tu lógica actual (modoEdicion, generarMateria, etc.)
// y añade manejo robusto de /api/resumen para evitar parse errors cuando el servidor responde HTML.

// Estado global
let materiaSeleccionada = null
let modoEdicion = false

//Texto y nombre guardados para crear la materia
let textoGuardado = ''
let nombreGuardado = ''

/* -----------------------
   Inicialización / UI
   ----------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Si tu Index.html incluye la barra lateral y la vista de resumen, estas funciones las habilitan.
  if (document.getElementById('nav-mis-materias')) initSidebar()
  if (document.getElementById('btn-enviar-resumen')) bindResumenUI()
  cargarMaterias()
})

function initSidebar() {
  const btnMaterias = document.getElementById('nav-mis-materias')
  const btnResumen  = document.getElementById('nav-hacer-resumen')

  if (btnMaterias) btnMaterias.addEventListener('click', () => showView('materias'))
  if (btnResumen)  btnResumen.addEventListener('click', () => showView('resumen'))
}

function showView(view) {
  const vMaterias = document.getElementById('view-materias')
  const vResumen  = document.getElementById('view-resumen')
  const btnMaterias = document.getElementById('nav-mis-materias')
  const btnResumen  = document.getElementById('nav-hacer-resumen')

  if (!vMaterias || !vResumen) return

  if (view === 'materias') {
    vMaterias.classList.remove('oculto')
    vResumen.classList.add('oculto')
    btnMaterias?.classList.add('active')
    btnResumen?.classList.remove('active')
  } else {
    vMaterias.classList.add('oculto')
    vResumen.classList.remove('oculto')
    btnMaterias?.classList.remove('active')
    btnResumen?.classList.add('active')
  }
}

/* -----------------------
   VISTA: Mis materias
   (tu código existente)
   ----------------------- */

// Carga todas las materias guardadas del json
async function cargarMaterias() {
  try {
    const res = await fetch('/api/materias')
    const materias = await res.json()
    //Vacia la lista de materias y la vuelve a llenar
    const lista = document.getElementById('lista-materias')
    if (!lista) return
    lista.innerHTML = ''

    // Si no hay materias, mostrar un mensaje especial
    if (!Array.isArray(materias) || materias.length === 0) {
      lista.innerHTML = '<p style="color:#999; margin-bottom:1rem;">Todavía no hay materias. ¡Creá una!</p>'
      return
    }

    //Muestra cada materia en la lista y les crea su html
    materias.forEach(m => {
      // La cantidad de preguntas se lee de la última prueba generada
      const ultimaPrueba = m.pruebas && m.pruebas.length ? m.pruebas[m.pruebas.length - 1] : null
      const cantPreguntas = ultimaPrueba ? (ultimaPrueba.preguntas || []).length : 0
      const cantPruebas   = (m.pruebas || []).length

      // Crea el HTML de la materia
      const card = document.createElement('div')
      card.className = 'CartaMateria'
      card.innerHTML = `
        <a href="quiz.html?id=${m.id}">${m.nombre}</a>
        <div class="card-acciones">
          <span>${cantPreguntas} preguntas · ${cantPruebas} ${cantPruebas === 1 ? 'prueba' : 'pruebas'}</span>
          <button onclick="abrirOpciones(${m.id}, this)" class="btn-opciones">⋮</button>
        </div>
      `
      lista.appendChild(card)
    })
  } catch (err) {
    console.error('Error cargando materias:', err)
  }
}

// Función para cerrar todos los popups y limpiar los inputs
function cerrarPopups() {
  //Popup donde ingresas el nombre y texto de la materia
  document.getElementById('overlay-crear')?.classList.add('oculto')
  const inputNombre = document.getElementById('input-nombre')
  const inputTexto  = document.getElementById('input-texto')
  if (inputNombre) inputNombre.value = ''
  if (inputTexto) inputTexto.value = ''

  //Popup donde ingresas la cantidad de preguntas
  document.getElementById('overlay-cantidad')?.classList.add('oculto')
}

// Abre el panel de creación de materia
const BotonAbrirPanelCreacion = document.getElementById('btn-nuevo')
if (BotonAbrirPanelCreacion) BotonAbrirPanelCreacion.addEventListener('click', function () {
  modoEdicion = false
  document.getElementById('overlay-crear')?.classList.remove('oculto')
})

//Cierra el panel de creación de materia
const BotonCerrarPopup = document.getElementById('BotonCerrarPopup')
if (BotonCerrarPopup) BotonCerrarPopup.addEventListener('click', function () {
  cerrarPopups()
})

// Abre el panel de cantidad de preguntas y guarda el nombre y texto de la materia
const BotonCrearMateria = document.getElementById('BotonAbrePanelPreguntas')
if (BotonCrearMateria) BotonCrearMateria.addEventListener('click', async function () {

  if (modoEdicion) {
    try {
      await fetch(`/api/materias/${materiaSeleccionada}/nombre`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: document.getElementById('input-nombre').value.trim() })
      })
    } catch (e) {
      console.error('Error editando nombre:', e)
    }

    modoEdicion = false
    cerrarPopups()
    cargarMaterias()
    return
  }

  // Si no está editando, sigue el flujo normal
  const nombre = document.getElementById('input-nombre')?.value.trim()
  const texto = document.getElementById('input-texto')?.value.trim()

  if (!nombre) { alert('Ingresá un nombre válido para la materia.'); return }
  if (!texto)  { alert('Ingresá el texto a estudiar.'); return }

  nombreGuardado = nombre
  textoGuardado  = texto

  cerrarPopups()
  document.getElementById('overlay-cantidad')?.classList.remove('oculto')
})

// Cierra el panel de cantidad de preguntas
const BotonCerrarPopupPreguntas = document.getElementById('BotonCerrarPopupPreguntas')
if (BotonCerrarPopupPreguntas) BotonCerrarPopupPreguntas.addEventListener('click', function () {
  cerrarPopups()
})

// Llama a la función para generar la materia
const BotonCrearMateriaFinal = document.getElementById('BotonCrearMateria')
if (BotonCrearMateriaFinal) BotonCrearMateriaFinal.addEventListener('click', function () {
  generarMateria()
})

// Abre el menú de opciones para la materia seleccionada
function abrirOpciones(id, boton) {
  let menu = document.getElementById('menu-opciones')
  if (!menu) return
  
  // Si ya está abierto para la misma materia, cerrarlo
  if (!menu.classList.contains('oculto') && materiaSeleccionada === id) {
    menu.classList.add('oculto')
    materiaSeleccionada = null
    return
  }
  // Si está abierto para otra materia, cerrarlo primero
  materiaSeleccionada = id
  let rect = boton.getBoundingClientRect()
  menu.style.top  = `${rect.bottom + 6}px`
  menu.style.left = `${rect.right - 180}px`
  menu.classList.remove('oculto')
}

// Cerrar el menú de ajustes al clickear en cualquier otro lado
document.addEventListener('click', (e) => {
  const menu = document.getElementById('menu-opciones')
  if (!menu) return
  if (!menu.classList.contains('oculto') && !menu.contains(e.target) && !e.target.classList.contains('btn-opciones')) {
    menu.classList.add('oculto')
    materiaSeleccionada = null
  }
})

// Botones del menú de opciones
// Elimina la materia
const btnEliminarMateria = document.getElementById('btn-eliminar-materia')
if (btnEliminarMateria) btnEliminarMateria.addEventListener('click', async () => {
  document.getElementById('menu-opciones')?.classList.add('oculto')
  await eliminarMateria(materiaSeleccionada)
  materiaSeleccionada = null
})

// Ver resultados de la materia (idea futuro)
const btnVerResultados = document.getElementById('btn-ver-resultados')
if (btnVerResultados) btnVerResultados.addEventListener('click', async () => {
  document.getElementById('menu-opciones')?.classList.add('oculto')

  const res = await fetch('/api/materias')
  const materias = await res.json()
  const materia = materias.find(m => m.id === materiaSeleccionada)

  document.getElementById('resultados-titulo').textContent = `📊 ${materia.nombre}`

  const lista = document.getElementById('resultados-lista')
  lista.innerHTML = ''

  // Solo mostrar pruebas que ya fueron corregidas
  const pruebasRealizadas = materia.pruebas.filter(p => p.correctas !== undefined)

  if (pruebasRealizadas.length === 0) {
    lista.innerHTML = '<p style="color:#999; text-align:center;">Todavía no hay pruebas realizadas.</p>'
  } else {
    pruebasRealizadas.forEach((prueba, i) => {
      // Formatear fecha: "2026-06-24T12:29:33.091Z" → "24/06/2026"
      const fecha = prueba.fecha
        ? new Date(prueba.fecha).toLocaleDateString('es-AR')
        : 'Sin fecha'

      const pct   = Math.round((prueba.correctas / prueba.total) * 100)
      const emoji = pct === 100 ? '🎉' : pct >= 60 ? '👍' : '📚'

      const fila = document.createElement('div')
      fila.className = 'resultado-fila'
      fila.innerHTML = `
        <span>${emoji} Prueba ${i + 1} — ${fecha}</span>
        <span class="resultado-nota">${prueba.correctas} de ${prueba.total}</span>
      `
      // Diferencia con la prueba anterior
      if (i > 0) {
        const anterior = pruebasRealizadas[i - 1]
        const pctAnterior = (anterior.correctas / anterior.total) * 100
        const pctActual   = (prueba.correctas / prueba.total) * 100
        const diff        = Math.round(pctActual - pctAnterior)

        const diffDiv = document.createElement('div')
        diffDiv.className = 'resultado-diff'

        if (diff > 0) {
          diffDiv.textContent = `▲ Mejoraste un ${diff}% respecto a la prueba anterior`
          diffDiv.style.color = '#27ae60'
        } else if (diff < 0) {
          diffDiv.textContent = `▼ Bajaste un ${Math.abs(diff)}% respecto a la prueba anterior`
          diffDiv.style.color = '#e74c3c'
        } else {
          diffDiv.textContent = `— No tuviste cambios respecto a la prueba anterior`
          diffDiv.style.color = '#999'
        }

        lista.appendChild(diffDiv)
      }

      // Diferencia con la prueba anterior
      if (i > 0) {
        const anterior = pruebasRealizadas[i - 1]
        const pctAnterior = (anterior.correctas / anterior.total) * 100
        const pctActual   = (prueba.correctas / prueba.total) * 100
        const diff        = Math.round(pctActual - pctAnterior)

        const diffDiv = document.createElement('div')
        diffDiv.className = 'resultado-diff'

        if (diff > 0) {
          diffDiv.textContent = `▲ Mejoraste un ${diff}% respecto a la prueba anterior`
          diffDiv.style.color = '#27ae60'
        } else if (diff < 0) {
          diffDiv.textContent = `▼ Bajaste un ${Math.abs(diff)}% respecto a la prueba anterior`
          diffDiv.style.color = '#e74c3c'
        } else {
          diffDiv.textContent = `— No tuviste cambios respecto a la prueba anterior`
          diffDiv.style.color = '#999'
        }

        lista.appendChild(diffDiv)
      }

      lista.appendChild(fila)
    })
    if (pruebasRealizadas.length > 0) {
      const promedio = Math.round(
        pruebasRealizadas.reduce((acc, p) => acc + (p.correctas / p.total) * 100, 0) / pruebasRealizadas.length
      )
      const emoji = promedio === 100 ? '🎉' : promedio >= 60 ? '👍' : '📚'
    
      const hr = document.createElement('hr')
      hr.style.cssText = 'border: none; border-top: 1px solid #e0e0e0; margin: 1rem 0;'
      lista.appendChild(hr)
    
      const promedioDiv = document.createElement('div')
      promedioDiv.className = 'resultado-promedio'
      promedioDiv.textContent = `${emoji} El promedio de las pruebas es:  ${promedio}%`
      lista.appendChild(promedioDiv)
    }
  }
  document.getElementById('btn-cerrar-resultados')?.addEventListener('click', () => {
    document.getElementById('overlay-resultados')?.classList.add('oculto')
  })

  document.getElementById('overlay-resultados')?.classList.remove('oculto')
  materiaSeleccionada = null
})

// Edita la materia
const btnEditarMateria = document.getElementById('btn-editar-materia')
if (btnEditarMateria) btnEditarMateria.addEventListener('click', async () => {
  document.getElementById('menu-opciones')?.classList.add('oculto')

  modoEdicion = true

  const res = await fetch('/api/materias')
  const materias = await res.json()

  const materia = materias.find(m => m.id === materiaSeleccionada)

  document.getElementById('input-nombre').value = materia.nombre
  document.getElementById('input-texto').value = materia.texto
  document.getElementById('input-texto').readOnly = true

  document.getElementById('overlay-crear')?.classList.remove('oculto')
})


 // Función para eliminar una materia por su ID
 // Función para eliminar una materia por su ID
async function eliminarMateria(id) {
  await fetch(`/api/materias/${id}`, { method: 'DELETE' })
  // Recarga la lista de materias después de eliminar
  cargarMaterias()
}

// Genera la materia y su primera prueba
async function generarMateria() {
  const cantidad = document.getElementById('input-cantidad').value
  if (!cantidad || isNaN(cantidad) || cantidad < 1 || cantidad > 25) {
    alert('Ingresá una cantidad válida de preguntas.')
    return
  }

  BotonCrearMateriaFinal.disabled = true

  // Cierra el popup de cantidad de preguntas y muestra el overlay de carga fachero
  cerrarPopups()
  await new Promise(r => setTimeout(r, 50))
-  document.getElementById('overlay-loading').classList.remove('oculto')|
+  document.getElementById('overlay-loading').classList.remove('oculto')
   await new Promise(r => setTimeout(r, 50))

  // Llama a la API para crear la materia y su primera prueba
  try {
    const res = await fetch('/api/crear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: nombreGuardado,
        texto: textoGuardado,
        cantidadPreguntas: cantidad
      })
    })

    const materia = await res.json()

    // 409 = duplicado, 429 = lock: ya fue procesado, no es error real
    if (res.status === 409 || res.status === 429) {
      document.getElementById('overlay-loading')?.classList.add('oculto')
      await cargarMaterias()
      return
    }

    // Si hubo otro error, mostrar alerta
    if (!res.ok) throw new Error(materia.error || 'Error desconocido')

    document.getElementById('overlay-loading')?.classList.add('oculto')
    await cargarMaterias()

  } catch (error) {
    document.getElementById('overlay-loading')?.classList.add('oculto')
    alert('Hubo un error: ' + error.message)
    console.error(error)
  } finally {
    BotonCrearMateriaFinal.disabled = false
  }
}

/* -----------------------
   VISTA: Hacer resumen
   ----------------------- */

function bindResumenUI() {
  const btnEnviar = document.getElementById('btn-enviar-resumen')
  const btnCopiar = document.getElementById('btn-copiar-resumen')
  const btnNuevo  = document.getElementById('btn-nuevo-resumen')

  if (btnEnviar) btnEnviar.addEventListener('click', handleEnviarResumen)
  if (btnCopiar) btnCopiar.addEventListener('click', () => {
    const salida = document.getElementById('resumen-texto-salida')?.innerText || ''
    navigator.clipboard?.writeText(salida)
  })
  if (btnNuevo) btnNuevo.addEventListener('click', () => {
    document.getElementById('resumen-texto').value = ''
    document.getElementById('resumen-resultado')?.classList.add('oculto')
  })
}

async function handleEnviarResumen() {
  const textoEl = document.getElementById('resumen-texto')
  const longitudEl = document.getElementById('resumen-longitud')
  const overlay = document.getElementById('overlay-loading-resumen')

  const texto = textoEl?.value.trim() || ''
  const longitud = longitudEl?.value || 'medio'

  if (!texto) {
    alert('Ingresá el texto que querés resumir.')
    return
  }

  // Mostrar loading específico para resumen
  overlay?.classList.remove('oculto')

  try {
    const res = await fetch('/api/resumen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto, longitud })
    })

    // Manejo seguro del body: si el servidor devuelve JSON lo parseamos, si no lo tomamos como texto
    let data
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      data = await res.json()
    } else {
      const txt = await res.text()
      try { data = JSON.parse(txt) } catch { data = { error: txt } }
    }

    overlay?.classList.add('oculto')

    if (!res.ok) {
      // Mensaje de rechazo o error (backend puede rechazar no-resumen)
      alert(data.error || 'Error al pedir el resumen.')
      return
    }

    // Mostrar resumen
    document.getElementById('resumen-texto-salida').innerText = data.resumen || '[Respuesta vacía]'
    document.getElementById('resumen-resultado')?.classList.remove('oculto')

  } catch (error) {
    overlay?.classList.add('oculto')
    alert('Hubo un error al comunicarse con el servidor: ' + error.message)
    console.error(error)
  }
}

/* -----------------------
   Cerrar alertas overlay
   ----------------------- */
document.getElementById('btn-cerrar-alerta')?.addEventListener('click', () => {
  document.getElementById('overlay-alerta')?.classList.add('oculto')
})
