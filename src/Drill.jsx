import { useState, useMemo, useEffect } from "react";

const CARDS = [
  // ── 基礎構造 ──
  { id:"b01", cat:"基礎", q:"オプションとは何か？", c:"将来ある価格で売買する『権利』を売買する金融商品", a:"株などと違い『権利』そのものを売買する。買い手は権利を持ち、売り手は義務を負う。プット売りは『買い取る義務』を引き受けてプレミアムを受け取る。", ex:"XLK $185プット売り＝$185で買い取る義務を引き受け、プレミアムを受取" },
  { id:"b02", cat:"基礎", q:"コールとプットの違いは？", c:"コール＝買う権利、プット＝売る権利", a:"コール買い手は株を決まった価格で買える権利を持つ。プット買い手は株を決まった価格で売れる権利を持つ。プット売り手はその反対側＝買い取る義務。", ex:"XLK $185プット買い＝$185でXLKを売れる権利" },
  { id:"b03", cat:"基礎", q:"プット売りで受け取るプレミアムは何の対価か？", c:"相手に『売る権利』を提供する対価。下落リスクを引き受ける保険料", a:"プット買い手は保険を買っている。プット売り手は保険会社。平常時はプレミアムが収入になるが、暴落時は保険金（損失）を払う立場になる。", ex:"VIX上昇でプレミアム増加＝リスクが高まっている証拠" },
  { id:"b04", cat:"基礎", q:"ITM・ATM・OTMとは？", c:"ITM＝危険ゾーン、ATM＝境界線、OTM＝安全ゾーン", a:"プット売りでは株価＞ストライク＝OTM（安全）、株価≒ストライク＝ATM（境界）、株価＜ストライク＝ITM（損失発生）。Deltaで判断できる。", ex:"XLK $191、ストライク$185→OTM（$6の余裕）" },
  { id:"b05", cat:"基礎", q:"ペイオフ（損益図）とは何か？", c:"満期時の株価に対する損益を示した図。どこから利益が出てどこから損失が出るかを視覚化", a:"プット売りのペイオフは右肩上がりの折れ線。ストライク以上なら受取プレミアム分の利益。ストライク以下に行くほど損失が拡大。", ex:"$185P売り＋$1.50受取：$185以上＝$150利益、$183.50＝損益ゼロ" },
  { id:"b06", cat:"基礎", q:"証拠金とは何か？CSPとPCSで何が違う？", c:"損失に備えて差し出す担保金。CSPはストライク全額、PCSは幅だけ", a:"CSP＝ストライク×100の全額を拘束（$175×100＝$17,500）。PCS＝（幅×100）－受取プレミアム（$5幅なら約$350）。PCSは少ない担保で同等のプレミアムを受け取れる。", ex:"$20,000口座：CSP1枚 vs PCS約40枚（理論値）" },
  { id:"b07", cat:"基礎", q:"損益分岐点とは何か？", c:"利益でも損失でもない価格。受取プレミアム分だけストライクより下がった価格", a:"プット売りの損益分岐点＝ストライク－受取プレミアム。この価格まで下がると利益がゼロになる。これ以上下がると損失が始まる。", ex:"$185P売り＋$1.50受取：損益分岐点＝$183.50" },
  // ── Greeks ──
  { id:"g01", cat:"Greeks", q:"Delta（Δ）とは？", c:"株価が$1動いた時のオプション価格の変化額", a:"プット売りはデルタ0〜-1。デルタ-0.20＝株が$1下がると損失が$0.20増える。エントリー時は-0.15〜-0.30が安全圏。デルタ0.45超でロール検討。", ex:"Delta 0.20でエントリー→0.46に上昇→ロール判断" },
  { id:"g02", cat:"Greeks", q:"Theta（Θ）とは？", c:"時間が1日経つごとにオプション価値が減る金額。売り手の収入源", a:"時間の経過がプット売り手に有利。毎日自動的に含み益が積み上がる。DTE 30〜45日がTheta効率の最良帯。満期に近づくほど1日あたりの減少が加速する。", ex:"Theta 0.05＝1日で$5の価値が自動的に減少（売り手の利益）" },
  { id:"g03", cat:"Greeks", q:"Gamma（Γ）とは？", c:"Deltaの変化率。満期が近いほど急増し、小さな価格変動で大きな損失が起きる", a:"DTE 21日以内で急激に増大。株価が少し動くだけでDeltaが激変する。21日ルールの根拠。DTE 5日以内はギャンブルと同じリスク。", ex:"DTE 5日：株価1%下落→Deltaが0.3→0.7に急変" },
  { id:"g04", cat:"Greeks", q:"Vega（V）とは？", c:"IVが1%上昇した時のオプション価格の変化。IV上昇はプット売り手に不利", a:"VIX急騰→IV上昇→Vega効果でポジション評価損が急拡大。プット売りはVegaがマイナス（IV上昇が不利）。これが暴落時に「待てば戻る」が危険な理由。", ex:"VIX 17→33に急騰→評価損が想定の2〜3倍に膨らむ" },
  { id:"g05", cat:"Greeks", q:"4つのGreeksの覚え方は？", c:"Delta＝方向、Gamma＝加速度、Theta＝時間、Vega＝変動率への感応度", a:"車の運転で例えると：Deltaはハンドルの向き、Gammaはハンドルの重さ（速度によって変わる）、ThetaはGSのガソリン消費、VegaはエンジンパワーのIV依存度。", ex:"満期近づく＝ガソリン消費が急増（Theta加速）かつハンドルが重くなる（Gamma増大）" },
  // ── 価格と価値 ──
  { id:"p01", cat:"価格", q:"オプション価格は何で構成されているか？", c:"本質的価値（Intrinsic Value）＋時間的価値（Time Value）", a:"ITMオプション＝本質的価値あり。OTMオプション＝本質的価値ゼロ、全て時間的価値。プット売りはOTMで入るため全て時間的価値を売っている。Thetaで毎日これが減っていく。", ex:"$185P（株価$191）：本質的価値$0＋時間的価値$1.50＝$1.50" },
  { id:"p02", cat:"価格", q:"IV（インプライドボラティリティ）とは？", c:"市場が予測する将来の価格変動の大きさ。高いほどプレミアムが厚くなる", a:"オプション価格から逆算して求める「市場の期待変動率」。同じ株価でもIVが高いとオプションが高くなる。VIXはS&P500全体のIVを指数化したもの。", ex:"XLK IV 20%→30%に上昇：プレミアムが約50%増加" },
  { id:"p03", cat:"価格", q:"VRP（ボラティリティリスクプレミアム）とは？", c:"IVが実際の価格変動（実現ボラ）を平均的に上回り続ける構造的差額", a:"市場参加者は将来の不確実性に対して保険料を過大に払う傾向がある。プット売りはこの「過大な保険料」を構造的に収穫する戦略。エッジは予測ではなくこの構造から来る。", ex:"過去データ：IV平均20%、実現ボラ平均15%→差5%が毎サイクル収穫できる理論値" },
  { id:"p04", cat:"価格", q:"IV Rankとは何か？なぜ重要か？", c:"過去52週のIVの中で今が何%の高さか。プレミアムの割高・割安を示す相対指標", a:"絶対値ではなく相対値で判断する。IV Rank 10%＝過去1年でほぼ最安値水準＝プレミアムが薄すぎる。50%超＝平均より高い水準＝売る価値がある。20%未満はGate3で弾く。", ex:"現在IV Rank 10.5%→Gate3で弾かれる（今日の状況）" },
  // ── リスク管理 ──
  { id:"r01", cat:"リスク", q:"プット売りの最大リスクは何か？", c:"株価がゼロになるまで損失が拡大する理論的無限大のリスク（CSPの場合）", a:"CSPは最大損失＝ストライク×100－受取プレミアム。PCSは幅×100－受取プレミアムで損失が確定する。だからPCSの方がリスク管理しやすい。", ex:"CSP $175P：最大損失＝$17,500－$150＝$17,350（株価ゼロの場合）" },
  { id:"r02", cat:"リスク", q:"定義リスクとは何か？", c:"最大損失が事前に確定しているオプション戦略。PCSがこれに当たる", a:"PCSは損失の上限が決まっている。どれだけ株価が下がっても（幅×100）－受取プレミアム以上は失わない。CSPは定義されていない（無制限）。精神的にも管理しやすい。", ex:"$185/$180 PCS：最大損失は$350で確定（$191→$0でも$350以上は失わない）" },
  { id:"r03", cat:"リスク", q:"期待値（EV）とは何か？なぜ重要か？", c:"結果×確率の合計。長期で繰り返した時の平均的な成果を示す指標", a:"1回の勝ち負けより、何百回も繰り返した時にトータルでプラスかどうかが重要。VRPが存在する限りプット売りのEVはプラスだが、1回の暴落で破産するとEVを収穫できない。生存が最優先。", ex:"EV+5%でも破産確率10%ある戦略は長期では機能しない" },
  { id:"r04", cat:"リスク", q:"ルイン（破産）リスクとは何か？", c:"レバレッジや集中投資により1回の損失で回復不可能になるリスク", a:"期待値がプラスでもルイン確率が高い戦略は長期で必ず失敗する。これが「証拠金不足ロスカット絶対回避」「現金比率30〜50%維持」のルールの根拠。生存が全ての前提条件。", ex:"2018年Volmageddon：短期ボラETF戦略→EVプラスだったが1日で全滅" },
  // ── 戦略 ──
  { id:"s01", cat:"戦略", q:"Wheel戦略の本質的なエッジは何か？", c:"VRPの収穫＋本当に保有したい銘柄へのコストベース低下", a:"プット売りでプレミアムを受け取り続け、割当を受けても嫌でない銘柄を選ぶ。CCでさらにプレミアムを積み上げコストベースを下げる。VRPを複利的に収穫する長期戦略。", ex:"$175で割当→CCで毎月$150受取→実質コストは下がり続ける" },
  { id:"s02", cat:"戦略", q:"ロール（Roll）は何のためにするか？", c:"期限を延長してポジションを継続し、追加プレミアムを受け取るため", a:"ロールの絶対条件＝ネットクレジット（追加でプレミアムが受け取れる状態）。ネットデビットのロールは損失を先送りしているだけで意味がない。損失を確定させた方がよい場合が多い。", ex:"6月PCS（評価損30%）→ネットクレジットで7月にロール→損失を圧縮しながら継続" },
  { id:"s03", cat:"戦略", q:"50%利確はなぜ合理的か？", c:"残り50%を取るリスクと時間より、早期クローズして次を建てる方が年間リターンが高いから", a:"残り$0.75を取るために$1.50受け取り後もリスクを取り続けるより、クローズして新しいポジションを建てた方が同じ期間に2サイクル回せる。回転数×1サイクル利益が年間リターンを決める。", ex:"$1.50→$0.75で利確（50%）→即日新規PCS→年間6〜8サイクルが現実的" },
  { id:"s04", cat:"戦略", q:"暴落時になぜプット売り手は有利になれるのか？", c:"IV急騰でプレミアムが厚くなり、現金を持っていれば安値で参入できるから", a:"平常時：IV低くプレミアム薄い。暴落時：IV急騰でプレミアムが3〜5倍になる。現金を持っていれば①安くなった株を拾う②超高IVのCSPで超厚プレミアムを受け取る、のどちらでも有利。レバ組は強制退場させられてこの機会を逃す。", ex:"2020年3月：VIX 80超→CSPプレミアムが平常の5倍→持ちこたえた人が最大の収穫" },
  // ── 市場認識 ──
  { id:"m01", cat:"市場", q:"VIXと個別株IVの関係は？", c:"正の相関があるが完全ではない。個別イベントでVIX低くても個別IVが上がることがある", a:"VIX＝市場全体。個別ETFのIVはVIXと連動するが、決算・セクターニュース・FANGの大きな動きで個別IVだけ上昇することがある。IV Rankはその銘柄固有の52週比較なので個別IVを正確に見られる。", ex:"NVDA決算前：VIX 15でもXLK IV Rank 45%になることがある" },
  { id:"m02", cat:"市場", q:"レジームとは何か？なぜ重要か？", c:"相場の「状態」。同じ戦略でもレジームによって期待値が大きく変わる", a:"bullish_calm（買い場）、overheated（過熱）、bearish（下落）、crash（暴落）で戦略を変える。全レジームで同じ戦略を使い続けると負ける。Gateシステムはレジーム判定の自動化。", ex:"bearishレジームでプット売り→落ちるナイフを掴む＝必敗パターン" },
  { id:"m03", cat:"市場", q:"TA（テクニカル分析）のエッジは本当にあるか？", c:"単純なTAに再現可能なエッジはほぼない。ただし「やってはいけない局面」の回避には有効", a:"RSI・移動平均・ストキャスで将来を予測することは難しい。ただし「MA25割れ＝下降トレンド」「ストキャス過熱＝タイミングが悪い」のような危険回避には使える。エッジの源泉はVRP、TAはリスクフィルター。", ex:"MA25割れでプット売り停止→落ちるナイフを避けるのがTAの正しい使い方" },
];

