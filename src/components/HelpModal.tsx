import React, { useEffect, useRef, useState } from 'react';
import { X, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplySample: (code: string) => void;
}

const SAMPLES = [
  {
    label: 'FizzBuzz（判断分岐）',
    code: `# 矢羽: 合流時だけ
# 文字サイズ: 14
# 横間隔: 220
# 縦間隔: 120

start: term 開始
loop: loop_s FizzBuzz処理\\ni = 1 から 100
mod15: dec 15の倍数？
dispFB: disp "FizzBuzz"
mod3: dec 3の倍数？
dispF: disp "Fizz"
mod5: dec 5の倍数？
dispB: disp "Buzz"
dispNum: disp i
loopEnd: loop_e FizzBuzz処理
end: term 終了

start -> loop -> mod15 -> dispFB (Yes) -> loopEnd -> end
mod15 -> mod3 (No) -> dispF (Yes) -> loopEnd
mod3 -> mod5 (No) -> dispB (Yes) -> loopEnd
mod5 -> dispNum (No) -> loopEnd`,
  },
  {
    label: 'ログイン処理（シンプル）',
    code: `# 矢羽: 合流時だけ
# 文字サイズ: 13

start: term 開始
input: io ユーザー名・パスワード入力
auth: dec 認証成功？
dashboard: proc ダッシュボード表示
error: disp エラーメッセージ表示
retry: dec 再試行する？
end: term 終了

start -> input -> auth -> dashboard (Yes) -> end
auth -> error (No) -> retry -> input (Yes)
retry -> end (No)`,
  },
  {
    label: '配列の線形探索',
    code: `# 矢羽: 合流時だけ
# 文字サイズ: 13
# 縦間隔: 130

start: term 開始
init: proc i = 0 に初期化
loop: loop_s 配列探索ループ
check: dec i < 配列長？
found: dec arr[i] == 目標値？
returnIdx: io インデックス i を返す
inc: proc i = i + 1
loopEnd: loop_e 配列探索ループ
notFound: io -1 を返す
end: term 終了

start -> init -> loop -> check -> found (Yes) -> returnIdx (Yes) -> end
found -> inc (No) -> loopEnd -> check
check -> notFound (No) -> end`,
  },
];

const NODE_TYPES = [
  { keyword: 'term / start / end', label: '端子', desc: 'フローの開始・終了', shape: 'rounded' },
  { keyword: 'proc / process', label: '処理', desc: '演算・代入など一般的な処理', shape: 'rect' },
  { keyword: 'dec / decision', label: '判断', desc: '条件分岐（ひし形）', shape: 'diamond' },
  { keyword: 'io / output', label: '入出力', desc: 'データの入力・出力', shape: 'parallelogram' },
  { keyword: 'manual / input', label: '手操作入力', desc: 'キーボードなど人手による入力', shape: 'manual' },
  { keyword: 'disp / display', label: '表示', desc: '画面への表示', shape: 'display' },
  { keyword: 'loop_s', label: '繰り返し開始', desc: 'ループの始まり（テキスト付き）', shape: 'loop_s' },
  { keyword: 'loop_e', label: '繰り返し終了', desc: 'ループの終わり（同じテキスト）', shape: 'loop_e' },
  { keyword: 'prep / preparation', label: '準備', desc: '変数宣言・初期化など', shape: 'prep' },
];

function ShapeIcon({ shape }: { shape: string }) {
  const common = { fill: 'white', stroke: '#1e293b', strokeWidth: '1.5' };
  const w = 52, h = 28;
  switch (shape) {
    case 'rounded':
      return <rect width={w} height={h} rx={h / 2} ry={h / 2} {...common} />;
    case 'rect':
      return <rect width={w} height={h} {...common} />;
    case 'diamond':
      return <path d={`M ${w/2} 0 L ${w} ${h/2} L ${w/2} ${h} L 0 ${h/2} Z`} {...common} />;
    case 'parallelogram':
      return <path d={`M 8 0 L ${w} 0 L ${w-8} ${h} L 0 ${h} Z`} {...common} />;
    case 'manual':
      return <path d={`M 0 6 L ${w} 0 L ${w} ${h} L 0 ${h} Z`} {...common} />;
    case 'display':
      return <path d={`M 8 0 L ${w-8} 0 Q ${w} ${h/2} ${w-8} ${h} L 8 ${h} L 0 ${h/2} Z`} {...common} />;
    case 'loop_s':
      return <path d={`M 10 0 L ${w-10} 0 L ${w} ${h*0.4} L ${w} ${h} L 0 ${h} L 0 ${h*0.4} Z`} {...common} />;
    case 'loop_e':
      return <path d={`M 0 0 L ${w} 0 L ${w} ${h*0.6} L ${w-10} ${h} L 10 ${h} L 0 ${h*0.6} Z`} {...common} />;
    case 'prep':
      return <path d={`M 8 0 L ${w-8} 0 L ${w} ${h/2} L ${w-8} ${h} L 8 ${h} L 0 ${h/2} Z`} {...common} />;
    default:
      return <rect width={w} height={h} {...common} />;
  }
}

