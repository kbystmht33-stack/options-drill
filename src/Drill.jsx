import { useState, useMemo } from "react";

const CARDS = [
  // ── 基礎 ──
  { cat:"基礎", q:"IV（インプライドボラティリティ）とは何か？", c:"市場が予測する将来の価格変動の大きさ。高いほどプレミアムが厚くなる", a:"高い＝大きく動くと市場が読んでいる。プット売りはIVが高い時ほど受け取れるプレミアムが多い。これがプレミアム売り戦略の収益源。", ex:"暴落時にIV急騰→プレミアムが平常の3倍になる" },
  { cat:"基礎", q:"IV Rankが20%未満の時、なぜエントリーしないのか？", c:"プレミアムが過去52週で最も薄い水準にあり、売る価値がないから", a:"IV Rankは過去52週での相対的な高さ。10%＝ほぼ最安値水準。この状態でプットを売ると、リスクを取る見返りが小さすぎる。現在のXLK（10.5%）がまさにこれ。", ex:"IV Rank 10.5%→Gate3で弾かれる" },
  { cat:"基礎", q:"VIXが35を超えた時、戦略はどう変わるか？", c:"通常の売り戦略を停止し、積み上げた現金を段階的に投入する本命局面", a:"VIX 35超＝暴落モード。新規のプット売りは停止。逆に、ここが現金投入の本命チャンス。段階的に投入（一度に全額は禁止）。", ex:"VIX 42→現金を3〜5分割で投入開始" },
  { cat:"基礎", q:"DTE（Days to Expiration）21日のルールとは？", c:"21日を切るとガンマリスクが急増するため、利確またはロールを検討するルール", a:"満期が近づくほどガンマが急増し、わずかな価格変動でも大きな損失になる。50%利確できていなくても21日到達時点で対処する。放置が最大の危険。", ex:"DTE 21日到達→放置せずロールか決済" },
  { cat:"基礎", q:"MA25を株価が下回った時、何をすべきか？", c:"新規プット売りを即停止。他の全条件を見ずに「Gate1でアウト」", a:"MA25割れ＝下降トレンド突入のサイン。どれだけIV Rankが高くても、ストキャスが底値でも、新規エントリーは禁止。既存ポジションの管理と現金積み上げに専念。", ex:"XLK $178、MA25 $184 → MA25割れ → 新規停止" },
  { cat:"基礎", q:"ストライク（行使価格）$185のプットを売った。XLKが$182に下落した。何が起きるか？", c:"ストライクを下回ったのでITM（危険ゾーン）に入り、割当リスクが高まる", a:"プット売りはストライクを下回ると損失が拡大する。$185ストライクで$182に下落→$3分（$300）の評価損。さらに下がり続ければ損失は増加。デルタが上昇しロール判断が必要になる。", ex:"XLK $182 < ストライク$185 → ITM → Delta上昇確認" },
  { cat:"基礎", q:"プレミアムの50%利確ルールの目的は何か？", c:"早期に利益を確定して次のポジションに移り、年間の取引回転数を増やすため", a:"残りの50%を取ろうとするより、素早くクローズして次を建てる方が年間リターンが高い。リスクにさらされている時間を最小化するのが本質。", ex:"$1.50受取→$0.75で買戻→即日で次のPCSへ" },
  { cat:"基礎", q:"キャッシュ比率を平常時30〜50%に保つ最大の理由は？", c:"暴落時に現金を投入できる「弾」を確保しておくため", a:"レバレッジを使わない安全な運用の核心。現金が多い＝暴落時に買える武器がある。VIX 35超の局面でこの現金が真価を発揮する。ここがこの戦略の本命。", ex:"$20,000の50%=$10,000が待機中→暴落で投入できる" },
  // ── Greeks ──
  { cat:"Greeks", q:"Delta 0.45超えはなぜ危険なサインか？", c:"ATM（ストライク付近）に接近し、割当リスクが急増しているから", a:"デルタはプット売りで-0.15〜-0.30が安全圏。0.45超はストライクに株価が近づいた状態。ここでロール可能か確認し、できなければ損失確定で終了する。", ex:"Delta 0.20でエントリー→0.46に上昇→即ロール検討" },
  { cat:"Greeks", q:"Theta（シータ）はプット売り手にとって何を意味するか？", c:"時間が経つだけで自動的に利益が積み上がる「収入源」", a:"Theta＝1日でオプション価値が減る金額。プット売り手は時間の経過が有利。毎日じわじわと含み益が増える。DTE 30〜45日がThetaの収穫効率が最もよい帯域。", ex:"Theta 0.05＝1日で$5の価値が自動的に減る（売り手の利益）" },
  { cat:"Greeks", q:"VIX急騰時に保有中のPCSがどうなるか？", c:"VegaとDeltaの効果で評価損が急拡大する", a:"VIX急騰＝IV上昇→Vega効果でオプション価値が増える＝売り手の損失が増える。同時にDeltaも変化する。「待てば戻るかも」が最大の危険でVIX 30超えで防御アクションが必要。", ex:"VIX 17→33に急騰→保有PCSの評価損が跳ね上がる" },
  { cat:"Greeks", q:"なぜDTE 21日以内のポジションは危険か？", c:"Gamma（ガンマ）が急増し、小さな価格変動で大きな損失が発生するから", a:"Gamma＝Deltaの変化率。満期が近いほど指数関数的に大きくなる。DTE 21日以内は株価が少し動くだけでDeltaが激変する。21日ルールの根拠がこれ。", ex:"DTE 5日で株価1%下落→Delta が0.3→0.7に急変" },
  // ── 戦略 ──
  { cat:"戦略", q:"CSP（現金確保プット売り）とPCSの最大の違いは？", c:"CSPは全額を証拠金に拘束するがPCSは最大損失が幅で確定し資金効率が高い", a:"CSP＝ストライク×100の全額を拘束（$175×100=$17,500）。PCS＝（幅×100）－受取プレミアムだけ（$5幅なら約$350）。PCSは資金効率が大幅に高いが、割当が起きない（Wheelが回らない）トレードオフがある。", ex:"$20,000口座：CSP1枚 vs PCS約40枚（理論値）" },
  { cat:"戦略", q:"Wheel戦略でカバードコールのストライクをコストベース以上に設定する理由は？", c:"コストベース未満で設定すると、コール割当時に損失が確定してしまうから", a:"コストベース＝プットで割り当てられた価格。それ以上でコールを売ることで、少なくとも損をしないで株を手放せる。コストベース未満は「割り当てられた価格より安く売る」ことになる。", ex:"$175で割当→CCストライクは$175以上に設定" },
  { cat:"戦略", q:"ロール（Roll）をネットデビットで実行してはいけない理由は？", c:"追加でお金を払ってポジションを延長するのは損失の先送りにすぎないから", a:"ロール＝既存をクローズして満期延長した新規を開く。ネットクレジット（追加プレミアム受取）なら損失をコストベース改善で相殺できる。ネットデビット（払う方が多い）は損失をただ先送りしているだけ。", ex:"旧クローズ$2.00・新規売$1.80→$0.20のネットデビット→実行しない" },
  { cat:"戦略", q:"なぜVRPはプット売り戦略の「本質的なエッジ」なのか？", c:"IVが実際の価格変動（実現ボラ）を平均的に上回る構造的な差額を収穫できるから", a:"Volatility Risk Premium＝市場のオプションは平均的に割高。保険料のように売り手が構造的なプレミアムを受け取れる。これが「長期で続ければプラスになる」根拠。ただし暴落時のテールリスクが対価。", ex:"IV 25% > 実現ボラ 18%→差7%を毎サイクル収穫" },
  // ── ルール ──
  { cat:"ルール", q:"IV Rankが低いのにエントリーしたい場合、どうすべきか？", c:"我慢して待つ。条件が整わない日は記録だけして見送りが正解", a:"「条件が揃わない日にエントリーしない」がこの戦略の最も重要なスキル。低IV RankでのエントリーはVRPが薄くリスクだけを取ることになる。毎日記録して、20%超えた日を待つ。", ex:"IV Rank 10.5%→「見送り」と記録してジャーナルへ" },
  { cat:"ルール", q:"ストキャスが70を超えている時、他の全Gateが通過していたらどうする？", c:"当日は見送り。ストキャスが80を割って下向きになるまで待つ", a:"ストキャス70超＝過熱状態で売られすぎていない。この状態でプットを売ると、その後の「普通の押し目」でも割当リスクが高まる。あと数日で良いタイミングが来る可能性が高い。", ex:"ストキャス 92→全条件OK でも当日見送り" },
  { cat:"ルール", q:"VIX 22の時、通常モードと何が変わるか？", c:"縮小モード：デルタを0.15〜0.20に下げ、枚数を半分にしてエントリー", a:"VIX 20〜30＝縮小モード（通過はするが条件あり）。エントリー禁止ではない。ただし規模を小さくしてリスクを抑える。市場が不安定な時期に無理に大きく張らない。", ex:"VIX 22→デルタ0.20→1枚のみ（通常の半分）" },
  { cat:"ルール", q:"暴落時に現金を「段階的に投入」する理由は？", c:"底値がどこかわからないため、一度に全額投入すると底値前に資金が尽きるリスクがあるから", a:"暴落時は「まだ下がるかもしれない」状態。一気に全額入れると、さらに下がった時に追加投入できない。3〜5回に分けて入れることで平均取得単価を下げながらリスクを分散する。", ex:"VIX 42：現金の1/3ずつ3週間かけて投入" },
];

