/* Cuts a frozen single-file build into versions/.
 *
 * Only needed to publish a release - the repo runs fine without ever building.
 * Frozen builds never change, so a link to one keeps working regardless of
 * what happens to src/.
 *
 *   node build.mjs 1.0.0
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const v = process.argv[2];
if (!v) { console.error('usage: node build.mjs <version>'); process.exit(1); }

const css = readFileSync('src/neon.css', 'utf8').replace(/<\/style>/gi, '<\\/style>');
/* neon.js's header comment documents usage and contains a literal "</script>".
 * Inlined verbatim that CLOSES the script tag early and the rest of the file
 * renders as visible text. The parser looks for the character sequence, not for
 * a real tag, so it must be broken up. */
const js  = readFileSync('src/neon.js', 'utf8').replace(/<\/script>/gi, '<\\/script>');

/* Verify each substitution FIRED, rather than scanning the output for leftover
 * tags. neon.js's own header comment documents usage and contains both tag
 * strings verbatim, so any output scan false-positives on the inlined source. */
function sub(src, find, replace, label){
  if (!src.includes(find)) { console.error(`inline failed - not found: ${label}`); process.exit(1); }
  return src.replace(find, () => replace);        // fn form: no $& expansion
}

let html = readFileSync('index.html', 'utf8');
html = sub(html, '<link rel="stylesheet" href="src/neon.css">',
                 `<style>\n${css}\n</style>`, 'css link');
html = sub(html, '<script src="src/neon.js"></script>',
                 `<script>\n${js}\n</script>`, 'js script');
html = sub(html, '<title>neon-text - playground</title>',
                 `<title>neon-text v${v}</title>\n<!-- frozen build v${v} - do not edit -->`, 'title');

mkdirSync('versions', { recursive: true });
writeFileSync(`versions/v${v}.html`, html);
console.log(`versions/v${v}.html - ${(html.length / 1024).toFixed(1)} KB, self-contained`);
