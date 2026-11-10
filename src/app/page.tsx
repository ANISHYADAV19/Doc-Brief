import { Header } from '@/components/Header';
import { FileUp, Sparkles, SlidersHorizontal, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Panel: File Input & Preview Placeholder */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-2">
                <FileUp className="w-5 h-5 text-indigo-400" />
                <h2 className="font-semibold text-sm tracking-wide uppercase text-slate-300">
                  Document Ingestion & Preview
                </h2>
              </div>
              <span className="text-xs text-slate-500">PDF, PNG, JPG, WEBP</span>
            </div>

            <div className="border-2 border-dashed border-slate-800 rounded-xl p-10 flex flex-col items-center justify-center text-center bg-slate-950/40 hover:border-indigo-500/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                <FileUp className="w-6 h-6" />
              </div>
              <p className="font-medium text-slate-200 mb-1">
                Drag & drop your document here, or browse
              </p>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                Supports digital PDFs up to 10MB and scanned images up to 5MB.
              </p>
              <div className="flex gap-2">
                {['PDF', 'PNG', 'JPG', 'WEBP'].map((badge) => (
                  <span
                    key={badge}
                    className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Right Panel: Synthesis & Intelligence Placeholder */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <h2 className="font-semibold text-sm tracking-wide uppercase text-slate-300">
                  Executive Intelligence & Summary
                </h2>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Medium (~250 words)</span>
              </div>
            </div>

            <div className="border border-slate-800/80 rounded-xl p-8 bg-slate-950/40 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-medium text-slate-300 mb-1">Foundation Ready</h3>
              <p className="text-xs text-slate-500 max-w-xs">
                Upload a document on the left to extract text and synthesize an executive summary with key takeaways.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
