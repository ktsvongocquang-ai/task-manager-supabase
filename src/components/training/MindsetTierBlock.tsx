import React from 'react';
import { Lightbulb, AlertTriangle, CheckCircle2, ChevronRight, FileText } from 'lucide-react';

export default function MindsetTierBlock({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Tier Header */}
      <div className="bg-[#222] p-5 rounded-xl border border-[#333] shadow-sm">
        <h3 className="text-xl font-bold text-slate-50 mb-2">{data.title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{data.description}</p>
        
        {data.roles && data.roles.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {data.roles.map((r: string, i: number) => (
              <span key={i} className="px-2.5 py-1 bg-[#2a2a2a] text-gray-600 text-xs font-medium rounded-md uppercase tracking-wider">
                Dành cho: {r}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Groups */}
      <div className="space-y-10">
        {data.groups?.map((group: any) => (
          <div key={group.id} className="relative">
            {/* Group Title */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px bg-gray-200 flex-1" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-2 py-0.5 rounded-full mb-1">
                  {group.tag}
                </span>
                <h4 className="text-lg font-bold text-slate-100">{group.title}</h4>
              </div>
              <div className="h-px bg-gray-200 flex-1" />
            </div>

            {/* Principles / Items */}
            {group.type === 'checklist' && <MindsetChecklist items={group.items} />}
            {group.type === 'lessons' && <MindsetLessons items={group.items} />}
            {group.type === 'qdeck' && <MindsetQDeck items={group.items} />}
            {!group.type && group.principles && (
              <div className="space-y-8">
                {group.principles.map((p: any) => (
                  <PrincipleCard key={p.id} principle={p} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PrincipleCard({ principle }: { principle: any }) {
  return (
    <div className="bg-[#222] rounded-xl border border-[#333] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-[#1c1c1c] border-b border-[#333] px-5 py-4">
        <h5 className="text-base font-bold text-slate-50 flex items-start gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          {principle.name}
        </h5>
      </div>

      <div className="p-5 space-y-5">
        {/* Story */}
        {principle.story && (
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg">
            <p className="text-sm text-slate-100 leading-relaxed italic">
              "{principle.story}"
            </p>
          </div>
        )}

        {/* Rows (Wrong / Correct / Action / Warning) */}
        {principle.rows && principle.rows.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {principle.rows.map((row: any, idx: number) => {
              let colors = "bg-[#1c1c1c] border-[#333] text-slate-100";
              let icon = <ChevronRight className="w-4 h-4" />;
              
              if (row.type === 'wrong') {
                colors = "bg-red-50 border-red-100 text-red-900";
                icon = <AlertTriangle className="w-4 h-4 text-red-500" />;
              } else if (row.type === 'correct') {
                colors = "bg-green-50 border-green-100 text-green-900";
                icon = <CheckCircle2 className="w-4 h-4 text-green-500" />;
              } else if (row.type === 'warning') {
                colors = "bg-orange-50 border-orange-100 text-orange-900";
                icon = <AlertTriangle className="w-4 h-4 text-orange-500" />;
              } else if (row.type === 'action') {
                colors = "bg-blue-50 border-blue-100 text-blue-900";
                icon = <ChevronRight className="w-4 h-4 text-blue-500" />;
              }

              return (
                <div key={idx} className={`p-4 rounded-lg border ${colors}`}>
                  <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                    {icon}
                    {row.label}
                  </div>
                  <p className="text-sm leading-relaxed opacity-90">
                    {row.content}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Specs */}
        {principle.specs && principle.specs.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#333]">
            {principle.specs.map((spec: string, idx: number) => (
              <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#2a2a2a] text-gray-600 rounded-md text-xs font-medium border border-[#333]">
                <FileText className="w-3 h-3" />
                {spec}
              </span>
            ))}
          </div>
        )}

        {/* Sales Script */}
        {principle.sales_script && (
          <div className="mt-4 p-4 border-l-4 border-purple-500 bg-purple-50 rounded-r-lg">
            <p className="text-xs font-bold text-purple-700 uppercase mb-1 tracking-wider">Kịch bản Sales tư vấn</p>
            <p className="text-sm text-purple-900 italic font-medium">
              {principle.sales_script}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-components for Tier 3
function MindsetChecklist({ items }: { items: any[] }) {
  return (
    <div className="bg-[#222] border border-[#333] rounded-xl overflow-hidden shadow-sm">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-start gap-3 p-4 border-b border-[#333] last:border-0 hover:bg-[#1c1c1c] transition-colors">
          <div className="w-5 h-5 rounded border border-gray-300 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-slate-100 font-medium">{item.text}</p>
            {item.category && (
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 block">
                {item.category}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function MindsetLessons({ items }: { items: any[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, idx) => (
        <div key={idx} className="bg-red-50 border border-red-100 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-400" />
          <h5 className="font-bold text-red-900 mb-2">{item.title}</h5>
          <p className="text-sm text-red-800 leading-relaxed mb-4">{item.content}</p>
          <div className="bg-[#222]/60 p-3 rounded-lg border border-red-200/50">
            <p className="text-xs font-bold text-green-700 uppercase mb-1">Cách phòng tránh:</p>
            <p className="text-sm text-slate-100 font-medium">{item.prevention}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function MindsetQDeck({ items }: { items: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((item, idx) => (
        <div key={idx} className="bg-[#222] border border-[#333] rounded-xl p-5 hover:border-purple-300 transition-colors shadow-sm">
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest block mb-2">
            {item.context}
          </span>
          <p className="text-sm font-bold text-slate-50 mb-3 italic">
            "{item.question}"
          </p>
          <div className="pt-3 border-t border-[#333]">
            <p className="text-xs text-slate-400 mb-1">Mục đích khai thác:</p>
            <p className="text-sm text-slate-200 leading-relaxed">{item.purpose}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
