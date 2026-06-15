import { readFileSync } from "node:fs";
const mod = await WebAssembly.compile(readFileSync(new URL("../build/rb.wasm", import.meta.url)));
const imports = {}; for (const i of WebAssembly.Module.imports(mod)) (imports[i.module] ??= {})[i.name] = () => 0;
const { exports: ex } = await WebAssembly.instantiate(mod, imports); try { ex._start(); } catch {}
const enc = new TextEncoder(), dec = new TextDecoder();
const idxOf = (abbr) => { const b = enc.encode(abbr); const p = ex.in_alloc(b.length); new Uint8Array(ex.memory.buffer, Number(p), b.length).set(b); return ex.axis_index(); };
const abbrev = (i) => { const len = ex.axis_abbrev_resolve(i); const p = ex.out_ptr(); return dec.decode(new Uint8Array(ex.memory.buffer, Number(p), Number(len))); };
const label = (i) => { const len = ex.axis_label_resolve(i); const p = ex.out_ptr(); return dec.decode(new Uint8Array(ex.memory.buffer, Number(p), Number(len))); };
let ok = true; const ck = (c, m) => { if (!c) { console.error("FAIL " + m); ok = false; } };

ck(ex.axis_count() === 7, "axis_count");
ck(ex.score_min() === 1 && ex.score_max() === 7, "likert range");
ck(ex.is_valid_score(7) === 1 && ex.is_valid_score(8) === 0, "valid score");
ck(Math.round(ex.axis_weight(0) * 100) === 20, "weight BEL");
ck(Math.round(ex.axis_weight(6) * 100) === 5, "weight CON");
ck(Math.round(ex.weights_sum() * 1000) === 1000, "weights sum 1.0");
ck(idxOf("BEL") === 0, "idx BEL");
ck(idxOf("con") === 6, "idx con (lowercase)");
ck(idxOf("XXX") === -1, "idx unknown");
ck(abbrev(0) === "BEL", "abbrev 0: " + abbrev(0));
ck(abbrev(6) === "CON", "abbrev 6");
ck(label(4) === "Emotional resonance", "label 4: " + label(4));
ck(label(0) === "Believability", "label 0");
// 多重読み: 同じ入力で axis_index を複数回 + abbrev を挟んでも g_in 健在 (almide#690 回避)
{ const b = enc.encode("emo"); const p = ex.in_alloc(b.length); new Uint8Array(ex.memory.buffer, Number(p), b.length).set(b);
  ck(ex.axis_index() === 4 && ex.axis_index() === 4, "multi-read idx");
  ex.axis_abbrev_resolve(0);
  ck(ex.axis_index() === 4, "idx after abbrev (g_in intact)"); }
console.log(ok ? "wasm OK — rubric metadata (incl. multi-read) matches native" : "FAIL"); if (!ok) process.exit(1);
