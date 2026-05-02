import React from 'react';
import { HelpCircle } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onOpenHelp: () => void;
}

export const Editor: React.FC<Props> = ({ value, onChange, onOpenHelp }) => {
  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
        <h2 className="text-sm font-semibold text-slate-700">エディタ</h2>
        <button
          onClick={onOpenHelp}
          className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          title="使い方ガイドを開く (F1)"
        >
          <HelpCircle size={13} />
          使い方 (F1)
        </button>
      </div>
      
      <div className="flex-1 relative font-mono text-sm min-h-0">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-full p-4 resize-none focus:outline-none bg-transparent text-slate-800 leading-relaxed"
          placeholder="ここにDSLを入力してください..."
          spellCheck={false}
          id="flow-editor"
        />
        <div className="absolute top-4 right-4 text-[10px] text-slate-300 pointer-events-none">
          {value.length} 文字
        </div>
      </div>

      {/* Compact inline quick-reference */}
      <div className="shrink-0 px-4 py-3 bg-slate-800 text-white text-[11px] border-t border-slate-200 z-10">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-300">
          <span><code className="text-slate-200 bg-slate-700 px-1 rounded">id: タイプ テキスト</code> ノード定義</span>
          <span><code className="text-slate-200 bg-slate-700 px-1 rounded">a -{'>'} b (ラベル)</code> 接続</span>
          <span><code className="text-slate-200 bg-slate-700 px-1 rounded">term dec proc io</code> 主なタイプ</span>
          <span><code className="text-slate-200 bg-slate-700 px-1 rounded">disp loop_s loop_e</code> その他</span>
        </div>
        <p className="mt-2 text-slate-500 text-[10px]">
          詳細は <button onClick={onOpenHelp} className="underline text-slate-300 hover:text-white cursor-pointer">使い方ガイド (F1)</button> を参照
        </p>
      </div>
    </div>
  );
};

