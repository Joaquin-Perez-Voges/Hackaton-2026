process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import express from 'express';
import fs from 'fs';
import path from 'path';
import { apikey } from './apikey.js';

const app = express();
app.use(express.json());
app.use(express.static('FrontEnd'));

// ── Configuración Groq ───────────────────────────────────────────────────────
const GROQ_API_KEY = apikey();
const GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions";
const MODEL        = "llama-3.3-70b-versatile";

// ── Persistencia ────────────────────────────────────────────────────────────
const DATOS_PATH = path.join('datos', 'materias.json');
if (!fs.existsSync('datos')) fs.mkdirSync('datos');
if (!fs.existsSync(DATOS_PATH)) fs.writeFileSync(DATOS_PATH, '[]', 'utf-8');

// ── Lock: evita que dos requests simultáneos dupliquen entradas ───────────────
let procesando = false;

// ── Helper: llamar a Groq ─────────────────────────────────────────────────────
async function llamarIA(prompt) {
  // Soporte para Node < 18: cargar fetch desde node-fetch si no existe
  if (typeof fetch === 'undefined') {
    const fetchModule = await import('node-fetch');
    global.fetch = fetchModule.default || fetchModule;
  }

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY.trim()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2048
    })
  });

  const rawText = await response.text();

  if (!response.ok) {
    let errorMsg = 'Error desconocido';
    try {
      const errData = JSON.parse(rawText);
      errorMsg = errData.error?.message || errData.message || errorMsg;
    } catch (_) {
      errorMsg = rawText.substring(0, 300);
    }
    throw new Error(`Groq (${response.status}): ${errorMsg}`);
  }

  const data = JSON.parse(rawText);

  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Formato de respuesta inesperado de Groq');
  }

  return data.choices[0].message.content;
}

// ── Helper: parsear JSON de la respuesta (limpia posibles backticks) ──────────
function parsearJSON(content) {
  const clean = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();

  try {
    return JSON.parse(clean);
  } catch (_) {
    throw new Error('La IA devolvió una respuesta que no es JSON válido');
  }
}

// ── Helper: prompt para generar preguntas ────────────────────────────────────
function armarPrompt(texto, cantidadPreguntas, pruebasAnteriores = []) {
  // Armar lista de preguntas ya usadas para que la IA no las repita
  const preguntasUsadas = pruebasAnteriores
    .flatMap(p => p.preguntas.map(q => q.pregunta))
    .slice(-30); // máximo últimas 30 para no saturar el contexto

  const avisoRepeticion = preguntasUsadas.length > 0
    ? `\nIMPORTANTE: Ya se generaron estas preguntas antes, NO las repitas:\n${preguntasUsadas.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n`
    : '';

  return `Actuá como un experto en pedagogía y procesamiento de datos. Tu tarea es procesar el texto que te proporcionaré al final según las siguientes instrucciones estrictas:

1. RESUMEN: Extraé las ideas principales de forma concisa.
2. PREGUNTAS: Generá exactamente ${cantidadPreguntas} preguntas de opción múltiple basadas únicamente en el texto.
   - Cada pregunta debe tener exactamente 4 opciones (A, B, C, D).
   - Solo una opción debe ser correcta.
   - Evitá opciones ambiguas.
${avisoRepeticion}
3. FORMATO DE SALIDA: Tu respuesta debe ser EXCLUSIVAMENTE un objeto JSON válido. 
   - NO incluyas texto de introducción ni de cierre.
   - NO uses bloques de código con triples comillas invertidas.
   - Asegurá que los caracteres especiales estén correctamente escapados para no romper el JSON.

Respetá estrictamente la siguiente estructura de datos:
{
  "resumen": "Aquí va el resumen del texto...",
  "preguntas": [
    {
      "pregunta": "¿Cuál es la pregunta...?",
      "opciones": [
        "A. Primera opción",
        "B. Segunda opción",
        "C. Tercera opción",
        "D. Cuarta opción"
      ],
      "correcta": 0
    }
  ]
}

Nota: El campo "correcta" debe ser un número entero que represente el índice (0 para A, 1 para B, 2 para C, 3 para D) de la respuesta correcta.

TEXTO A PROCESAR:${texto}`;
}

