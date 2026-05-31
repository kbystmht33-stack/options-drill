import { useState, useMemo } from "react";

const CARDS = [
  { cat:"基礎", q:"IV（インプライドボラティリティ）", c:"市場が予測する将来の価格変動の大きさ。高いほどプレミアムが厚くなる", a:"高い＝大きく動くと市場が読んでいる。プット売りはIVが高い時ほど受け取れるプレミアムが多い。これがプレミアム売り戦略の収益源。", ex:"暴落時にIV急騰→プレミアムが平常の3倍になる" },
  { cat:"基礎", q:"IV Rank", c:"過去52週のIVの中で今が何%の高さにあるかを示す相対指標", a:"10%＝ほぼ最安値水準。20%未満はプレミアムが薄すぎて売る価値がない。絶対値ではなく相対値で判断する点が重要。", ex:"IV Rank 10.5%→Gate3で弾かれる" },
  { cat:"基礎", q:"VIX（恐怖指数）", c:"市場全体の予想変動率。15以下＝穏やか、30超＝新規停止、35超＝暴落モード", a:"S&P500の30日予想変動率。数値が高いほど市場が不安定で恐怖が高まっている状態。プット売りのGate2で使う最重要指標。", ex:"VIX 15.32→通常モード、VIX 42→暴落・現金投入" },
  { cat:"基礎", q:"DTE（Days to Expiration）", c:"オプションの満期まで残り何日か。30〜45日が推奨帯域", a:"満期が近づくほどガンマリスクが増大する。21日を切ると急増するため、その前に対処するのが21日ルール。", ex:"35DTE＝今から35日後が満期" },
  { cat:"基礎", q:"プレミアム", c:"オプションを売った時に受け取る金額。IV Rankが高いほど厚くなる", a:"これを積み上げていくのがWheel戦略の収益源。受け取った金額の50%の含み益が出たら早期クローズして次に移る（50%利確ルール）。", ex:"$1.50受取→$0.75で利確→即日次のPCSへ" },
  { cat:"基礎", q:"ストライク（行使価格）", c:"オプション契約に定められた「この価格で取引する」という基準価格", a:"プット売りは株価がストライクを下回ると損失が発生する。OTM（安全）→ATM（境界）→ITM（危険）の判断基準になる。", ex:"$185ストライク→XLKが$185を下回ると損失リスク発生" },
  { cat:"基礎", q:"MA25（25日移動平均線）", c:"過去25営業日の終値の平均。株価がこれより上なら上昇トレンド", a:"Gate1として使う。MA25割れ＝下降トレンド＝新規プット売り即停止。他の全条件を見る前に確認する最初のフィルター。", ex:"XLK $191 ＞ MA25 $184→上昇トレンド→Gate1通過" },
  { cat:"基礎", q:"キャッシュ比率", c:"口座のうち現金（ポジションに使っていない）の割合", a:"平常時30〜50%を待機推奨。この現金が「暴落を拾いに行く」本命の武器になる。レバレッジを使わない安全な運用の核心。", ex:"$20,000口座でPCS証拠金$500使用→97.5%が現金" },
  { cat:"Greeks", q:"Delta（Δ）", c:"株価が$1動いた時のオプション価格の変化額。プット売りはデルタ0〜-1", a:"デルタ-0.20＝株が$1下がるとオプション価値が$0.20上がる（自分の損失が増える）。エントリー時は-0.15〜-0.30が安全圏。0.45超でロール検討。", ex:"Delta 0.20でエントリー→0.46に上昇→ロール判断" },
  { cat:"Greeks", q:"Theta（Θ）", c:"時間が1日経過するごとにオプション価値が減る金額。プット売り手の収入源", a:"毎日じわじわと自動的に利益が積み上がるイメージ。DTE 30〜45日がTheta収穫効率の最良帯域。時間が味方になる。", ex:"Theta 0.05＝1日で$5の価値が自動的に減る（売り手の利益）" },
  { cat:"Greeks", q:"Gamma（Γ）", c:"Deltaの変化率。満期が近いほど急激に大きくなる", a:"DTE 21日以内になると少しの価格変動でDeltaが激変し大きな損失になる。21日ルールの根拠。放置が最大の危険。", ex:"DTE 5日で株価1%下落→Deltaが0.3→0.7に急変" },
  { cat:"Greeks", q:"Vega（V）", c:"IVが1%上昇した時のオプション価格の変化。IV上昇はプット売り手に不利", a:"VIX急騰→IV上昇→Vega効果で保有ポジションの評価損が急拡大。「待てば戻るかも」が危険な理由がこれ。VIX 30超で防御アクション。", ex:"VIX 17→33に急騰→保有PCSの評価損が跳ね上がる" },
  { cat:"戦略", q:"CSP（Cash Secured Put）", c:"ストライク×100の現金を担保にプットを売る。最大損失は無制限だが強制退場がない", a:"$175×100＝$17,500を拘束。割当を受けても現金で株を買えるため証拠金不足にならない。安全だが$20,000口座では実質1枚が限界。", ex:"$175P CSP→$17,500の現金を拘束（口座の87.5%）" },
  { cat:"戦略", q:"PCS（Put Credit Spread）", c:"高いストライクのプットを売り、低いストライクのプットを買う2本セット。最大損失が確定する", a:"最大損失＝（幅×100）－受取プレミアム。証拠金は約$350（幅$5の場合）。CSPより資金効率が大幅に高く、割当が発生しない。", ex:"$185/$180 PCS→証拠金約$350、最大損失$500" },
  { cat:"戦略", q:"ロール（Roll）", c:"今のポジションを閉じて、満期を先送りした新しいポジションを同時に開くこと", a:"条件：ネットクレジット（追加でプレミアムを受け取れる状態）の時のみ実行。ネットデビットになるなら損失確定で終了する方がよい。", ex:"6月満期を$2.00で買戻→7月満期を$2.30で売る→$0.30のネットクレジット" },
  { cat:"戦略", q:"VRP（ボラティリティリスクプレミアム）", c:"IVが実際の価格変動（実現ボラ）を平均的に上回る構造的差額", a:"オプションは平均的に割高に売られている。プット売りはこの差額を構造的に収穫できる。これがWheel戦略の本質的なエッジ。", ex:"IV 25% ＞ 実現ボラ 18%→差7%を毎サイクル収穫" },
  { cat:"戦略", q:"Wheel戦略", c:"CSPでプレミアム受取→割当→カバードコール→また最初へのサイクル", a:"本当に保有していい銘柄（XLK等）でのみ使える。プレミアムを積み上げながらコストベースを下げていく長期戦。PCSを使うとWheelは回らない。", ex:"CSP→XLK割当→CC売り→コール割当→再びCSP" },
  { cat:"ルール", q:"50%利確ルール", c:"プレミアムの50%の含み益が出たら早期クローズして次に移るルール", a:"残りの50%を取ろうとするより素早くクローズして次を建てた方が年間リターンが高い。リスクにさらされる時間の最小化が本質。", ex:"$1.50受取→オプション価値が$0.75以下→買い戻して利確" },
  { cat:"ルール", q:"21日ルール", c:"満期まで21日を切ったらロールか決済を検討するルール", a:"DTE 21日以内はGammaリスクが急増し放置が危険。50%利確できていなくても21日到達時点で対処する。「もう少し待てば」が最大の落とし穴。", ex:"DTE 21日到達→利確できていなくてもロールか決済" },
  { cat:"ルール", q:"ネットクレジット", c:"ロール時に受け取るプレミアムが買い戻しコストを上回る状態", a:"ネットクレジット＝ロール実行OK。ネットデビット（払う方が多い）＝ロール不可→損失確定で終了。ロールは「損失の先送り」に使ってはいけない。", ex:"買戻$2.00・新規売$2.30→$0.30のネットクレジット→ロール実行" },
];

