import React, { useState, useMemo } from 'react';
import { Editor } from './components/Editor';
import { FlowchartRenderer } from './components/FlowchartRenderer';
import { parseFlowchart } from './lib/parser';
import { Share2, Download, FileJson, Upload } from 'lucide-react';
import { motion } from 'motion/react';

const INITIAL_DATA = `# 矢羽: 合流時だけ
# 文字サイズ: 14
# 横間隔: 220
# 縦間隔: 120

# FizzBuzzの例
start: term 開始
loop: loop_s FizzBuzz処理\\n(i = 1 から 100)
mod15: dec 15の倍数？
dispFB: disp "FizzBuzz"
mod3: dec 3の倍数？
dispF: disp "Fizz"
mod5: dec 5の倍数？
dispB: disp "Buzz"
dispNum: disp i
loopEnd: loop_e ループ終了
end: term 終了

start -> loop
loop -> mod15
mod15 -> dispFB (Yes)
mod15 -> mod3 (No)
dispFB -> loopEnd

mod3 -> dispF (Yes)
mod3 -> mod5 (No)
dispF -> loopEnd

mod5 -> dispB (Yes)
mod5 -> dispNum (No)
dispB -> loopEnd
dispNum -> loopEnd

loopEnd -> end`;

export default function App() {
  const [markup, setMarkup] = useState(INITIAL_DATA);

  const graph = useMemo(() => {
    return parseFlowchart(markup);
  }, [markup]);

  const handleExportJson = () => {
    const exportData = {
      version: 1,
      markup: markup,
      graph: graph
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowchart_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const data = JSON.parse(result);
        if (data.markup) {
          setMarkup(data.markup);
        } else {
          alert('有効なファイルではありません（markupデータが見つかりません）');
        }
      } catch (err) {
        alert('ファイルの読み込みに失敗しました');
      }
      // Reset input so the same file could be imported again
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleDownloadSvg = () => {
    const svgElement = document.getElementById('main-flowchart-svg');
    if (!svgElement) {
      alert('SVGが見つかりませんでした');
      return;
    }
    
    // SVGをクローンして属性を整理
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    // 背景色を白に設定（エクスポート用）
    clonedSvg.style.backgroundColor = 'white';
    
    // シリアライズ
    const serializer = new XMLSerializer();
    const source = '<?xml version="1.0" standalone="no"?>\r\n' + serializer.serializeToString(clonedSvg);
    
    // Blobとしてダウンロード
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `flowchart_${new Date().getTime()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <Share2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight">JIS Flow</h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-none">Standard Flowchart Gen</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer">
            <Upload size={14} />
            JSON読込
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={handleImportJson} 
            />
          </label>
          <button 
            onClick={handleExportJson}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            <FileJson size={14} />
            JSON出力
          </button>
          <button 
            onClick={handleDownloadSvg}
            className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-md transition-all shadow-sm"
          >
            <Download size={14} />
            SVG保存
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-80 lg:w-96 shrink-0 h-full overflow-hidden"
        >
          <Editor value={markup} onChange={setMarkup} />
        </motion.div>

        <div className="flex-1 overflow-hidden relative border-t border-slate-200 lg:border-t-0 bg-[#fbfcfd]">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="h-full w-full"
          >
            <FlowchartRenderer graph={graph} />
          </motion.div>
          
          {/* Legend Overlay */}
          <div className="absolute bottom-6 left-6 p-4 bg-white/60 backdrop-blur-md border border-slate-200 rounded-xl shadow-lg pointer-events-none hidden md:block">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">JIS 記号凡例</h4>
            <div className="flex gap-4">
              <LegendItem label="端子" shape="rounded" />
              <LegendItem label="処理" shape="rect" />
              <LegendItem label="判断" shape="diamond" />
              <LegendItem label="入出力" shape="parallelogram" />
              <LegendItem label="繰り返し" shape="loop" />
              <LegendItem label="表示" shape="display" />
              <LegendItem label="手操作入力" shape="manual" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function LegendItem({ label, shape }: { label: string; shape: string }) {
  const renderIcon = () => {
    const common = "stroke-slate-400 fill-white";
    switch (shape) {
      case 'rounded': return <rect width="30" height="15" rx="7.5" ry="7.5" className={common} />;
      case 'rect': return <rect width="30" height="15" className={common} />;
      case 'diamond': return <path d="M 15 0 L 30 7.5 L 15 15 L 0 7.5 Z" className={common} />;
      case 'parallelogram': return <path d="M 5 0 L 30 0 L 25 15 L 0 15 Z" className={common} />;
      case 'loop': return <path d="M 5 0 L 25 0 L 30 5 L 30 15 L 0 15 L 0 5 Z" className={common} />;
      case 'display': return <path d="M 5 0 L 25 0 Q 30 7.5 25 15 L 5 15 L 0 7.5 Z" className={common} />;
      case 'manual': return <path d="M 0 5 L 30 0 L 30 15 L 0 15 Z" className={common} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="32" height="16" viewBox="0 0 32 16" className="overflow-visible">
        <g transform="translate(1, 0.5)">
          {renderIcon()}
        </g>
      </svg>
      <span className="text-[9px] font-bold text-slate-500">{label}</span>
    </div>
  );
}