const CATS = ["全て","基礎","Greeks","価格","リスク","戦略","市場"];
const CAT_CLR = {"全て":"#6366f1","基礎":"#3B82F6","Greeks":"#8B5CF6","価格":"#EC4899","リスク":"#EF4444","戦略":"#10B981","市場":"#F59E0B"};
const STORE = "koba_drill_v4";
const todayStr = () => new Date().toISOString().slice(0,10);

function shuffle(arr){ return [...arr].sort(()=>Math.random()-.5); }
function makeChoices(pool, card){
  const same = shuffle(pool.filter(c=>c.id!==card.id&&c.cat===card.cat));
  const other = shuffle(pool.filter(c=>c.id!==card.id&&c.cat!==card.cat));
  return shuffle([...same,...other].slice(0,3).concat(card));
}

const S=`
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{height:100%;font-family:'DM Sans',sans-serif;background:#0e0e0f;color:#ece9e1}
.app{max-width:420px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;padding-bottom:env(safe-area-inset-bottom,24px)}
.hd{padding:16px 18px 10px;display:flex;align-items:center;justify-content:space-between}
.brand{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.22em;color:#444;text-transform:uppercase}
.streak{font-family:'DM Mono',monospace;font-size:12px;color:#555}
.streak b{color:#F59E0B}
.cats{display:flex;gap:6px;padding:0 16px 10px;overflow-x:auto;scrollbar-width:none}
.cats::-webkit-scrollbar{display:none}
.cat{flex-shrink:0;padding:5px 13px;border-radius:20px;font-size:12px;font-weight:500;border:1.5px solid #1e1e1e;background:none;color:#555;cursor:pointer;transition:.15s}
.cat.on{border-color:var(--cc);color:var(--cc);background:color-mix(in srgb,var(--cc) 12%,transparent)}
.prog-wrap{padding:0 18px 14px}
.prog-row{display:flex;justify-content:space-between;font-family:'DM Mono',monospace;font-size:10px;color:#444;margin-bottom:5px}
.prog{height:2px;background:#1a1a1a;border-radius:1px}
.prog-in{height:100%;border-radius:1px;transition:width .3s}
.body{flex:1;padding:0 18px;display:flex;flex-direction:column}
.q-meta{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.q-cat{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase}
.q-num{font-family:'DM Mono',monospace;font-size:10px;color:#333}
.retry-badge{font-family:'DM Mono',monospace;font-size:10px;background:#2a1010;border:1px solid #4a1e1e;color:#ef4444;padding:2px 8px;border-radius:10px}
.q-text{font-size:17px;font-weight:600;line-height:1.5;color:#ece9e1;margin-bottom:20px;flex:1;min-height:80px}
.choices{display:flex;flex-direction:column;gap:9px;margin-bottom:10px}
.ch{width:100%;padding:14px 16px;border-radius:14px;background:#161618;border:1.5px solid #222;color:#9a9690;font-size:13px;font-weight:500;line-height:1.5;cursor:pointer;text-align:left;font-family:'DM Sans',sans-serif;transition:border-color .12s,background .12s;min-height:50px}
.ch:hover:not(:disabled){border-color:#333;color:#ccc}
.ch:disabled{cursor:default}
.ch.ok{background:#0d1f14;border-color:#10B981;color:#4ade80}
.ch.ng{background:#1f0e0e;border-color:#ef4444;color:#f87171}
.ch.dim{opacity:.28}
.explain{background:#161618;border:1px solid #222;border-radius:14px;padding:14px 16px;margin-bottom:10px;animation:fi .18s ease}
@keyframes fi{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.ex-l{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:6px}
.ex-l.ok{color:#10B981}.ex-l.ng{color:#ef4444}
.ex-body{font-size:12px;color:#7a7670;line-height:1.75}
.ex-eg{font-family:'DM Mono',monospace;font-size:11px;color:#4B6A8F;margin-top:7px;line-height:1.6}
.next-btn{width:100%;padding:14px;border-radius:14px;background:#10B981;border:none;color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;margin-top:auto}
.done{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 20px;text-align:center}
.done-icon{font-size:48px;margin-bottom:14px}
.done-title{font-size:20px;font-weight:600;margin-bottom:5px}
.done-sub{font-size:13px;color:#555;line-height:1.7;margin-bottom:24px}
.done-grid{display:flex;gap:20px;margin-bottom:26px}
.ds{text-align:center}
.ds-n{font-family:'DM Mono',monospace;font-size:26px;font-weight:500}
.ds-l{font-size:11px;color:#555;margin-top:3px}
.re-btn{padding:13px 0;border-radius:14px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;width:100%;margin-bottom:8px;border:none}
.re-g{background:#10B981;color:#fff}
.re-s{background:#161618;border:1.5px solid #242426 !important;color:#666}
.rest{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 20px;text-align:center}
.rest-icon{font-size:52px;margin-bottom:16px}
.rest-title{font-size:20px;font-weight:600;margin-bottom:6px}
.rest-sub{font-size:13px;color:#555;line-height:1.75;margin-bottom:22px}
.rest-stats{background:#161618;border:1px solid #1e1e1e;border-radius:14px;padding:16px;width:100%;margin-bottom:22px}
.rs-row{display:flex;justify-content:space-between;font-size:12px;padding:5px 0;border-bottom:1px solid #1a1a1a}
.rs-row:last-child{border-bottom:none}
.rs-label{color:#555}
.rs-val{font-family:'DM Mono',monospace;color:#ece9e1}
.start-btn{width:100%;padding:14px;border-radius:14px;background:#3B82F6;border:none;color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif}
`;