// ── GET /api/materias ───────────────────────────────────────────────────────
app.get('/api/materias', (req, res) => {
  try {
    const materias = JSON.parse(fs.readFileSync(DATOS_PATH, 'utf-8'));
    res.json(materias);
  } catch (error) {
    console.error('Error leyendo materias:', error);
    res.status(500).json({ error: 'Error al leer las materias' });
  }
});

// ── POST /api/crear ────────────────────────────────────────────────────────
// Crea la materia y guarda la primera prueba en pruebas[0]
app.post('/api/crear', async (req, res) => {
  if (procesando) {
    return res.status(429).json({ error: 'Ya hay una materia siendo procesada, esperá un momento.' });
  }

  const { nombre, texto, cantidadPreguntas } = req.body;

  if (!nombre || !texto || !cantidadPreguntas) {
    return res.status(400).json({ error: 'Faltan campos: nombre, texto, cantidadPreguntas' });
  }

  const materiasActuales = JSON.parse(fs.readFileSync(DATOS_PATH, 'utf-8'));
  const duplicado = materiasActuales.find(m => m.nombre === nombre && m.texto === texto);
  if (duplicado) {
    return res.status(409).json({ error: 'Ya existe una materia con ese nombre y texto.' });
  }

  procesando = true;

  try {
    const contenidoIA = await llamarIA(armarPrompt(texto, cantidadPreguntas));
    const resultado   = parsearJSON(contenidoIA);

    const materias = JSON.parse(fs.readFileSync(DATOS_PATH, 'utf-8'));
    const nuevaMateria = {
      id: Date.now(),
      nombre,
      texto,
      resumen: resultado.resumen,
      pruebas: [
        {
          id: 1,
          fecha: new Date().toISOString(),
          preguntas: resultado.preguntas
        }
      ]
    };

    materias.push(nuevaMateria);
    fs.writeFileSync(DATOS_PATH, JSON.stringify(materias, null, 2), 'utf-8');

    res.json(nuevaMateria);

  } catch (error) {
    console.error('Error al generar preguntas:', error.message);
    res.status(500).json({ error: error.message || 'Error al generar preguntas' }); 
  } finally {
    procesando = false;
  }
});

// ── POST /api/materias/:id/prueba ────────────────────────────────────────────
// Genera una nueva prueba para una materia ya existente y la agrega a pruebas[]
app.post('/api/materias/:id/prueba', async (req, res) => {
  if (procesando) {
    return res.status(429).json({ error: 'Ya hay una prueba siendo generada, esperá un momento.' });
  }

  const id = Number(req.params.id);
  const { cantidadPreguntas = 5 } = req.body;

  const materias = JSON.parse(fs.readFileSync(DATOS_PATH, 'utf-8'));
  const idx = materias.findIndex(m => m.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Materia no encontrada' });
  }

  procesando = true;
  const materia = materias[idx];

  try {
    // Pasa las pruebas anteriores para que la IA no repita preguntas
    const contenidoIA = await llamarIA(armarPrompt(materia.texto, cantidadPreguntas, materia.pruebas));
    const resultado   = parsearJSON(contenidoIA);

    const nuevaPrueba = {
      id: materia.pruebas.length + 1,
      fecha: new Date().toISOString(),
      preguntas: resultado.preguntas
    };

    materia.pruebas.push(nuevaPrueba);
    materias[idx] = materia;
    fs.writeFileSync(DATOS_PATH, JSON.stringify(materias, null, 2), 'utf-8');

    res.json(nuevaPrueba);

  } catch (error) {
    console.error('Error al generar prueba:', error.message);
    res.status(500).json({ error: error.message || 'Error al generar prueba' });
  } finally {
    procesando = false;
  }
});

// ── PUT /api/materias/:id/nombre ──────────────────────────────────────────────
// Cambia únicamente el nombre de una materia
app.put('/api/materias/:id/nombre', (req, res) => {
  try {
    const id = Number(req.params.id)
    const { nombre } = req.body

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'Nombre inválido' })
    }

    const materias = JSON.parse(fs.readFileSync(DATOS_PATH, 'utf-8'))
    const materia = materias.find(m => m.id === id)

    if (!materia) {
      return res.status(404).json({ error: 'Materia no encontrada' })
    }

    materia.nombre = nombre.trim()

    fs.writeFileSync(
      DATOS_PATH,
      JSON.stringify(materias, null, 2),
      'utf-8'
    )

    res.json(materia)

  } catch (error) {
    console.error('Error editando materia:', error)
    res.status(500).json({ error: 'Error al editar la materia' })
  }
})


