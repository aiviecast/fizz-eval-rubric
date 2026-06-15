# fizz-eval-rubric

kotodama-eval **7 軸ルーブリック**の正本。Almide 1 コアを native + wasm へ。
openaituber `kotodama/docs/eval-rubric.md` + `kotodama-cli/src/eval.rs` から、
軸の定義(メタデータ)だけを切り出した単一責任部品(§12 評価系)。

judge LLM の呼び出しは外部 API、**軸が何で・重みがいくつか**は純粋なのでここに集約。
集計の算術は [fizz-eval-score](https://github.com/Aid-On/fizz-eval-score)。

## 7 軸(Likert 1-7)

| idx | 略号 | 名称 | composite 重み |
|---:|---|---|---:|
| 0 | BEL | Believability(キャラ一貫性) | 0.20 |
| 1 | ENG | Engagement(続けたくなる) | 0.20 |
| 2 | TEX | Texture(callback / surprise) | 0.15 |
| 3 | INI | Initiative(会話を駆動) | 0.10 |
| 4 | EMO | Emotional resonance(情緒応答) | 0.20 |
| 5 | TEM | Tempo(テンポ感) | 0.10 |
| 6 | CON | Continuity(連続性) | 0.05 |

重み合計 = **1.00**(BEL/ENG/EMO 重視 — AITuber 用途の主観)。SOTOPIA のメタ設計を
継承しつつ、評価軸をタスク達成型から companion 型に作り直したもの。

## API

`axis_count()` / `score_min()` / `score_max()` / `is_valid_score(s)` /
`axis_index(abbrev)`(大小無視、未知 -1)/ `is_valid_axis(abbrev)` /
`axis_abbrev(idx)` / `axis_label(idx)` / `axis_weight(idx)` / `weights_sum()`。

## wasm 境界

index/weight/count/range は Int/Float。略号→index の文字列入力は `in_alloc` バッファ +
`from_list(to_list)` コピー経由(almide#690 回避)。abbrev/label の文字列出力は
`out_ptr` で読む。例: [`browser/rubric-driver.js`](browser/rubric-driver.js)。

## ビルド / テスト

```sh
almide test spec/eval_rubric_test.almd
almide build src/main.almd -o build/fizz-eval-rubric
almide build src/bridge.almd --target wasm -o build/rb.wasm
node test/wasm-smoke.mjs
```

Almide v0.27.7 で native / wasm とも green。
