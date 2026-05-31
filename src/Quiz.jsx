import { useState } from "react";

const CASES = [
  {
    id: 1,
    title: "強気・好条件",
    difficulty: "基礎",
    data: { ma25:"上", rsi:58, vix:16.2, ivr:34, stoch:28, price:187.50 },
    questions: [
      "Gate 1〜4は全て通過するか？どのGateが問題になるか",
      "今日エントリーするか？するなら何の戦略を使うか",
      "ストキャスの数値をどう解釈するか"
    ],
    verdict:"エントリー可（最良タイミング）",
    vcolor:"#10B981",
    answer:`Gate 1: MA25の上 ✓ 上昇トレンド継続
Gate 2: VIX 16.2 < 20 ✓ 通常モード
Gate 3: IV Rank 34% > 20% ✓ プレミアム適正
Gate 4: ストキャス 28 < 30 ✓ 最良タイミング

→ 全Gate通過。ストキャス28は「売られすぎゾーン」で底打ちのサイン。4つ全て揃う状況は頻繁には来ない。PCSで積極的にエントリーする。

推奨: XLK Put Credit Spread / デルタ 0.20〜0.30 / DTE 35〜45日 / 2〜3枚`
  },
  {
    id: 2,
    title: "過熱＋IV低い（現在の状況）",
    difficulty: "基礎",
    data: { ma25:"上", rsi:72.3, vix:15.32, ivr:10.5, stoch:92, price:191.02 },
    questions: [
      "どのGateで弾かれるか（複数ある）",
      "今日エントリーするか",
      "次にいつ再チェックするか、何を見るか"
    ],
    verdict:"見送り（2つのGateで弾かれる）",
    vcolor:"#EF4444",
    answer:`Gate 1: MA25の上 ✓
Gate 2: VIX 15.32 ✓
Gate 3: IV Rank 10.5% < 20% ✗ → ここで弾かれる
Gate 4: ストキャス 92 > 70 ✗ → ここでも弾かれる

→ Gate3とGate4のW弾き。IV Rankが低い＝プレミアムが薄すぎて売る価値がない。ストキャス92＝過熱しきっている。両方が「売るな」と言っている。

今日は記録だけして待機。「IV Rankが20%を超えた日」を待つ。毎日ワークスペースで数値を確認し、20%超えた日に改めてGate4をチェック。`
  },
  {
    id: 3,
    title: "タイミング待ち",
    difficulty: "中級",
    data: { ma25:"上", rsi:61, vix:21.5, ivr:38, stoch:74, price:183.20 },
    questions: [
      "どのGateで引っかかるか",
      "今日エントリーしていいか",
      "VIX 21.5はどのモードで解釈するか"
    ],
    verdict:"あと少し待ち（Gate4で保留）",
    vcolor:"#F59E0B",
    answer:`Gate 1: MA25の上 ✓
Gate 2: VIX 21.5（20〜30）→ 縮小モード ！（通過はするが条件あり）
Gate 3: IV Rank 38% ✓ プレミアム適正
Gate 4: ストキャス 74 > 70 ✗ → 過熱、今日は入らない

→ Gate4で当日見送り。VIXが20〜30の縮小モードはエントリー可能だが、デルタを0.15〜0.20に下げて枚数を半分にする必要がある。ストキャスが80を割って下向きになったら入る。明日以降に再確認。

縮小モードでの戦略: デルタ0.15〜0.20 / 1枚のみ / DTE35日`
  },
  {
    id: 4,
    title: "下降トレンド突入",
    difficulty: "基礎",
    data: { ma25:"下", rsi:44, vix:27.8, ivr:52, stoch:22, price:178.30 },
    questions: [
      "最初に確認するGateで何が起きるか",
      "IV Rank 52%・ストキャス22という魅力的な数値があるが、それでも入れるか",
      "今やるべきことは何か"
    ],
    verdict:"新規停止（Gate1で即終了）",
    vcolor:"#EF4444",
    answer:`Gate 1: MA25の下 ✗ → 即終了。他のGateを見ない。

→ IV Rank 52%・ストキャス22という「一見おいしそう」な数値が揃っているが、MA25を割れている時点でプット売りは禁止。「MA25の下はフォールイングナイフ（落ちるナイフ）」で、そこでプット売りをすると割当を受けてさらに下がり続けるリスクがある。

今やること:
・新規エントリーなし
・既存ポジションがあれば管理（クローズまたはロール検討）
・現金比率を上げて待機
・毎日MA25との位置を確認`
  },
  {
    id: 5,
    title: "暴落モード",
    difficulty: "上級",
    data: { ma25:"下", rsi:28, vix:42.1, ivr:81, stoch:8, price:158.40 },
    questions: [
      "通常のエントリーフローではどう判断されるか",
      "ただし暴落モードとして特別な行動はあるか",
      "現金を今すぐ全額投入すべきか"
    ],
    verdict:"暴落モード（現金投入を検討）",
    vcolor:"#F59E0B",
    answer:`通常フロー: Gate1（MA25下）で新規停止。
暴落モード: VIX 42 > 35 → 通常ルールを反転させる特別局面。

→ この局面は「本命のチャンス」。IV Rank 81%＝プレミアムが歴史的に厚い。ここで現金を段階的に投入する。

ただし「今すぐ全額投入」は絶対NG。理由:
・まだ底値かどうかわからない
・落ちるナイフを掴むリスク
・3〜5分割で段階的に入る

具体的行動:
①ストキャスが20を下回ってから底打ちを待つ（8は底圏だが確認が必要）
②現金の1/3でXLK直買いまたは高IVのCSP
③1〜2週後に再度判断して追加投入`
  },
  {
    id: 6,
    title: "ポジション管理: 50%利確",
    difficulty: "中級",
    data: { ma25:"上", rsi:55, vix:17.4, ivr:28, stoch:45, price:185.20 },
    questions: [
      "PCSを建てた時: $1.60受取。現在のオプション価値は$0.74。どうする？",
      "なぜ残り50%を取ろうとしないのか",
      "クローズ後に何をするか"
    ],
    verdict:"即クローズ（50%利確ルール発動）",
    vcolor:"#10B981",
    answer:`受取$1.60 → 50% = $0.80。
現在価値$0.74 < $0.80 → 利確条件達成。即クローズ。

なぜ残り50%を取らないか:
・残り50%を取るには時間がかかる（Thetaがゆっくり減衰）
・その間にも価格変動リスクがあり続ける
・早めにクローズ→すぐ次を建てる方が年間の回転数が増えてトータルリターンが高い
・リスクを取っている時間を最小化するのが基本戦略

クローズ後:
1. Gate 1〜4を再確認（今日の状況）
2. 条件が揃っていれば即日で次のPCSを建てる
3. 今と同じ条件: エントリー可 → 次のポジションへ`
  },
  {
    id: 7,
    title: "ポジション管理: DTE 21日",
    difficulty: "中級",
    data: { ma25:"上", rsi:60, vix:18.1, ivr:31, stoch:52, price:184.80 },
    questions: [
      "PCSを保有中: DTE 21日、利益は受取$1.40に対し含み益$0.38（27%）。どうする？",
      "50%利確に達していないが、21日ルールを優先すべきか",
      "ロールする場合の条件は何か"
    ],
    verdict:"21日ルール発動（ロールか決済を検討）",
    vcolor:"#F59E0B",
    answer:`DTE 21日 → ガンマリスク急増ゾーンに突入。50%利確（$0.70）に達していないが、21日ルールを優先する。

判断フロー:
① ネットクレジットでロールできるか確認
   → 現在のPCSを$1.02で買戻し + 45日後の同ストライクPCSを$1.35で売れる場合
   → $0.33のネットクレジット → ロール実行OK

② ネットクレジットで組めない場合
   → 損失$0.62（$1.40 - $0.78の損失）で決済
   → 悔しいが放置よりマシ

21日ルールの理由: 残存21日以内はガンマが急増し、わずかな価格変動で評価損が跳ね上がる。「もう少し待てば戻るかも」の判断が最大の危険。`
  },
  {
    id: 8,
    title: "VIX急騰（保有中）",
    difficulty: "上級",
    data: { ma25:"上", rsi:58, vix:33.2, ivr:61, stoch:31, price:181.50 },
    questions: [
      "昨日VIX 17でPCSを建てた。今日VIX 33に急騰。どうする？",
      "まだ含み損は小さい。待てばVIXが落ち着いて戻るかも？",
      "防御アクションとは具体的に何をするか"
    ],
    verdict:"防御アクション（Gate2発動）",
    vcolor:"#EF4444",
    answer:`VIX 33 > 30 → Gate2発動。保有中でもこのルールは適用される。

「待てば戻るかも」の危険性:
・VIXが30を超えた時は相場が急変している
・VegaリスクでIV急騰→保有PCSの評価損がさらに拡大する可能性
・「もう少し待てば」で2日後にVIX 45になっていたら手遅れ

防御アクション（選択肢）:
① PCSをクローズ → 損失を確定させて現金化。次のチャンスに備える。
② サイズを半分に縮小 → 1枚残して残りをクローズ。リスクを下げつつ保有継続。
③ ヘッジを追加 → 別の方向でリスクを相殺（上級者向け）

推奨: ①のフルクローズ。「プレミアム収入より生存を優先」がこの戦略の鉄則。VIXが25以下に戻った時に改めてエントリーする。`
  },
];