function CodeBlock({ code, onCopy, copied }: { code: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="relative group">
      <pre className="bg-slate-800 text-slate-200 rounded-lg p-3 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </pre>
      <button
        onClick={onCopy}
        className="absolute top-2 right-2 p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="コードをコピー"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </div>
  );
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        {open ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronRight size={15} className="text-slate-400" />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

export const HelpModal: React.FC<Props> = ({ isOpen, onClose, onApplySample }) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = (code: string, idx: number) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white rounded-t-2xl shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800">使い方ガイド</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">テキストDSLでフローチャートを記述します</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            title="閉じる (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Overview */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 leading-relaxed">
            <p className="font-semibold mb-1">基本の流れ</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li>左のエディタにノード定義を書く（1行1ノード）</li>
              <li>矢印 <code className="bg-blue-100 px-1 rounded font-mono">-{'>'}</code> でノードをつなぐ</li>
              <li>右のプレビューがリアルタイムで更新される</li>
            </ol>
          </div>

          {/* Node definition */}
          <Section title="ノードの書き方">
            <div className="space-y-3 text-sm">
              <p className="text-slate-600">
                <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">ID: タイプ テキスト</code>
                <span className="ml-2 text-slate-500">※ IDは英数字とハイフンのみ</span>
              </p>
              <CodeBlock
                code={`start: term 開始
check: dec 条件を満たす？
output: disp 結果を表示
end: term 終了

# スタイルも指定できる（任意）
warn: proc 警告処理 | bg:#fef9c3 color:#854d0e`}
                onCopy={() => handleCopy(`start: term 開始\ncheck: dec 条件を満たす？\noutput: disp 結果を表示\nend: term 終了`, 10)}
                copied={copiedIdx === 10}
              />
            </div>
          </Section>

          {/* Connections */}
          <Section title="接続の書き方">
            <div className="space-y-3 text-sm">
              <p className="text-slate-600">
                <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">A -{'>'} B</code>
                &nbsp;または連続で
                <code className="bg-slate-100 ml-1 px-1.5 py-0.5 rounded font-mono text-slate-800">A -{'>'} B -{'>'} C</code>
              </p>
              <p className="text-slate-600">
                ラベル付き:&nbsp;
                <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">A -{'>'} B (Yes)</code>
              </p>
              <CodeBlock
                code={`start -> check -> ok (Yes) -> end
check -> error (No) -> end`}
                onCopy={() => handleCopy(`start -> check -> ok (Yes) -> end\ncheck -> error (No) -> end`, 11)}
                copied={copiedIdx === 11}
              />
              <p className="text-xs text-slate-400">
                ヒント: <code className="font-mono">Yes / はい / No / いいえ</code> はメインフロー・分岐の自動整列に使われます
              </p>
            </div>
          </Section>

          {/* Node types */}
          <Section title="ノードタイプ一覧">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {NODE_TYPES.map(nt => (
                <div key={nt.keyword} className="flex items-center gap-3 p-2 rounded-lg border border-slate-100 hover:bg-slate-50">
                  <svg width={54} height={30} viewBox="0 0 54 30" className="shrink-0">
                    <g transform="translate(1, 1)">
                      <ShapeIcon shape={nt.shape} />
                    </g>
                  </svg>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700">{nt.label}</p>
                    <p className="text-[10px] font-mono text-slate-400 truncate">{nt.keyword}</p>
                    <p className="text-[10px] text-slate-500">{nt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Config options */}
          <Section title="設定オプション（先頭行に記述）" defaultOpen={false}>
            <div className="space-y-2 text-sm">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-100">
                    <th className="pb-2 font-semibold">設定</th>
                    <th className="pb-2 font-semibold">値の例</th>
                    <th className="pb-2 font-semibold">説明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[
                    ['# 矢羽: 合流時だけ', '合流時だけ / 表示する / しない', '矢印の表示設定'],
                    ['# 文字サイズ: 14', '数値（基本: 11）', 'ノード内のフォントサイズ'],
                    ['# 横間隔: 220', '数値（基本: 220）', '列間の距離（px）'],
                    ['# 縦間隔: 120', '数値（基本: 120）', '行間の距離（px）'],
                  ].map(([key, val, desc]) => (
                    <tr key={key} className="hover:bg-slate-50">
                      <td className="py-1.5 pr-2 font-mono text-slate-700">{key}</td>
                      <td className="py-1.5 pr-2 text-slate-500">{val}</td>
                      <td className="py-1.5 text-slate-500">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[11px] text-slate-400 mt-2">
                ※ 設定行はコメント（#）でも、コメントなしでも認識されます
              </p>
            </div>
          </Section>

          {/* Sample code */}
          <Section title="サンプルコード" defaultOpen={false}>
            <div className="space-y-4">
              {SAMPLES.map((s, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">{s.label}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(s.code, i)}
                        className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 rounded-md transition-colors"
                      >
                        {copiedIdx === i ? <Check size={11} /> : <Copy size={11} />}
                        コピー
                      </button>
                      <button
                        onClick={() => { onApplySample(s.code); onClose(); }}
                        className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                      >
                        エディタに適用
                      </button>
                    </div>
                  </div>
                  <CodeBlock
                    code={s.code}
                    onCopy={() => handleCopy(s.code, i)}
                    copied={copiedIdx === i}
                  />
                </div>
              ))}
            </div>
          </Section>

          {/* Keyboard shortcuts */}
          <div className="bg-slate-50 rounded-lg p-4 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-600 mb-2">キーボードショートカット</p>
            <div className="grid grid-cols-2 gap-1">
              <span><kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono">F1</kbd> このヘルプを開く</span>
              <span><kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono">Esc</kbd> モーダルを閉じる</span>
              <span><kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono">Ctrl</kbd>+スクロール プレビューをズーム</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
