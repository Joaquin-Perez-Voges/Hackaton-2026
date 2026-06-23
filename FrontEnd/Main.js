let textoGuardado = ''
let nombreGuardado = ''


async function cargarMaterias() {
  const res = await fetch('/api/materias')
  const materias = await res.json()
  const lista = document.getElementById('lista-materias')
  lista.innerHTML = ''

  if (materias.length == 0) {
    lista.innerHTML = '<p style="color:#999; margin-bottom:1rem;">Todavía no hay materias. ¡Creá una!</p>';
    return
  }

  materias.forEach(m => {
    let card = document.createElement('div')
    card.className = 'CartaMateria'
    card.innerHTML = 
    `
      <a href="quiz.html?id=${m.id}">${m.nombre}</a>
      <span>${m.preguntas.length} preguntas</span>
    `
    lista.appendChild(card)
  })
}

const BotonAbrirPanelCreacion = document.getElementById("btn-nuevo")
BotonAbrirPanelCreacion.addEventListener("click", function(){
  document.getElementById('overlay-crear').classList.remove('oculto')
})

function cerrarPopupCrear() {
  document.getElementById('overlay-crear').classList.add('oculto')
  document.getElementById('input-nombre').value = ''
  document.getElementById('input-texto').value = ''
}

function procesarTexto() {
  let nombre = document.getElementById('input-nombre').value.trim()
  let texto = document.getElementById('input-texto').value.trim()

  if (!nombre) { alert('Ingresá un nombre válido para la materia.'); return }
  if (!texto) { alert('Ingresá el texto a estudiar.'); return }

  nombreGuardado = nombre
  textoGuardado = texto

  cerrarPopupCrear()
  document.getElementById('overlay-cantidad').classList.remove('oculto')
}

function cerrarPopupCantidad() {
  document.getElementById('overlay-cantidad').classList.add('oculto')
}

async function generarMateria() {
  const cantidad = document.getElementById('input-cantidad').value

  cerrarPopupCantidad()
  document.getElementById('overlay-loading').classList.remove('oculto')

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
    document.getElementById('overlay-loading').classList.add('oculto')

    await cargarMaterias()

    // Ir directo al quiz de la materia recién creada
    window.location.href = `quiz.html?id=${materia.id}`

  } catch (error) {
    document.getElementById('overlay-loading').classList.add('oculto')
    alert('Hubo un error. Revisá la consola.')
    console.error(error)
  }
}

cargarMaterias()