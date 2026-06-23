 // import { apikey } from "./apikey";

import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json());
app.use(express.static('FrontEnd'));

const GEMINI_API_KEY = "pegá-tu-key-aqui";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const DATOS_PATH = path.join('datos', 'materias.json');

// Asegura que exista la carpeta datos y el archivo
if (!fs.existsSync('datos')) fs.mkdirSync('datos');
if (!fs.existsSync(DATOS_PATH)) fs.writeFileSync(DATOS_PATH, '[]', 'utf-8');

// Obtener todas las materias
app.get('/api/materias', (req, res) => {
  const materias = JSON.parse(fs.readFileSync(DATOS_PATH, 'utf-8'));
  res.json(materias);
});

// Crear materia con texto + preguntas generadas por IA
app.post('/api/crear', async (req, res) => {
  const { nombre, texto, cantidadPreguntas } = req.body;

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Resumí este texto y generá exactamente ${cantidadPreguntas} preguntas multiple choice.
Respondé SOLO con JSON válido, sin backticks ni texto extra, con este formato:
{ "resumen": "...", "preguntas": [ { "pregunta": "...", "opciones": ["A. ...", "B. ...", "C. ...", "D. ..."], "correcta": 0 } ] }
El campo "correcta" es el índice (0-3) de la opción correcta.

TEXTO: ${texto}`
          }]
        }]
      })
    });

    const data = await response.json();
    const textoRespuesta = data.candidates[0].content.parts[0].text;
    const resultado = JSON.parse(textoRespuesta);

    // Armar objeto materia
    const materias = JSON.parse(fs.readFileSync(DATOS_PATH, 'utf-8'));
    const nuevaMateria = {
      id: Date.now(),
      nombre,
      texto,
      resumen: resultado.resumen,
      preguntas: resultado.preguntas
    };

    materias.push(nuevaMateria);
    fs.writeFileSync(DATOS_PATH, JSON.stringify(materias, null, 2), 'utf-8');

    res.json(nuevaMateria);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar preguntas' });
  }
});

app.listen(3000, () => console.log('Servidor en http://localhost:3000'));