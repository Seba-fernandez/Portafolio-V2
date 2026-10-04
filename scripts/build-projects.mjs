// Genera los destacados, "Más proyectos" y los datos del modal a partir de
// data/projects.json y los escribe dentro de index.html, entre marcadores.
// Uso: node scripts/build-projects.mjs
// (El panel en /panel usa el mismo módulo de render, así ambos generan lo mismo.)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { renderProjects } from '../js/render-projects.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(root, 'data/projects.json'), 'utf8'));
const htmlPath = join(root, 'index.html');

const r = renderProjects(readFileSync(htmlPath, 'utf8'), data);
writeFileSync(htmlPath, r.html);
console.log(`OK · ${r.featured} destacados · ${r.rest} en "Más proyectos" · ${r.total} en total`);