export default function Drill(){
  const [cat,setCat]=useState("全て");
  const [prog,setProg]=useState(()=>{
    try{const r=localStorage.getItem(STORE);return r?JSON.parse(r):{}}catch{return{}}
  });
  const [session,setSession]=useState(null); // {deck,idx,wrong,correct}
  const [selected,setSelected]=useState(null);
  const [view,setView]=useState("home"); // home|quiz|done

  const saveP=(p)=>{setProg(p);try{localStorage.setItem(STORE,JSON.stringify(p))}catch{}};

  // カードプール
  const pool = useMemo(()=>
    cat==="全て"?CARDS:CARDS.filter(c=>c.cat===cat)
  ,[cat]);

  // 今日の出題リスト: 未出題 + 昨日以前に間違えたもの
  const todayDeck = useMemo(()=>{
    const today=todayStr();
    return shuffle(pool.filter(c=>{
      const p=prog[c.id];
      if(!p) return true; // 未出題
      if(p.mastered) return false; // マスター済みはスキップ
      if(p.wrongDate && p.wrongDate!==today) return true; // 昨日以前に間違えた
      return false;
    }));
  },[pool,prog]);

  const wrongToday = useMemo(()=>{
    const today=todayStr();
    return pool.filter(c=>prog[c.id]?.wrongDate===today);
  },[pool,prog]);

  const mastered = useMemo(()=>pool.filter(c=>prog[c.id]?.mastered).length,[pool,prog]);

  // ストリーク計算
  const streak = useMemo(()=>{
    const days=new Set(Object.values(prog).map(p=>p.lastSeen).filter(Boolean));
    let s=0;const d=new Date();
    for(;;){
      const k=d.toISOString().slice(0,10);
      if(days.has(k)){s++;d.setDate(d.getDate()-1);}
      else if(s===0&&k===todayStr()){d.setDate(d.getDate()-1);}
      else break;
    }
    return s;
  },[prog]);

  function startSession(){
    if(todayDeck.length===0) return;
    setSession({deck:todayDeck,idx:0,wrong:[],correct:0});
    setSelected(null);
    setView("quiz");
  }

  const card = session?.deck[session.idx];
  const choices = useMemo(()=>card?makeChoices(pool,card):[],[session?.idx,pool]);
  const isCorrect = selected && selected.c===card?.c;

  function select(ch){
    if(selected) return;
    setSelected(ch);
    const today=todayStr();
    const wasCorrect=ch.c===card.c;
    const newP={...prog};
    if(wasCorrect){
      newP[card.id]={...newP[card.id],lastSeen:today,wrongDate:null,mastered:true};
      setSession(s=>({...s,correct:s.correct+1}));
    }else{
      newP[card.id]={...newP[card.id],lastSeen:today,wrongDate:today,mastered:false};
      setSession(s=>({...s,wrong:[...s.wrong,card]}));
    }
    saveP(newP);
  }

  function next(){
    const nextIdx=session.idx+1;
    if(nextIdx>=session.deck.length){
      // 間違えたカードを末尾に追加してもう一周
      if(session.wrong.length>0){
        setSession(s=>({...s,deck:[...s.deck,...shuffle(s.wrong)],wrong:[],idx:nextIdx}));
      }else{
        setView("done");
      }
      setSelected(null);
      return;
    }
    setSelected(null);
    setSession(s=>({...s,idx:nextIdx}));
  }

  function reset(){
    const newP={};saveP(newP);
    setSession(null);setView("home");
  }

  const cc=CAT_CLR[cat];

  if(view==="done") return(
    <>
      <style>{S}</style>
      <div className="app">
        <div className="hd"><span className="brand">Options Drill</span></div>
        <div className="done">
          <div className="done-icon">
            {session.correct===session.deck.length?"🎯":session.correct/session.deck.length>=.7?"💪":"📚"}
          </div>
          <div className="done-title">今日の分、完了！</div>
          <div className="done-sub">
            間違えたカードは明日また出ます。<br/>毎日続けることで定着します。
          </div>
          <div className="done-grid">
            <div className="ds"><div className="ds-n" style={{color:"#10B981"}}>{session.correct}</div><div className="ds-l">正解</div></div>
            <div className="ds"><div className="ds-n" style={{color:"#ef4444"}}>{session.deck.length-session.correct}</div><div className="ds-l">間違い</div></div>
            <div className="ds"><div className="ds-n" style={{color:"#F59E0B"}}>{streak+1}</div><div className="ds-l">連続日数</div></div>
          </div>
          <button className="re-btn re-g" onClick={()=>{setView("home");setSession(null);}}>ホームへ戻る</button>
          <button className="re-btn re-s" onClick={reset} style={{border:"1.5px solid #242426"}}>進捗をリセット</button>
        </div>
      </div>
    </>
  );

  if(view==="quiz"&&card) return(
    <>
      <style>{S}</style>
      <div className="app">
        <div className="hd">
          <span className="brand">Options Drill</span>
          <span className="streak">🔥 <b>{streak||1}</b>日連続</span>
        </div>
        <div className="prog-wrap">
          <div className="prog-row">
            <span>{session.idx+1} / {session.deck.length}問</span>
            <span style={{color:"#10B981"}}>{session.correct} 正解</span>
          </div>
          <div className="prog"><div className="prog-in" style={{width:(session.idx/session.deck.length*100)+"%",background:"#10B981"}}/></div>
        </div>
        <div className="body">
          <div className="q-meta">
            <span className="q-cat" style={{color:CAT_CLR[card.cat]}}>{card.cat}</span>
            {prog[card.id]?.wrongDate&&<span className="retry-badge">復習</span>}
          </div>
          <div className="q-text">{card.q}</div>
          <div className="choices">
            {choices.map((ch,i)=>{
              const isThis=ch.c===card.c;
              const isWrong=selected&&selected.c===ch.c&&!isThis;
              const isDim=selected&&!isThis&&selected.c!==ch.c;
              return(
                <button key={i}
                  className={`ch${isThis&&selected?" ok":""}${isWrong?" ng":""}${isDim?" dim":""}`}
                  onClick={()=>select(ch)} disabled={!!selected}>
                  {ch.c}
                </button>
              );
            })}
          </div>
          {selected&&(
            <div className="explain">
              <div className={`ex-l ${isCorrect?"ok":"ng"}`}>
                {isCorrect?"✓ 正解":"✗ 不正解 — 正しくはこう"}
              </div>
              <div className="ex-body">{card.a}</div>
              {card.ex&&<div className="ex-eg">例 → {card.ex}</div>}
            </div>
          )}
          {selected&&(
            <button className="next-btn" onClick={next}>
              {session.idx+1>=session.deck.length&&session.wrong.length===0?"結果を見る":"次へ →"}
            </button>
          )}
        </div>
      </div>
    </>
  );

  // ホーム画面
  return(
    <>
      <style>{S}</style>
      <div className="app">
        <div className="hd">
          <span className="brand">Options Drill</span>
          <span className="streak">🔥 <b>{streak}</b>日連続</span>
        </div>
        <div className="cats">
          {CATS.map(c=>(
            <button key={c} className={`cat${cat===c?" on":""}`}
              style={{"--cc":CAT_CLR[c]}} onClick={()=>setCat(c)}>{c}</button>
          ))}
        </div>

        {todayDeck.length===0?(
          <div className="rest">
            <div className="rest-icon">✅</div>
            <div className="rest-title">今日の分は終わり！</div>
            <div className="rest-sub">
              間違えたカードは明日また出ます。<br/>
              明日また開いてください。
            </div>
            <div className="rest-stats">
              <div className="rs-row"><span className="rs-label">マスター済み</span><span className="rs-val">{mastered} / {pool.length}枚</span></div>
              <div className="rs-row"><span className="rs-label">今日の復習待ち</span><span className="rs-val">{wrongToday.length}枚（明日出ます）</span></div>
              <div className="rs-row"><span className="rs-label">連続記録</span><span className="rs-val">{streak}日</span></div>
            </div>
            <button className="start-btn" onClick={reset}>進捗をリセットして最初から</button>
          </div>
        ):(
          <div className="rest">
            <div className="rest-icon">{todayDeck.length<=5?"📝":"📚"}</div>
            <div className="rest-title">今日の問題</div>
            <div className="rest-sub">
              {wrongToday.length>0
                ?`昨日間違えた${wrongToday.length}枚＋新規${todayDeck.length-wrongToday.length}枚`
                :`新しいカード${todayDeck.length}枚が出ます`}
            </div>
            <div className="rest-stats">
              <div className="rs-row"><span className="rs-label">今日の問題数</span><span className="rs-val" style={{color:"#3B82F6"}}>{todayDeck.length}枚</span></div>
              <div className="rs-row"><span className="rs-label">マスター済み</span><span className="rs-val">{mastered} / {pool.length}枚</span></div>
              <div className="rs-row"><span className="rs-label">連続記録</span><span className="rs-val">{streak}日</span></div>
            </div>
            <button className="start-btn" onClick={startSession}>
              スタート →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
