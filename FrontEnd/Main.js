// Variable para trackear qué materia está seleccionada
let materiaSeleccionada = null

//Texto y nombre guardados para crear la materia
let textoGuardado = ''
let nombreGuardado = ''

// Carga todas las materias guardadas del json
async function cargarMaterias() {
  const res = await fetch('/api/materias')
  const materias = await res.json()
  //Vacia la lista de materias y la vuelve a llenar
  const lista = document.getElementById('lista-materias')
  lista.innerHTML = ''

  // Si no hay materias, mostrar un mensaje especial
  if (materias.length === 0) {
    lista.innerHTML = '<p style="color:#999; margin-bottom:1rem;">Todavía no hay materias. ¡Creá una!</p>'
    return
  }

  //Muestra cada materia en la lista y les crea su html
  materias.forEach(m => {
    // La cantidad de preguntas se lee de la última prueba generada
    const ultimaPrueba = m.pruebas[m.pruebas.length - 1]
    const cantPreguntas = ultimaPrueba ? ultimaPrueba.preguntas.length : 0
    const cantPruebas   = m.pruebas.length

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
}

// Función para cerrar todos los popups y limpiar los inputs
function cerrarPopups() {
  //Popup donde ingresas el nombre y texto de la materia
  document.getElementById('overlay-crear').classList.add('oculto')
  document.getElementById('input-nombre').value = ''
  document.getElementById('input-texto').value = ''

  //Popup donde ingresas la cantidad de preguntas
  document.getElementById('overlay-cantidad').classList.add('oculto')
}

// Abre el panel de creación de materia
const BotonAbrirPanelCreacion = document.getElementById('btn-nuevo')
BotonAbrirPanelCreacion.addEventListener('click', function () {
  document.getElementById('overlay-crear').classList.remove('oculto')
})

//Cierra el panel de creación de materia
const BotonCerrarPopup = document.getElementById('BotonCerrarPopup')
BotonCerrarPopup.addEventListener('click', function () {
  cerrarPopups()
})

// Abre el panel de cantidad de preguntas y guarda el nombre y texto de la materia
const BotonCrearMateria = document.getElementById('BotonAbrePanelPreguntas')
BotonCrearMateria.addEventListener('click', function () {
  const nombre = document.getElementById('input-nombre').value.trim()
  const texto  = document.getElementById('input-texto').value.trim()

  // Validación de inputs (no vacios)
  if (!nombre) { alert('Ingresá un nombre válido para la materia.'); return }
  if (!texto)  { alert('Ingresá el texto a estudiar.'); return }
  nombreGuardado = nombre
  textoGuardado  = texto

  //Cierra el popup de creación y abre el de cantidad de preguntas
  cerrarPopups()
  document.getElementById('overlay-cantidad').classList.remove('oculto')
})

// Cierra el panel de cantidad de preguntas
const BotonCerrarPopupPreguntas = document.getElementById('BotonCerrarPopupPreguntas')
BotonCerrarPopupPreguntas.addEventListener('click', function () {
  cerrarPopups()
})

// Llama a la función para generar la materia
const BotonCrearMateriaFinal = document.getElementById('BotonCrearMateria')
BotonCrearMateriaFinal.addEventListener('click', function () {
  generarMateria()
})

// Abre el menú de opciones para la materia seleccionada
function abrirOpciones(id, boton) {
  let menu = document.getElementById('menu-opciones')
  
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
  if (!menu.classList.contains('oculto') && !menu.contains(e.target) && !e.target.classList.contains('btn-opciones')) {
    menu.classList.add('oculto')
    materiaSeleccionada = null
  }
})

// Botones del menú de opciones
// Elimina la materia
document.getElementById('btn-eliminar-materia').addEventListener('click', async () => {
  document.getElementById('menu-opciones').classList.add('oculto')  // ← era overlay-opciones
  await eliminarMateria(materiaSeleccionada)
  materiaSeleccionada = null
})
// Ver resultados de la materia (idea futuro)
document.getElementById('btn-ver-resultados').addEventListener('click', async () => {
  document.getElementById('menu-opciones').classList.add('oculto')

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
  document.getElementById('btn-cerrar-resultados').addEventListener('click', () => {
    document.getElementById('overlay-resultados').classList.add('oculto')
  })

  document.getElementById('overlay-resultados').classList.remove('oculto')
  materiaSeleccionada = null
})
// Edita la materia
document.getElementById('btn-editar-materia').addEventListener('click', async () => {
  document.getElementById('menu-opciones').classList.add('oculto')  // ← era overlay-opciones

  const res = await fetch('/api/materias')
  const materias = await res.json()
  const materia = materias.find(m => m.id === materiaSeleccionada)

  document.getElementById('input-nombre').value = materia.nombre
  document.getElementById('input-texto').value = materia.texto
  document.getElementById('overlay-crear').classList.remove('oculto')
})


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
  document.getElementById('overlay-loading').classList.remove('oculto')|
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
      document.getElementById('overlay-loading').classList.add('oculto')
      await cargarMaterias()
      return
    }

    // Si hubo otro error, mostrar alerta
    if (!res.ok) throw new Error(materia.error || 'Error desconocido')

    document.getElementById('overlay-loading').classList.add('oculto')
    await cargarMaterias()

  } catch (error) {
    document.getElementById('overlay-loading').classList.add('oculto')
    alert('Hubo un error: ' + error.message)
    console.error(error)
  } finally {
    BotonCrearMateriaFinal.disabled = false
  }
}

// Carga las materias al iniciar la página
cargarMaterias()