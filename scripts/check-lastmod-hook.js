#!/usr/bin/env node
// PreToolUse hook (matcher: Edit) — avvisa se un Edit su sitemap.xml tocca <lastmod>
// senza includere <loc> nello stesso match (rischio: colpire pagine non correlate
// che condividono la stessa data, gia successo in passato — vedi CLAUDE.md).

let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const toolInput = data.tool_input || {};
    const filePath = String(toolInput.file_path || '').replace(/\\/g, '/');
    const oldString = String(toolInput.old_string || '');

    const isSitemap = /sitemap\.xml$/.test(filePath);
    const touchesLastmod = /<lastmod>/.test(oldString);
    const includesLoc = /<loc>/.test(oldString);

    if (isSitemap && touchesLastmod && !includesLoc) {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'ask',
          permissionDecisionReason: 'Match su <lastmod> senza <loc> nello stesso replace: rischio di toccare pagine non correlate che condividono la stessa data (vedi CLAUDE.md, gia successo in passato). Includi il tag <loc> nel match, oppure conferma se e voluto.'
        }
      }));
      return;
    }
  } catch (e) {
    // input malformato: non bloccare mai per un errore del hook stesso
  }
  process.exit(0);
});