const DIFF_CLR = {"基礎":"#3B82F6","中級":"#F59E0B","上級":"#EF4444"};

const S = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif;background:#0a0a0a;color:#e8e4dc;min-height:100vh}
.app{display:grid;grid-template-columns:240px 1fr;min-height:100vh;max-width:1100px;margin:0 auto}
@media(max-width:700px){.app{grid-template-columns:1fr}}
.sidebar{background:#111;border-right:1px solid #1e1e1e;padding:20px 0}
.sidebar-title{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.2em;color:#444;text-transform:uppercase;padding:0 16px 16px}
.case-item{padding:12px 16px;cursor:pointer;border-left:3px solid transparent;transition:.15s}
.case-item:hover{background:#161616}
.case-item.active{border-left-color:#10B981;background:#0f1f18}
.case-num{font-family:'DM Mono',monospace;font-size:10px;color:#444;margin-bottom:3px}
.case-title{font-size:13px;font-weight:500;color:#c8c4bc;margin-bottom:4px}
.case-diff{display:inline-block;font-family:'DM Mono',monospace;font-size:10px;padding:2px 7px;border-radius:10px}
.main{padding:28px 32px;overflow-y:auto}
@media(max-width:700px){.main{padding:16px}}
.main-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:24px}
.case-h{font-size:22px;font-weight:600;margin-bottom:4px}
.case-sub{font-size:13px;color:#555;font-family:'DM Mono',monospace}
.score-badge{font-family:'DM Mono',monospace;font-size:12px;color:#444}
.score-badge b{color:#10B981}
.data-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:24px}
.data-card{background:#141414;border:1px solid #1e1e1e;border-radius:10px;padding:14px}
.data-label{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:#444;margin-bottom:6px}
.data-val{font-family:'DM Mono',monospace;font-size:20px;font-weight:500}
.data-val.up{color:#10B981}.data-val.down{color:#EF4444}.data-val.warn{color:#F59E0B}
.data-val.ok{color:#e8e4dc}
.section{margin-bottom:22px}
.section-label{font-size:11px;font-family:'DM Mono',monospace;letter-spacing:.15em;text-transform:uppercase;color:#444;margin-bottom:12px}
.q-item{background:#141414;border:1px solid #1e1e1e;border-radius:10px;padding:14px 16px;margin-bottom:8px;font-size:14px;line-height:1.6;color:#9a9690}
.q-num{font-family:'DM Mono',monospace;font-size:10px;color:#10B981;margin-bottom:5px}
.think-btn{width:100%;padding:14px;background:#141414;border:1.5px solid #1e1e1e;border-radius:12px;color:#666;font-size:14px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:.15s;margin-bottom:14px}
.think-btn:hover{border-color:#333;color:#999}
.verdict{border-radius:12px;padding:16px 18px;margin-bottom:14px;display:flex;align-items:center;gap:12px}
.verdict-v{font-size:15px;font-weight:600}
.verdict-sub{font-size:12px;opacity:.7;margin-top:2px}
.answer-box{background:#141414;border:1px solid #1e1e1e;border-radius:12px;padding:18px;font-size:13px;line-height:1.9;color:#9a9690;white-space:pre-wrap;font-family:'DM Mono',monospace}
.grade-row{display:flex;gap:8px;margin-top:14px}
.g-btn{flex:1;padding:11px;border-radius:10px;border:1.5px solid #1e1e1e;background:none;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:.15s;color:#666}
.g-btn:hover{border-color:#333;color:#999}
.g-btn.sel-y{background:#0f1f18;border-color:#10B981;color:#10B981}
.g-btn.sel-n{background:#1f0f0f;border-color:#EF4444;color:#EF4444}
.nav-row{display:flex;justify-content:space-between;gap:10px;margin-top:20px}
.nav-btn{padding:11px 22px;border-radius:10px;border:1.5px solid #1e1e1e;background:none;color:#666;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:.15s}
.nav-btn:hover{border-color:#333;color:#ccc}
.nav-btn.next{background:#10B981;border-color:#10B981;color:#fff}
.nav-btn:disabled{opacity:.3;cursor:not-allowed}
`;

export default function ScenarioQuiz() {
  const [ci, setCi] = useState(0);
  const [revealed, setRevealed] = useState({});
  const [grades, setGrades] = useState({});
  const correct = Object.values(grades).filter(v => v === "y").length;
  const total = Object.keys(grades).length;

  const c = CASES[ci];
  const isRev = revealed[c.id];

  function vColor(v){ return v==="上" ? "#10B981" : "#EF4444"; }
  function numColor(k,v){
    if(k==="vix") return v<20?"ok":v<30?"warn":"down";
    if(k==="ivr") return v>=50?"up":v>=20?"ok":"down";
    if(k==="stoch") return v<=30?"up":v<=70?"ok":"warn";
    if(k==="rsi") return v<=70?"ok":"warn";
    return "ok";
  }

  const dataItems = [
    {k:"price", label:"XLK価格", fmt:v=>"$"+v},
    {k:"ma25", label:"MA25位置", fmt:v=>v},
    {k:"vix", label:"VIX", fmt:v=>v},
    {k:"ivr", label:"IV Rank", fmt:v=>v+"%"},
    {k:"stoch", label:"ストキャス", fmt:v=>v},
    {k:"rsi", label:"RSI", fmt:v=>v},
  ];

  return (
    <>
      <style>{S}</style>
      <div className="app">
        <div className="sidebar">
          <div className="sidebar-title">問題一覧</div>
          {CASES.map((cs,i) => (
            <div key={cs.id} className={`case-item${ci===i?" active":""}`} onClick={()=>setCi(i)}>
              <div className="case-num">Case {cs.id}</div>
              <div className="case-title">{cs.title}</div>
              <span className="case-diff" style={{background:DIFF_CLR[cs.difficulty]+'22',color:DIFF_CLR[cs.difficulty]}}>{cs.difficulty}</span>
              {grades[cs.id] && <span style={{marginLeft:6,fontSize:11,color:grades[cs.id]==="y"?"#10B981":"#EF4444"}}>{grades[cs.id]==="y"?"✓":"×"}</span>}
            </div>
          ))}
          <div style={{padding:"20px 16px 0",borderTop:"1px solid #1e1e1e",marginTop:16}}>
            <div className="score-badge">正答 <b>{correct}</b> / {total} 問</div>
          </div>
        </div>

        <div className="main">
          <div className="main-header">
            <div>
              <div className="case-h">Case {c.id}: {c.title}</div>
              <div className="case-sub">
                <span className="case-diff" style={{background:DIFF_CLR[c.difficulty]+'22',color:DIFF_CLR[c.difficulty]}}>{c.difficulty}</span>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-label">市場データ</div>
            <div className="data-grid">
              {dataItems.map(({k,label,fmt}) => (
                <div className="data-card" key={k}>
                  <div className="data-label">{label}</div>
                  <div className={`data-val ${k==="ma25"?(c.data[k]==="上"?"up":"down"):numColor(k,c.data[k])}`}>
                    {fmt(c.data[k])}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <div className="section-label">自分で考えてから答えを見る</div>
            {c.questions.map((q,i) => (
              <div className="q-item" key={i}>
                <div className="q-num">Q{i+1}</div>
                {q}
              </div>
            ))}
          </div>

          {!isRev ? (
            <button className="think-btn" onClick={()=>setRevealed(r=>({...r,[c.id]:true}))}>
              考えた → 答えを見る
            </button>
          ) : (
            <>
              <div className="verdict" style={{background:c.vcolor+'18',border:`1px solid ${c.vcolor}44`}}>
                <div>
                  <div className="verdict-v" style={{color:c.vcolor}}>{c.verdict}</div>
                </div>
              </div>
              <div className="answer-box">{c.answer}</div>

              <div className="grade-row">
                <button className={`g-btn${grades[c.id]==="y"?" sel-y":""}`} onClick={()=>setGrades(g=>({...g,[c.id]:"y"}))}>
                  ✓ 正しく判断できた
                </button>
                <button className={`g-btn${grades[c.id]==="n"?" sel-n":""}`} onClick={()=>setGrades(g=>({...g,[c.id]:"n"}))}>
                  × 判断が違った
                </button>
              </div>
            </>
          )}

          <div className="nav-row">
            <button className="nav-btn" disabled={ci===0} onClick={()=>{setCi(i=>i-1)}}>← 前へ</button>
            <button className="nav-btn next" disabled={ci===CASES.length-1} onClick={()=>{setCi(i=>i+1)}}>次へ →</button>
          </div>
        </div>
      </div>
    </>
  );
}
