// Build de publicación. Vercel lo corre en cada deploy (ver "buildCommand" en vercel.json).
// Sin dependencias: solo módulos de Node.
//
// Lee el árbol fuente y escribe dist/ con:
//   · css/*.css y js/*.js (los de la raíz de cada carpeta, no vendor ni .mjs) con hash de
//     contenido en el nombre: styles.css -> styles.3f2a9c1b.css
//   · referencias de index.html y panel/ reescritas a esos nombres
//   · styles.css sin comentarios ni sangría. Es la única minificación que hago: el CSSOM
//     resultante es igual al del original (se comprobó en Chrome, regla por regla). Para JS no
//     hay minificación: sin un parser, quitar comentarios puede romper un string con "//".
//
// El fuente NO cambia: sigue sirviéndose tal cual con `npx serve .`, y se edita a mano.
// dist/ está en .gitignore: nunca se commitea.
//
// Uso: node scripts/build.mjs

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, rmSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname, relative, extname, basename, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'dist');

// Nada de esto se publica. Lo demás de la raíz sí (así un archivo nuevo no queda afuera sin querer).
const NO_PUBLICAR = new Set(['.git', 'dist', 'node_modules', 'scripts', 'README.md', 'vercel.json']);
const TEXTO = new Set(['.html', '.js', '.mjs', '.css', '.json', '.webmanifest', '.txt', '.xml']);
// Qué se nombra con hash: solo lo de la raíz de css/ y js/. vendor/ ya tiene nombre fijo y caché inmutable.
const CON_HASH = /^(css|js)\/[^/]+\.(css|js)$/;

function recorrer(dir, base = '') {
  const out = [];
  for (const nombre of readdirSync(dir)) {
    if (nombre.startsWith('.')) continue;
    const rel = base ? posix.join(base, nombre) : nombre;
    if (!base && NO_PUBLICAR.has(nombre)) continue;
    const abs = join(dir, nombre);
    if (statSync(abs).isDirectory()) out.push(...recorrer(abs, rel));
    else out.push(rel);
  }
  return out;
}

/**
 * Quita comentarios /* … *\/ y sangría. Los saltos de línea quedan: son espacio igual que antes.
 * Un "/*" dentro de un string (content: "/*") no es comentario: se respeta. Si el scanner
 * encuentra un string o un comentario sin cerrar, falla el build en vez de dejar una hoja rota.
 */
export function minificarCss(src) {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'") {
      const fin = (() => {
        for (let j = i + 1; j < src.length; j++) {
          if (src[j] === '\\') { j++; continue; }
          if (src[j] === c) return j;
          if (src[j] === '\n') throw new Error(`string sin cerrar en css (cerca de "${src.slice(i, i + 40)}")`);
        }
        throw new Error(`string sin cerrar en css (cerca de "${src.slice(i, i + 40)}")`);
      })();
      out += src.slice(i, fin + 1);
      i = fin + 1;
    } else if (c === '/' && src[i + 1] === '*') {
      const fin = src.indexOf('*/', i + 2);
      if (fin < 0) throw new Error('comentario sin cerrar en css');
      i = fin + 2;
    } else {
      out += c;
      i++;
    }
  }
  const lineas = out.split('\n').map((l) => l.trim()).filter((l) => l !== '');
  return lineas.join('\n') + '\n';
}

const hash8 = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 8);
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function main() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const archivos = recorrer(ROOT);
  for (const rel of archivos) {
    mkdirSync(dirname(join(OUT, rel)), { recursive: true });
    copyFileSync(join(ROOT, rel), join(OUT, rel));
  }

  // 1) Hash de contenido y renombrado. El mapa va de "css/styles.css" a "css/styles.<hash>.css".
  const mapa = new Map();
  for (const rel of archivos.filter((r) => CON_HASH.test(r))) {
    let buf = readFileSync(join(ROOT, rel));
    if (rel === 'css/styles.css') buf = Buffer.from(minificarCss(buf.toString('utf8')), 'utf8');
    const ext = extname(rel);
    const nuevo = posix.join(posix.dirname(rel), `${basename(rel, ext)}.${hash8(buf)}${ext}`);
    writeFileSync(join(OUT, nuevo), buf);
    rmSync(join(OUT, rel));
    mapa.set(rel, nuevo);
  }

  // 2) Reescritura de referencias en todo texto publicado. Conserva la barra inicial si la había.
  const errores = [];
  const textos = recorrer(OUT).filter((r) => TEXTO.has(extname(r)));
  for (const rel of textos) {
    const abs = join(OUT, rel);
    let txt = readFileSync(abs, 'utf8');
    const antes = txt;
    for (const [viejo, nuevo] of mapa) {
      const re = new RegExp(`(?<![A-Za-z0-9_.\\-])(/?)${escRe(viejo)}(?![A-Za-z0-9_\\-])`, 'g');
      txt = txt.replace(re, (_, barra) => `${barra}${nuevo}`);
    }
    if (txt !== antes) writeFileSync(abs, txt);
    // Ningún nombre viejo puede quedar: si queda, el sitio pediría un archivo que ya no existe.
    for (const viejo of mapa.keys()) {
      const re = new RegExp(`(?<![A-Za-z0-9_.\\-])/?${escRe(viejo)}(?![A-Za-z0-9_\\-])`);
      if (re.test(txt)) errores.push(`${rel} todavía nombra "${viejo}"`);
    }
  }

  // 3) Toda referencia local de HTML tiene que existir en dist/.
  for (const rel of textos.filter((r) => extname(r) === '.html')) {
    const txt = readFileSync(join(OUT, rel), 'utf8');
    for (const m of txt.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const ref = m[1];
      if (/^(https?:|mailto:|tel:|data:|#|javascript:)/.test(ref)) continue;
      const sinQuery = ref.split(/[?#]/)[0];
      const destino = sinQuery.startsWith('/')
        ? join(OUT, sinQuery)
        : join(OUT, posix.dirname(rel), sinQuery);
      const final = destino.endsWith('/') ? join(destino, 'index.html') : destino;
      if (!existsSync(final)) errores.push(`${rel}: "${ref}" no existe en el build`);
    }
  }

  if (errores.length) {
    console.error('El build no se completó:\n  - ' + errores.join('\n  - '));
    process.exit(1);
  }

  const pesos = (rel) => readFileSync(join(OUT, rel)).length;
  const nuevos = [...mapa.values()].map((n) => `${n} (${pesos(n)} B)`);
  console.log(`OK · dist/ con ${archivos.length} archivos`);
  console.log('  nombres con hash: ' + nuevos.join(', '));
}

// Solo corre al ejecutarlo directo (node scripts/build.mjs), no al importar minificarCss en un test.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
