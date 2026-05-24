import { useState } from "react";

function getDisplayType(log) {
  const docType = String(log?.edi_doc_type || "").trim();
  const message = String(log?.description || log?.message || "").toLowerCase();

  if (docType === "861" || message.includes("outbound edi 861")) {
    return "Receipt Advice";
  }

  return log?.title || log?.type || "System";
}

function getDisplayReference(log) {
  if (log?.reference) {
    return log.reference;
  }

  const message = String(log?.description || log?.message || "");
  return message.match(/(PO\d+|PO-\d+|BREW-\d+|DEL-\d+|INV-\d+)/)?.[0] || "N/A";
}

export function ActivityTimeline({ logs }) {
  const [selectedLog, setSelectedLog] = useState(null);

  return (
    <div className="flex flex-col h-full rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/5">
      <div className="flex-1 space-y-4 overflow-y-auto max-h-[450px] pr-1">
        {logs && logs.length > 0 ? (
          logs.map((log) => {
            const currentType = getDisplayType(log);
            const currentMessage = log.description || log.message || "";
            const currentTime = log.time || log.created_at || "—";

            return (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className="flex items-start justify-between p-3 rounded-xl transition-all duration-200 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 mt-1.5 shadow-[0_0_8px_#34d399]" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                      {currentType}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {currentMessage}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    {currentTime}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                    log.status === "Pending" 
                      ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20"
                  }`}>
                    {log.status || "OK"}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">
            No dynamic records available.
          </p>
        )}
      </div>

      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="w-full max-w-md p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white shadow-2xl relative transition-transform transform scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 rounded border border-emerald-500/20">
                  {getDisplayType(selectedLog)} Log
                </span>
                <h3 className="text-base font-bold mt-1.5">EDI Action Details</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors text-sm font-medium p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  Reference Info / Context
                </p>
                <p className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  {getDisplayReference(selectedLog)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  System Message
                </p>
                <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5 mt-1 leading-relaxed min-h-[40px]">
                  {selectedLog.description || selectedLog.message || "No message data returned."}
                </p>
              </div>

              {/* EDI Document Type & Raw Payload Viewer Terminal Block */}
              {selectedLog.raw_payload && (
                <div>
                  <div className="flex items-center justify-between mt-2 mb-1">
                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      Raw X12 Payload
                    </p>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded border border-blue-500/20">
                      EDI {selectedLog.edi_doc_type || "Unknown"}
                    </span>
                  </div>
                  <div className="bg-[#0d1117] border border-slate-700 rounded-xl overflow-hidden shadow-inner">
                    <div className="bg-slate-800/50 px-3 py-1.5 border-b border-slate-700 flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                      <span className="text-[10px] text-slate-400 ml-2 font-mono">payload.x12</span>
                    </div>
                    <pre className="p-3 overflow-x-auto text-[11px] leading-relaxed text-emerald-400 font-mono whitespace-pre-wrap max-h-[150px] overflow-y-auto custom-scrollbar">
                      {selectedLog.raw_payload}
                    </pre>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                <div>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    Timestamp
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {selectedLog.time || selectedLog.created_at || "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    Status Flag
                  </p>
                  <span className={`text-xs font-bold block mt-0.5 ${selectedLog.status === "Pending" ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {selectedLog.status || "OK"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
