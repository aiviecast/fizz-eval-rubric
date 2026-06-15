// rubric-driver.js — eval レポート UI のグルー例。軸メタデータ = Almide(wasm)。
export async function loadEvalRubric(wasmUrl) {
  const bytes = await (await fetch(wasmUrl)).arrayBuffer();
  const mod = await WebAssembly.compile(bytes);
  const imports = {}; for (const i of WebAssembly.Module.imports(mod)) (imports[i.module] ??= {})[i.name] = () => 0;
  const { exports: ex } = await WebAssembly.instantiate(mod, imports); try { ex._start(); } catch {}
  const enc = new TextEncoder(), dec = new TextDecoder();
  const readOut = (len) => dec.decode(new Uint8Array(ex.memory.buffer, Number(ex.out_ptr()), Number(len)));
  return {
    axisCount() { return ex.axis_count(); },
    scoreMin() { return ex.score_min(); },
    scoreMax() { return ex.score_max(); },
    isValidScore(s) { return ex.is_valid_score(s) === 1; },
    axisWeight(idx) { return ex.axis_weight(idx); },
    weightsSum() { return ex.weights_sum(); },
    axisIndex(abbrev) {
      const b = enc.encode(abbrev); const p = ex.in_alloc(b.length);
      new Uint8Array(ex.memory.buffer, Number(p), b.length).set(b);
      return ex.axis_index();
    },
    axisAbbrev(idx) { return readOut(ex.axis_abbrev_resolve(idx)); },
    axisLabel(idx) { return readOut(ex.axis_label_resolve(idx)); },
    // 全軸を [{idx, abbrev, label, weight}] で返す。
    axes() {
      const n = ex.axis_count(), out = [];
      for (let i = 0; i < n; i++) out.push({ idx: i, abbrev: this.axisAbbrev(i), label: this.axisLabel(i), weight: ex.axis_weight(i) });
      return out;
    },
  };
}
