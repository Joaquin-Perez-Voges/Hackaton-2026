// Variable para trackear qué materia está seleccionada
let materiaSeleccionada = null

let textoGuardado = ''
let nombreGuardado = ''

// Carga todas las materias guardadas del json
async function cargarMaterias() {
  const res = await fetch('/api/materias')
  const materias = await res.json()
  const lista = document.getElementById('lista-materias')
  lista.innerHTML = ''

  if (materias.length === 0) {
    lista.innerHTML = '<p style="color:#999; margin-bottom:1rem;">Todavía no hay materias. ¡Creá una!</p>'
    return
  }

  materias.forEach(m => {
    // La cantidad de preguntas se lee de la última prueba generada
    const ultimaPrueba = m.pruebas[m.pruebas.length - 1]
    const cantPreguntas = ultimaPrueba ? ultimaPrueba.preguntas.length : 0
    const cantPruebas   = m.pruebas.length

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

// Cerrar el popup de crear materia
function cerrarPopupCrear() {
  document.getElementById('overlay-crear').classList.add('oculto')
  document.getElementById('input-nombre').value = ''
  document.getElementById('input-texto').value = ''
}

const BotonAbrirPanelCreacion = document.getElementById('btn-nuevo')
BotonAbrirPanelCreacion.addEventListener('click', function () {
  document.getElementById('overlay-crear').classList.remove('oculto')
})

const BotonCerrarPopup = document.getElementById('BotonCerrarPopup')
BotonCerrarPopup.addEventListener('click', function () {
  cerrarPopupCrear()
})

const BotonCrearMateria = document.getElementById('BotonCrearMateria')
BotonCrearMateria.addEventListener('click', function () {
  const nombre = document.getElementById('input-nombre').value.trim()
  const texto  = document.getElementById('input-texto').value.trim()

  if (!nombre) { alert('Ingresá un nombre válido para la materia.'); return }
  if (!texto)  { alert('Ingresá el texto a estudiar.'); return }

  nombreGuardado = nombre
  textoGuardado  = texto

  cerrarPopupCrear()
  document.getElementById('overlay-cantidad').classList.remove('oculto')
})

function cerrarPopupCantidad() {
  document.getElementById('overlay-cantidad').classList.add('oculto')
}

const BotonCerrarPopupPreguntas = document.getElementById('BotonCerrarPopupPreguntas')
BotonCerrarPopupPreguntas.addEventListener('click', function () {
  cerrarPopupCantidad()
})

const BotonCrearMateriaFinal = document.getElementById('BotonCrearMateriaFinal')
BotonCrearMateriaFinal.addEventListener('click', function () {
  generarMateria()
})


function abrirOpciones(id, boton) {
  const menu = document.getElementById('menu-opciones')
  
  // Si ya está abierto para la misma materia, cerrarlo
  if (!menu.classList.contains('oculto') && materiaSeleccionada === id) {
    menu.classList.add('oculto')
    materiaSeleccionada = null
    return
  }

  materiaSeleccionada = id
  const rect = boton.getBoundingClientRect()
  menu.style.top  = `${rect.bottom + 6}px`
  menu.style.left = `${rect.right - 180}px`
  menu.classList.remove('oculto')
}

// Cerrar el menú al clickear en cualquier otro lado
document.addEventListener('click', (e) => {
  const menu = document.getElementById('menu-opciones')
  if (!menu.classList.contains('oculto') && !menu.contains(e.target) && !e.target.classList.contains('btn-opciones')) {
    menu.classList.add('oculto')
    materiaSeleccionada = null
  }
})


document.getElementById('btn-eliminar-materia').addEventListener('click', async () => {
  document.getElementById('menu-opciones').classList.add('oculto')  // ← era overlay-opciones
  await eliminarMateria(materiaSeleccionada)
  materiaSeleccionada = null
})

document.getElementById('btn-ver-resultados').addEventListener('click', () => {
  document.getElementById('menu-opciones').classList.add('oculto')  // ← era overlay-opciones
  // Por ahora no hace nada
})

document.getElementById('btn-editar-materia').addEventListener('click', async () => {
  document.getElementById('menu-opciones').classList.add('oculto')  // ← era overlay-opciones

  const res = await fetch('/api/materias')
  const materias = await res.json()
  const materia = materias.find(m => m.id === materiaSeleccionada)

  document.getElementById('input-nombre').value = materia.nombre
  document.getElementById('input-texto').value = materia.texto
  document.getElementById('overlay-crear').classList.remove('oculto')
})


// El botón que elimina la materia
async function eliminarMateria(id) {
  await fetch(`/api/materias/${id}`, { method: 'DELETE' })
  cargarMaterias()
}

// Genera la materia y su primera prueba
async function generarMateria() {
  const cantidad = document.getElementById('input-cantidad').value

  BotonCrearMateriaFinal.disabled = true

  cerrarPopupCantidad()
  await new Promise(r => setTimeout(r, 50))
  document.getElementById('overlay-loading').classList.remove('oculto')
  await new Promise(r => setTimeout(r, 50))

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

cargarMaterias()