// ── DELETE /api/materias/:id ──────────────────────────────────────────────────
app.delete('/api/materias/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    let materias = JSON.parse(fs.readFileSync(DATOS_PATH, null, 2), 'utf-8');
    const idx = materias.findIndex(m => m.id === id);

    if (idx === -1) return res.status(404).json({ error: 'Materia no encontrada' });

    materias.splice(idx, 1);
    fs.writeFileSync(DATOS_PATH, JSON.stringify(materias, null, 2), 'utf-8');
    res.json({ ok: true });
  } catch (error) {
    console.error('Error eliminando materia:', error);
    res.status(500).json({ error: 'Error al eliminar la materia' });
  }
});

// ── PATCH /api/materias/:id/pruebas/:pruebaId/resultado ───────────────────────
// Guarda el resultado (correctas y total) de una prueba ya realizada
app.patch('/api/materias/:id/pruebas/:pruebaId/resultado', (req, res) => {
  try {
    const id       = Number(req.params.id);
    const pruebaId = Number(req.params.pruebaId);
    const { correctas, total } = req.body;

    if (correctas === undefined || total === undefined) {
      return res.status(400).json({ error: 'Faltan campos: correctas, total' });
    }

    const materias = JSON.parse(fs.readFileSync(DATOS_PATH, 'utf-8'));
    const materia  = materias.find(m => m.id === id);
    if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });

    const prueba = materia.pruebas.find(p => p.id === pruebaId);
    if (!prueba) return res.status(404).json({ error: 'Prueba no encontrada' });

    prueba.correctas = correctas;
    prueba.total     = total;
    prueba.fecha     = new Date().toISOString().split('T')[0]; // "2026-06-24"

    fs.writeFileSync(DATOS_PATH, JSON.stringify(materias, null, 2), 'utf-8');
    res.json({ ok: true });

  } catch (error) {
    console.error('Error guardando resultado:', error);
    res.status(500).json({ error: 'Error al guardar el resultado' });
  }
});

// ── POST /api/resumen ─────────────────────────────────────────────────────────
app.post('/api/resumen', async (req, res) => {
  const { texto, tema } = req.body;

  if (!texto && !tema) {
    return res.status(400).json({ error: 'Ingresá un texto o un tema.' });
  }

  const prompt = texto
    ? `Resumí el siguiente texto de forma clara y concisa, destacando las ideas principales:\n\n${texto}`
    : `Hacé un resumen completo y claro sobre el siguiente tema: ${tema}`;

  try {
    const contenidoIA = await llamarIA(prompt);
    res.json({ resumen: contenidoIA });
  } catch (error) {
    console.error('Error al generar resumen:', error.message);

    if (error.message.includes('429')) {
      return res.status(429).json({ error: '⏳ Límite de la IA alcanzado. Volvé a intentarlo en unos minutos.' });
    }

    res.status(500).json({ error: error.message || 'Error al generar el resumen' });
  }
});


app.post('/api/resumen', async (req, res) => {
  const { texto, longitud } = req.body

  if (!texto) return res.status(400).json({ error: 'Ingresá un texto.' })

  const instruccionLongitud = {
    breve: 'en 1 a 3 frases cortas',
    medio: 'en 1 a 2 párrafos',
    largo: 'de forma detallada y completa'
  }[longitud] || 'en 1 a 2 párrafos'

  const prompt = `Resumí el siguiente texto ${instruccionLongitud}, destacando las ideas principales. Respondé solo con el resumen, sin introducciones ni aclaraciones.\n\nTEXTO:\n${texto}`

  try {
    const resumen = await llamarIA(prompt)
    res.json({ resumen })
  } catch (error) {
    console.error('Error al generar resumen:', error.message)
    if (error.message.includes('429')) {
      return res.status(429).json({ error: '⏳ Límite de la IA alcanzado. Volvé a intentarlo en unos minutos.' })
    }
    res.status(500).json({ error: error.message || 'Error al generar el resumen' })
  }
})



// ── Inicio ───────────────────────────────────────────────────────────
app.listen(3000, () => console.log('✅ Servidor corriendo en http://localhost:3000'));
