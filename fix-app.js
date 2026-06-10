const fs = require('fs');
const path = 'mirror-app/src/App.tsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// Fix 1: Line 80 (0-indexed) - replace duplicate showNewProjectModal with showShareModal
// Line 81 in 1-indexed
lines[80] = '  const [showShareModal, setShowShareModal] = useState<boolean>(false);';
console.log('Fix 1 applied: restored showShareModal at line 81');

// Fix 2: Replace corrupted section starting at line 1188 (1-indexed = 1187 0-indexed)
// through to before "B. MAIN PROJECT BOARDS SECTION"
let startLine = 1187; // 0-indexed
let endLine = startLine;

for (let i = startLine; i < lines.length; i++) {
  if (lines[i] && lines[i].includes('B. MAIN PROJECT BOARDS SECTION')) {
    endLine = i - 1;
    break;
  }
}

console.log(`Fix 2: replacing lines ${startLine+1}-${endLine+1} (1-indexed)`);
console.log('End boundary:', lines[endLine]);

const correctBlock = `            <div className="hidden sm:flex items-center -space-x-1.5 overflow-hidden ml-1">
              {userRolesList.slice(0, 4).map((user) => (
                <div
                  key={user.id}
                  className="w-6 h-6 rounded-full border border-slate-950 flex items-center justify-center text-[8.5px] font-bold text-white shrink-0"
                  style={{ backgroundColor: user.color }}
                  title={\`\${user.name} (\${user.role})\`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ))}
              <div className="w-6 h-6 rounded-full bg-slate-850 border border-slate-950 flex items-center justify-center text-[8.5px] font-bold text-slate-400 shrink-0 select-none">
                +{userRolesList.length - 4}
              </div>
            </div>
          </div>
        </header>

        {/* MIRO DASHBOARD WRAPPER CONTAINER */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 max-w-7xl w-full mx-auto flex flex-col gap-8">

          {/* A. THONG BAO & HOAT DONG NHOM */}
          <section className="grid grid-cols-1 xl:grid-cols-5 gap-4">

            {/* Notification Feed - 3/5 */}
            <div className="xl:col-span-3 bg-slate-900/30 border border-slate-900/60 rounded-3xl p-5 flex flex-col gap-3 select-none">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest">
                  \uD83D\uDD14 Th\u00f4ng b\u00e1o g\u1ea7n \u0111\u00e2y
                </h2>
                {recentNotifs.filter(n => !n.read).length > 0 && (
                  <button onClick={() => { import('./lib/notifications').then(m => m.markAllRead()); }}
                    className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer">
                    \u0110\u00e1nh d\u1ea5u t\u1ea5t c\u1ea3 \u0111\u00e3 \u0111\u1ecdc
                  </button>
                )}
              </div>
              {recentNotifs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-slate-600">
                  <span className="text-3xl mb-2">\uD83D\uDD15</span>
                  <p className="text-xs">Ch\u01b0a c\u00f3 th\u00f4ng b\u00e1o n\u00e0o</p>
                  <p className="text-[10px] mt-1">Th\u00f4ng b\u00e1o xu\u1ea5t hi\u1ec7n khi c\u00f3 l\u1ed7i m\u1edbi ho\u1eb7c b\u1ea3n v\u1ebd \u0111\u01b0\u1ee3c duy\u1ec7t</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-[260px] overflow-y-auto pr-1">
                  {recentNotifs.slice(0, 12).map(n => {
                    const iconMap = { defect_new: "\uD83D\uDCCD", defect_update: "\uD83D\uDD04", revision_pending: "\u23F3", revision_approved: "\u2705", revision_rejected: "\u274C", diary_critical: "\uD83D\uDEA8", gate_pending: "\uD83D\uDD14", gate_signed: "\u270D\uFE0F", info: "\u2139\uFE0F" };
                    const diff = Date.now() - n.timestamp;
                    const ago = diff < 60000 ? "V\u1eeba xong" : diff < 3600000 ? \`\${Math.floor(diff/60000)} ph\u00fat tr\u01b0\u1edbc\` : diff < 86400000 ? \`\${Math.floor(diff/3600000)} gi\u1edd tr\u01b0\u1edbc\` : new Date(n.timestamp).toLocaleDateString("vi-VN");
                    return (
                      <div key={n.id} onClick={() => markRead(n.id)}
                        className={\`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all \${n.read ? "hover:bg-slate-900/40 opacity-60" : "bg-indigo-500/5 border border-indigo-500/15 hover:bg-indigo-500/10"}\`}
                      >
                        <span className="text-base shrink-0 mt-0.5">{(iconMap as any)[n.type] || "\uD83D\uDD14"}</span>
                        <div className="flex-1 min-w-0">
                          <p className={\`text-xs font-bold truncate \${n.read ? "text-slate-400" : "text-slate-100"}\`}>{n.title}</p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{n.body}</p>
                          <p className="text-[10px] text-slate-600 mt-1">{ago}</p>
                        </div>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5 animate-pulse" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Team Activity - 2/5 */}
            <div className="xl:col-span-2 bg-slate-900/30 border border-slate-900/60 rounded-3xl p-5 flex flex-col gap-4 select-none">
              <h2 className="text-xs font-black text-emerald-400 uppercase tracking-widest">\uD83D\uDCCA Ho\u1ea1t \u0111\u1ed9ng nh\u00f3m</h2>
              <div className="grid grid-cols-2 gap-3">
                {([[projects.filter(p => !p.status || p.status === "active").length, "C\u00f4ng tr\u00ecnh \u0111ang ch\u1ea1y", "\uD83C\uDFD7\uFE0F"],
                   [markerNotes.filter(m => !(m.tags?.[0] === "\u0110\u00e3 duy\u1ec7t")).length, "L\u1ed7i ch\u01b0a x\u1eed l\u00fd", "\uD83D\uDD34"],
                   [markerNotes.filter(m => m.tags?.[0] === "\u0110\u00e3 duy\u1ec7t").length, "\u0110\u00e3 gi\u1ea3i quy\u1ebft", "\u2705"],
                   [recentNotifs.filter(n => !n.read).length, "Th\u00f4ng b\u00e1o ch\u01b0a \u0111\u1ecdc", "\uD83D\uDD14"]
                ] as [number, string, string][]).map(([val, label, icon]) => (
                  <div key={label} className="bg-slate-950/50 rounded-2xl p-3 border border-slate-900">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-base">{icon}</span>
                      <span className="text-xl font-black text-slate-100 font-mono">{val}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">{label}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold mb-2">L\u1ed7i m\u1edbi nh\u1ea5t</p>
                <div className="flex flex-col gap-1.5">
                  {markerNotes.sort((a,b) => b.createdAt - a.createdAt).slice(0,4).map(m => {
                    const fp = floorPlans.find(f => f.id === m.floorPlanId);
                    const proj = projects.find(p => fp?.projectId === p.id);
                    const sc = m.tags?.[0] === "\u0110\u00e3 duy\u1ec7t" ? "text-emerald-400" : m.tags?.[0] === "\u0110ang s\u1eeda" ? "text-amber-400" : "text-rose-400";
                    return (
                      <div key={m.id} className="flex items-center gap-2 py-1.5 border-b border-slate-900/50 last:border-0">
                        <span className={\`text-xs font-black shrink-0 \${sc}\`}>\u25CF</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-slate-300 truncate">{m.title || "L\u1ed7i kh\u00f4ng t\u00ean"}</p>
                          <p className="text-[10px] text-slate-600 truncate">{proj?.name || "D\u1ef1 \u00e1n"}</p>
                        </div>
                        <span className="text-[9px] text-slate-600 shrink-0">{m.tags?.[0] || "Ch\u01b0a s\u1eeda"}</span>
                      </div>
                    );
                  })}
                  {markerNotes.length === 0 && <p className="text-[11px] text-slate-600 italic py-2">Ch\u01b0a c\u00f3 PIN l\u1ed7i n\u00e0o</p>}
                </div>
              </div>
              <button
                onClick={() => { setNewProjectName(""); setNewProjectClient(""); setNewProjectAddress(""); setNewProjectLeader("KTS. V\u00f5 Ng\u1ecdc Quang"); setShowNewProjectModal(true); }}
                className="w-full mt-auto py-2.5 bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs font-black rounded-2xl cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> T\u1ea1o c\u00f4ng tr\u00ecnh m\u1edbi
              </button>
            </div>

          </section>

`;

const blockLines = correctBlock.split('\n');
lines.splice(startLine, endLine - startLine + 1, ...blockLines);

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Fix 2 applied. Total lines now:', lines.length);
console.log('Done!');
