 // import { apikey } from "./apikey";

 import express from 'express';
 import fs from 'fs';
 import path from 'path';
import { apikey } from './apikey';
 
 const app = express();
 app.use(express.json());
 app.use(express.static('FrontEnd'));
 
 // ── Configuración OpenRouter ──────────────────────────────────────────────────
 const OPENROUTER_API_KEY = apikey();
 const OPENROUTER_URL    = "https://openrouter.ai/api/v1/chat/completions";
 const MODEL             = "nvidia/nemotron-3-nano-30b-a3b:free";
 
 // ── Persistencia ──────────────────────────────────────────────────────────────
 const DATOS_PATH = path.join('datos', 'materias.json');
 if (!fs.existsSync('datos')) fs.mkdirSync('datos');
 if (!fs.existsSync(DATOS_PATH)) fs.writeFileSync(DATOS_PATH, '[]', 'utf-8');
 
 // ── Helper: llamar a OpenRouter ───────────────────────────────────────────────
 async function llamarIA(prompt) {
   const response = await fetch(OPENROUTER_URL, {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${OPENROUTER_API_KEY.trim()}`,
       'Content-Type': 'application/json',
       'HTTP-Referer': 'http://localhost:3000',
       'X-Title': 'Estudio App'
     },
     body: JSON.stringify({
       model: MODEL,
       messages: [{ role: 'user', content: prompt }]
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
     throw new Error(`OpenRouter (${response.status}): ${errorMsg}`);
   }
 
   const data = JSON.parse(rawText);
 
   if (!data.choices?.[0]?.message?.content) {
     throw new Error('Formato de respuesta inesperado de OpenRouter');
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
 
 // ── GET /api/materias ─────────────────────────────────────────────────────────
 app.get('/api/materias', (req, res) => {
   try {
     const materias = JSON.parse(fs.readFileSync(DATOS_PATH, 'utf-8'));
     res.json(materias);
   } catch (error) {
     console.error('Error leyendo materias:', error);
     res.status(500).json({ error: 'Error al leer las materias' });
   }
 });
 
 // ── POST /api/crear ───────────────────────────────────────────────────────────
 app.post('/api/crear', async (req, res) => {
   const { nombre, texto, cantidadPreguntas } = req.body;
 
   if (!nombre || !texto || !cantidadPreguntas) {
     return res.status(400).json({ error: 'Faltan campos: nombre, texto, cantidadPreguntas' });
   }
 
   const prompt = `Resumí este texto y generá exactamente ${cantidadPreguntas} preguntas multiple choice.
 Respondé SOLO con JSON válido, sin backticks ni texto extra, con este formato:
 { "resumen": "...", "preguntas": [ { "pregunta": "...", "opciones": ["A. ...", "B. ...", "C. ...", "D. ..."], "correcta": 0 } ] }
 El campo "correcta" es el índice (0-3) de la opción correcta.
 
 TEXTO: ${texto}`;
 
   try {
     const contenidoIA = await llamarIA(prompt);
     const resultado   = parsearJSON(contenidoIA);
 
     const materias = JSON.parse(fs.readFileSync(DATOS_PATH, 'utf-8'));
     const nuevaMateria = {
       id: Date.now(),
       nombre,
       texto,
       resumen:   resultado.resumen,
       preguntas: resultado.preguntas
     };
 
     materias.push(nuevaMateria);
     fs.writeFileSync(DATOS_PATH, JSON.stringify(materias, null, 2), 'utf-8');
 
     res.json(nuevaMateria);
 
   } catch (error) {
     console.error('Error al generar preguntas:', error.message);
     res.status(500).json({ error: error.message || 'Error al generar preguntas' });
   }
 });
 
 // ── DELETE /api/materias/:id ──────────────────────────────────────────────────
 app.delete('/api/materias/:id', (req, res) => {
   try {
     const id = Number(req.params.id);
     let materias = JSON.parse(fs.readFileSync(DATOS_PATH, 'utf-8'));
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
 
 // ── Inicio ────────────────────────────────────────────────────────────────────
 app.listen(3000, () => console.log('✅ Servidor corriendo en http://localhost:3000'));
