import React from 'react';
import { Info } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export const Editor: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <span>エディタ</span>
        </h2>
      </div>
      
      <div className="flex-1 relative font-mono text-sm min-h-0">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-full p-4 resize-none focus:outline-none bg-transparent text-slate-800 leading-relaxed"
          placeholder="ここにマークアップを入力してください..."
          spellCheck={false}
          id="flow-editor"
        />
        <div className="absolute top-4 right-4 text-[10px] text-slate-300 pointer-events-none">
          {value.length} 文字
        </div>
      </div>

      <div className="shrink-0 p-4 bg-slate-800 text-white text-xs border-t border-slate-200 z-10 overflow-y-auto max-h-48">
        <h3 className="font-bold mb-2 flex items-center gap-1"><Info size={14} /> 使い方</h3>
        <p className="mb-2">ID: タイプ 内容 | スタイル(任意)</p>
        <p className="text-slate-400 mb-2">例: <code className="text-slate-300 bg-slate-700 px-1 rounded">start: term 開始 | bg:#f00 color:white</code></p>
        <p className="mb-2">ID -{'>'} ターゲット (ラベル)</p>
        <p className="text-slate-400">例: <code className="text-slate-300 bg-slate-700 px-1 rounded">start -{'>'} next (はい)</code></p>
        <div className="mt-2 pt-2 border-t border-slate-700">
          <p className="font-bold mb-1">その他の設定:</p>
          <ul className="list-disc list-inside text-slate-300 space-y-1 mb-2">
            <li><code className="text-slate-400 bg-slate-700 px-1 rounded"># 矢羽: 表示する</code> (常に表示)</li>
            <li><code className="text-slate-400 bg-slate-700 px-1 rounded"># 矢羽: 合流時だけ</code> (複数合流するパスのみ)</li>
            <li><code className="text-slate-400 bg-slate-700 px-1 rounded"># 矢羽: しない</code> (表示しない)</li>
            <li><code className="text-slate-400 bg-slate-700 px-1 rounded"># 文字サイズ: 16</code> (数字で指定。基本は11)</li>
            <li><code className="text-slate-400 bg-slate-700 px-1 rounded"># 横間隔: 260</code> (横のノード間隔、基本は260)</li>
            <li><code className="text-slate-400 bg-slate-700 px-1 rounded"># 縦間隔: 160</code> (縦のノード間隔、基本は160)</li>
          </ul>
          <p className="font-bold mb-1">使用可能なタイプ:</p>
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            <li>start / end / term (端子)</li>
            <li>proc / process (処理)</li>
            <li>dec / decision (判断)</li>
            <li>io / input / output (入出力)</li>
            <li>display / disp (表示)</li>
            <li>manual / input (手操作入力)</li>
            <li>loop_s / loop_e (繰り返し開始/終了)</li>
            <li>prep / preparation (準備)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