const CATS = ["全て","基礎","Greeks","戦略","ルール"];
const CAT_CLR = { "全て":"#6366f1","基礎":"#3B82F6","Greeks":"#8B5CF6","戦略":"#10B981","ルール":"#F59E0B" };

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function makeChoices(cards, card) {
  const same = shuffle(cards.filter(c => c !== card && c.cat === card.cat));
  const other = shuffle(cards.filter(c => c !== card && c.cat !== card.cat));
  const pool = [...same, ...other];
  return shuffle([...pool.slice(0, 3), card]);
}

const S = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{height:100%;font-family:'DM Sans',sans-serif;background:#0e0e0f;color:#ece9e1}
.app{max-width:420px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;padding-bottom:env(safe-area-inset-bottom,24px)}
.hd{padding:16px 18px 10px;display:flex;align-items:center;justify-content:space-between}
.brand{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.22em;color:#444;text-transform:uppercase}
.mode-badge{font-family:'DM Mono',monospace;font-size:11px;padding:4px 10px;border-radius:20px;font-weight:500}
.mode-learn{background:#1a2535;color:#60A5FA;border:1px solid #1e3a5f}
.mode-quiz{background:#12231a;color:#34D399;border:1px solid #1a4a30}
.cats{display:flex;gap:6px;padding:0 16px 12px;overflow-x:auto;scrollbar-width:none}
.cats::-webkit-scrollbar{display:none}
.cat{flex-shrink:0;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:500;border:1.5px solid #1e1e1e;background:none;color:#555;cursor:pointer;transition:.15s}
.cat.on{border-color:var(--cc);color:var(--cc);background:color-mix(in srgb,var(--cc) 12%,transparent)}
.prog-wrap{padding:0 18px 6px}
.prog-label{display:flex;justify-content:space-between;font-family:'DM Mono',monospace;font-size:10px;color:#444;margin-bottom:6px}
.prog{height:2px;background:#1a1a1a;border-radius:1px}
.prog-in{height:100%;border-radius:1px;transition:width .4s}
.body{flex:1;padding:0 18px;display:flex;flex-direction:column}

/* ── フリップカード ── */
.flip-area{flex:1;display:flex;align-items:center;perspective:1200px;margin-bottom:16px;cursor:pointer;min-height:280px}
.flip-wrap{width:100%;position:relative;transform-style:preserve-3d;transition:transform .42s cubic-bezier(.175,.885,.32,1.275)}
.flip-wrap.flipped{transform:rotateY(180deg)}
.face{position:absolute;inset:0;border-radius:20px;padding:28px 22px;display:flex;flex-direction:column;backface-visibility:hidden;-webkit-backface-visibility:hidden;min-height:260px}
.front{background:#161618;border:1px solid #242426}
.back{background:#111113;border:1px solid #1e1e20;transform:rotateY(180deg)}
.f-cat{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;margin-bottom:18px;opacity:.7}
.f-term{font-size:22px;font-weight:600;line-height:1.35;color:#ece9e1;flex:1;display:flex;align-items:center}
.f-hint{font-size:11px;color:#2a2a2c;text-align:center;margin-top:12px;font-family:'DM Mono',monospace}
.b-def{font-size:14px;line-height:1.75;color:#c8c4bc;flex:1}
.b-eg-label{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#3B82F6;margin-top:14px;margin-bottom:5px}
.b-eg{font-family:'DM Mono',monospace;font-size:11px;color:#4B6A8F;line-height:1.6}
.flip-btns{display:flex;gap:10px;margin-top:4px}
.fb{flex:1;padding:15px;border-radius:14px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;border:none;cursor:pointer;transition:.12s}
.fb:active{transform:scale(.97)}
.fb-next{background:#161618;color:#888;border:1.5px solid #242426}
.fb-go{background:#3B82F6;color:#fff}
.fb-go:disabled{opacity:.35;cursor:default}

/* ── 4択 ── */
.q-meta{display:flex;align-items:center;gap:8px;margin-bottom:14px}
.q-cat{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase}
.q-num{font-family:'DM Mono',monospace;font-size:10px;color:#333}
.q-text{font-size:17px;font-weight:600;line-height:1.5;color:#ece9e1;margin-bottom:22px}
.choices{display:flex;flex-direction:column;gap:9px;margin-bottom:12px}
.ch{width:100%;padding:15px 16px;border-radius:14px;background:#161618;border:1.5px solid #222;color:#9a9690;font-size:13px;font-weight:500;line-height:1.5;cursor:pointer;text-align:left;font-family:'DM Sans',sans-serif;transition:border-color .12s,background .12s;min-height:52px}
.ch:hover:not(:disabled){border-color:#333;color:#ccc}
.ch:disabled{cursor:default}
.ch.ok{background:#0d1f14;border-color:#10B981;color:#4ade80}
.ch.ng{background:#1f0e0e;border-color:#ef4444;color:#f87171}
.ch.dim{opacity:.3}
.explain{background:#161618;border:1px solid #222;border-radius:14px;padding:15px 16px;margin-bottom:10px;animation:fi .2s ease}
@keyframes fi{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
.ex-l{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:7px}
.ex-l.ok{color:#10B981}.ex-l.ng{color:#ef4444}
.ex-body{font-size:12px;color:#7a7670;line-height:1.75}
.ex-eg{font-family:'DM Mono',monospace;font-size:11px;color:#4B6A8F;margin-top:8px;line-height:1.6}
.next-btn{width:100%;padding:15px;border-radius:14px;background:#10B981;border:none;color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif}

/* ── 完了 ── */
.done{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 20px;text-align:center}
.done-icon{font-size:50px;margin-bottom:16px}
.done-title{font-size:20px;font-weight:600;margin-bottom:6px}
.done-sub{font-size:13px;color:#555;line-height:1.7;margin-bottom:26px}
.done-grid{display:flex;gap:20px;margin-bottom:28px}
.ds{text-align:center}
.ds-n{font-family:'DM Mono',monospace;font-size:26px;font-weight:500}
.ds-l{font-size:11px;color:#555;margin-top:3px}
.re-btn{padding:14px 36px;border-radius:14px;background:#3B82F6;border:none;color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;margin-bottom:10px;width:100%}
.re-btn2{padding:14px 36px;border-radius:14px;background:#161618;border:1.5px solid #242426;color:#888;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;width:100%}

/* ── フェーズ案内 ── */
.phase-card{margin:0 18px 16px;background:#161618;border:1px solid #242426;border-radius:16px;padding:20px;text-align:center}
.phase-icon{font-size:32px;margin-bottom:10px}
.phase-title{font-size:17px;font-weight:600;margin-bottom:6px}
.phase-desc{font-size:13px;color:#666;line-height:1.65;margin-bottom:16px}
.phase-btn{width:100%;padding:14px;border-radius:12px;border:none;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer}
.phase-btn-b{background:#3B82F6;color:#fff}
.phase-btn-g{background:#10B981;color:#fff}
`;

export default function Drill() {
  const [cat, setCat] = useState("全て");
  const [seed, setSeed] = useState(0);
  const [phase, setPhase] = useState("learn"); // learn | transition | quiz | done
  const [learnIdx, setLearnIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [quizIdx, setQuizIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correct, setCorrect] = useState(0);

  const deck = useMemo(() => {
    const base = cat === "全て" ? CARDS : CARDS.filter(c => c.cat === cat);
    return shuffle(base);
  }, [cat, seed]);

  const cc = CAT_CLR[cat];
  const total = deck.length;

  // ── 学習モード ──
  const lcard = deck[learnIdx];
  function flipCard() { if (phase === "learn") setFlipped(f => !f); }
  function learnNext() {
    if (learnIdx + 1 >= total) { setPhase("transition"); return; }
    setFlipped(false);
    setTimeout(() => setLearnIdx(i => i + 1), 50);
  }

  // ── 確認モード ──
  const qcard = deck[quizIdx];
  const choices = useMemo(() => qcard ? makeChoices(deck, qcard) : [], [quizIdx, deck]);
  const isCorrect = selected && selected.c === qcard?.c;

  function select(ch) {
    if (selected) return;
    setSelected(ch);
    if (ch.c === qcard.c) setCorrect(n => n + 1);
  }
  function quizNext() {
    if (quizIdx + 1 >= total) { setPhase("done"); return; }
    setSelected(null);
    setQuizIdx(i => i + 1);
  }

  function restart(fromLearn) {
    setSeed(s => s + 1);
    setLearnIdx(0); setFlipped(false);
    setQuizIdx(0); setSelected(null); setCorrect(0);
    setPhase(fromLearn ? "learn" : "quiz");
  }

  function changeCat(c) {
    setCat(c); setSeed(s => s + 1);
    setLearnIdx(0); setFlipped(false);
    setQuizIdx(0); setSelected(null); setCorrect(0);
    setPhase("learn");
  }

  const pct = total > 0 ? Math.round(correct / total * 100) : 0;

  return (
    <>
      <style>{S}</style>
      <div className="app">
        <div className="hd">
          <span className="brand">Options Drill</span>
          {phase === "learn" && <span className="mode-badge mode-learn">📖 学習モード</span>}
          {phase === "quiz" && <span className="mode-badge mode-quiz">✏️ 確認モード</span>}
        </div>

        <div className="cats">
          {CATS.map(c => (
            <button key={c} className={`cat${cat===c?" on":""}`}
              style={{"--cc": CAT_CLR[c]}}
              onClick={() => changeCat(c)}>{c}</button>
          ))}
        </div>

        {phase === "learn" && (
          <>
            <div className="prog-wrap">
              <div className="prog-label">
                <span>学習 {learnIdx+1} / {total}</span>
                <span style={{color:"#60A5FA"}}>まず読んで覚える</span>
              </div>
              <div className="prog"><div className="prog-in" style={{width:((learnIdx/total)*100)+"%", background:"#3B82F6"}}/></div>
            </div>
            <div className="body">
              <div className="flip-area" onClick={flipCard}>
                <div className={`flip-wrap${flipped?" flipped":""}`} style={{height:260}}>
                  <div className="face front">
                    <div className="f-cat" style={{color: CAT_CLR[lcard?.cat]}}>{lcard?.cat}</div>
                    <div className="f-term">{lcard?.q}</div>
                    <div className="f-hint">タップして意味を見る</div>
                  </div>
                  <div className="face back">
                    <div className="f-cat" style={{color: CAT_CLR[lcard?.cat]}}>{lcard?.cat}</div>
                    <div className="b-def">{lcard?.c}</div>
                    <div className="b-eg-label">例</div>
                    <div className="b-eg">{lcard?.ex}</div>
                  </div>
                </div>
              </div>
              <div className="flip-btns">
                <button className="fb fb-next" onClick={learnNext}>
                  {learnIdx+1 >= total ? "確認モードへ →" : "次へ →"}
                </button>
                <button className="fb fb-go" disabled={!flipped} onClick={learnNext}>
                  {learnIdx+1 >= total ? "テスト開始 ✓" : "覚えた ✓"}
                </button>
              </div>
            </div>
          </>
        )}

        {phase === "transition" && (
          <>
            <div style={{flex:1,display:"flex",alignItems:"center",padding:"0 18px"}}>
              <div className="phase-card" style={{margin:0,width:"100%"}}>
                <div className="phase-icon">🧠</div>
                <div className="phase-title">学習完了！確認テストへ</div>
                <div className="phase-desc">
                  {total}枚を読み終えました。<br/>
                  次は同じカードが4択問題として出ます。<br/>
                  <strong style={{color:"#ece9e1"}}>さっき読んだ内容を思い出しながら</strong>選んでください。<br/>
                  この「思い出す」プロセスが記憶を定着させます。
                </div>
                <button className="phase-btn phase-btn-g" onClick={() => setPhase("quiz")}>
                  確認テストを開始する →
                </button>
              </div>
            </div>
          </>
        )}

        {phase === "quiz" && qcard && (
          <>
            <div className="prog-wrap">
              <div className="prog-label">
                <span>確認 {quizIdx+1} / {total}</span>
                <span style={{color:"#34D399"}}>{correct} 正解</span>
              </div>
              <div className="prog"><div className="prog-in" style={{width:((quizIdx/total)*100)+"%", background:"#10B981"}}/></div>
            </div>
            <div className="body">
              <div className="q-meta">
                <span className="q-cat" style={{color: CAT_CLR[qcard.cat]}}>{qcard.cat}</span>
              </div>
              <div className="q-text">「{qcard.q}」の説明として正しいのはどれ？</div>
              <div className="choices">
                {choices.map((ch, i) => {
                  const isThis = ch.c === qcard.c;
                  const isWrong = selected && selected.c === ch.c && !isThis;
                  const isDim = selected && !isThis && selected.c !== ch.c;
                  return (
                    <button key={i}
                      className={`ch${isThis && selected?" ok":""}${isWrong?" ng":""}${isDim?" dim":""}`}
                      onClick={() => select(ch)} disabled={!!selected}>
                      {ch.c}
                    </button>
                  );
                })}
              </div>
              {selected && (
                <>
                  <div className="explain">
                    <div className={`ex-l ${isCorrect?"ok":"ng"}`}>
                      {isCorrect ? "✓ 正解" : "✗ 不正解 — 正しくはこう"}
                    </div>
                    <div className="ex-body">{qcard.a}</div>
                    {qcard.ex && <div className="ex-eg">例 → {qcard.ex}</div>}
                  </div>
                  <button className="next-btn" onClick={quizNext}>
                    {quizIdx+1 >= total ? "結果を見る" : "次の問題 →"}
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {phase === "done" && (
          <div className="done">
            <div className="done-icon">{pct>=80?"🎯":pct>=60?"💪":"📚"}</div>
            <div className="done-title">{pct>=80?"完璧！":pct>=60?"いい調子！":"もう一周しよう"}</div>
            <div className="done-sub">
              {total}問完走。<br/>
              {pct>=80?"この調子で別カテゴリも。":pct>=60?"間違えた問題を重点的に。":"学習→確認をもう一周するのが効果的。"}
            </div>
            <div className="done-grid">
              <div className="ds"><div className="ds-n" style={{color:"#10B981"}}>{correct}</div><div className="ds-l">正解</div></div>
              <div className="ds"><div className="ds-n" style={{color:"#ef4444"}}>{total-correct}</div><div className="ds-l">不正解</div></div>
              <div className="ds"><div className="ds-n">{pct}%</div><div className="ds-l">正答率</div></div>
            </div>
            <button className="re-btn" onClick={() => restart(true)}>最初から（学習→確認）</button>
            <button className="re-btn2" onClick={() => restart(false)}>確認テストだけ再挑戦</button>
          </div>
        )}
      </div>
    </>
  );
}