const CATS = ["全て","基礎","Greeks","戦略","ルール"];
const CAT_CLR = { "全て":"#6366f1","基礎":"#3B82F6","Greeks":"#8B5CF6","戦略":"#10B981","ルール":"#F59E0B" };

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function makeChoices(cards, idx) {
  const correct = cards[idx];
  const sameCat = cards.filter((c, i) => i !== idx && c.cat === correct.cat);
  const other = cards.filter((c, i) => i !== idx && c.cat !== correct.cat);
  const pool = shuffle([...sameCat, ...other]);
  const wrongs = pool.slice(0, 3);
  return shuffle([...wrongs, correct]);
}

const S = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{height:100%;font-family:'DM Sans',sans-serif;background:#0e0e0f;color:#ece9e1}
.app{max-width:420px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;padding-bottom:env(safe-area-inset-bottom,20px)}
.hd{display:flex;align-items:center;justify-content:space-between;padding:16px 18px 10px}
.brand{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.22em;color:#444;text-transform:uppercase}
.score{font-family:'DM Mono',monospace;font-size:12px;color:#555}
.score b{color:#10B981;font-weight:500}
.cats{display:flex;gap:6px;padding:0 16px 12px;overflow-x:auto;scrollbar-width:none}
.cats::-webkit-scrollbar{display:none}
.cat{flex-shrink:0;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:500;border:1.5px solid #1e1e1e;background:none;color:#555;cursor:pointer;transition:.15s}
.cat.on{border-color:var(--cc);color:var(--cc);background:color-mix(in srgb,var(--cc) 12%,transparent)}
.prog{height:2px;background:#1a1a1a;margin:0 18px 20px;border-radius:1px}
.prog-in{height:100%;border-radius:1px;transition:width .4s cubic-bezier(.4,0,.2,1)}
.q-wrap{padding:0 18px;flex:1;display:flex;flex-direction:column}
.q-meta{display:flex;align-items:center;gap:8px;margin-bottom:16px}
.q-cat{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase}
.q-num{font-family:'DM Mono',monospace;font-size:10px;color:#333}
.q-text{font-size:18px;font-weight:600;line-height:1.5;color:#ece9e1;margin-bottom:28px;flex:1}
.choices{display:flex;flex-direction:column;gap:10px;margin-bottom:14px}
.choice{width:100%;padding:16px 18px;border-radius:14px;background:#161618;border:1.5px solid #222;color:#a8a49c;font-size:13px;font-weight:500;line-height:1.5;cursor:pointer;text-align:left;font-family:'DM Sans',sans-serif;transition:border-color .12s,background .12s,color .12s;min-height:56px}
.choice:hover:not(:disabled){border-color:#333;color:#ccc;background:#1a1a1c}
.choice:disabled{cursor:default}
.choice.correct{background:#0d1f14;border-color:#10B981;color:#4ade80}
.choice.wrong{background:#1f0e0e;border-color:#ef4444;color:#f87171}
.choice.dim{opacity:.35}
.explain{background:#161618;border:1px solid #222;border-radius:14px;padding:16px 18px;margin-bottom:12px;animation:fadin .2s ease}
@keyframes fadin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.ex-label{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#3B82F6;margin-bottom:7px}
.ex-body{font-size:13px;color:#8a8680;line-height:1.7}
.ex-eg{font-family:'DM Mono',monospace;font-size:11px;color:#4B6A8F;margin-top:9px;line-height:1.6}
.next-btn{width:100%;padding:16px;border-radius:14px;background:#10B981;border:none;color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:filter .15s;margin-bottom:4px}
.next-btn:hover{filter:brightness(1.08)}
.done{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;text-align:center}
.done-icon{font-size:52px;margin-bottom:18px}
.done-title{font-size:22px;font-weight:600;margin-bottom:6px}
.done-sub{font-size:13px;color:#555;line-height:1.7;margin-bottom:28px}
.done-grid{display:flex;gap:24px;margin-bottom:32px}
.ds{text-align:center}
.ds-n{font-family:'DM Mono',monospace;font-size:26px;font-weight:500}
.ds-l{font-size:11px;color:#555;margin-top:4px}
.re-btn{padding:15px 40px;border-radius:14px;background:#10B981;border:none;color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif}
`;

export default function Drill() {
  const [cat, setCat] = useState("全て");
  const [deckSeed] = useState(() => Math.random());
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [key, setKey] = useState(0);

  const deck = useMemo(() => {
    const base = cat === "全て" ? CARDS : CARDS.filter(c => c.cat === cat);
    return shuffle(base);
  }, [cat, key]);

  const card = deck[idx];
  const choices = useMemo(() => card ? makeChoices(deck.concat(
    CARDS.filter(c => !deck.includes(c))
  ), deck.indexOf(card)) : [], [idx, deck]);

  const total = deck.length;
  const isCorrect = selected && selected.c === card?.c;
  const cc = CAT_CLR[cat];

  function select(ch) {
    if (selected) return;
    setSelected(ch);
    if (ch.c === card.c) setCorrect(n => n + 1);
  }

  function next() {
    if (idx + 1 >= total) { setDone(true); return; }
    setSelected(null);
    setIdx(i => i + 1);
  }

  function restart() {
    setIdx(0); setSelected(null); setCorrect(0); setDone(false); setKey(k => k + 1);
  }

  function changeCat(c) {
    setCat(c); setIdx(0); setSelected(null); setCorrect(0); setDone(false); setKey(k => k + 1);
  }

  const pct = Math.round(correct / Math.max(idx + (selected ? 1 : 0), 1) * 100);

  return (
    <>
      <style>{S}</style>
      <div className="app">
        <div className="hd">
          <span className="brand">Options Drill</span>
          <span className="score">{done ? "" : <><b>{correct}</b> / {idx + (selected ? 1 : 0)} 正答</>}</span>
        </div>

        <div className="cats">
          {CATS.map(c => (
            <button key={c} className={`cat${cat===c?" on":""}`}
              style={{"--cc": CAT_CLR[c]}}
              onClick={() => changeCat(c)}>{c}</button>
          ))}
        </div>

        <div className="prog">
          <div className="prog-in" style={{
            width: done ? "100%" : ((idx / total) * 100) + "%",
            background: cc
          }}/>
        </div>

        {done ? (
          <div className="done">
            <div className="done-icon">{correct/total >= .8 ? "🎯" : correct/total >= .5 ? "💪" : "📚"}</div>
            <div className="done-title">{correct/total >= .8 ? "完璧！" : correct/total >= .6 ? "いい調子！" : "もう一周しよう"}</div>
            <div className="done-sub">{total}問完走。<br/>間違えた問題が次の勉強ポイント。</div>
            <div className="done-grid">
              <div className="ds"><div className="ds-n" style={{color:"#10B981"}}>{correct}</div><div className="ds-l">正解</div></div>
              <div className="ds"><div className="ds-n" style={{color:"#ef4444"}}>{total-correct}</div><div className="ds-l">不正解</div></div>
              <div className="ds"><div className="ds-n">{pct}%</div><div className="ds-l">正答率</div></div>
            </div>
            <button className="re-btn" onClick={restart}>もう一度</button>
          </div>
        ) : card && (
          <div className="q-wrap">
            <div className="q-meta">
              <span className="q-cat" style={{color: CAT_CLR[card.cat]}}>{card.cat}</span>
              <span className="q-num">{idx+1} / {total}</span>
            </div>
            <div className="q-text">{card.q}</div>

            <div className="choices">
              {choices.map((ch, i) => {
                const isThis = ch.c === card.c;
                const isWrong = selected && selected.c === ch.c && !isThis;
                const isDim = selected && !isThis && selected.c !== ch.c;
                return (
                  <button key={i}
                    className={`choice${isThis && selected ? " correct" : ""}${isWrong ? " wrong" : ""}${isDim ? " dim" : ""}`}
                    onClick={() => select(ch)}
                    disabled={!!selected}>
                    {ch.c}
                  </button>
                );
              })}
            </div>

            {selected && (
              <>
                <div className="explain">
                  <div className="ex-label">{isCorrect ? "✓ 正解" : "✗ 不正解 — 正しくはこう"}</div>
                  <div className="ex-body">{card.a}</div>
                  {card.ex && <div className="ex-eg">例 → {card.ex}</div>}
                </div>
                <button className="next-btn" onClick={next}>
                  {idx + 1 >= total ? "結果を見る" : "次の問題 →"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
