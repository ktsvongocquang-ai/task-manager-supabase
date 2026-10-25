import { useEffect, useState } from 'react';
import { SectionHeader } from './shared';
import { landingSupabase } from './landingSupabase';

interface WorkflowStep {
  step: string;
  title: string;
  duration: string;
  executor: string;
  details: string;
}

export function WorkflowSteps() {
  const [steps, setSteps] = useState<WorkflowStep[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    landingSupabase
      .from('landing_workflow_steps')
      .select('step_no,title,duration,executor,details')
      .order('sort_order')
      .then(({ data }) => {
        setSteps((data || []).map(row => ({
          step: row.step_no, title: row.title, duration: row.duration || '', executor: row.executor || '', details: row.details || '',
        })));
      })
      .catch(() => setSteps([]));
  }, []);

  return (
    <section id="section-2" className="px-6 md:px-16 py-20 bg-[#F8F5F0] border-b border-[#2C2920]/5">
      <div className="max-w-3xl mx-auto">
        <SectionHeader eyebrow="(VẬN HÀNH CHI TIẾT)" title="Quy trình làm việc" accent="từ khảo sát đến bàn giao" />

        {!steps ? (
          <p className="text-xs text-[#8A8070]">Đang tải...</p>
        ) : (
          <div className="divide-y divide-[#2C2920]/10">
            {steps.map(step => {
              const isOpen = expanded === step.step;
              return (
                <div key={step.step} className="py-3.5">
                  <button onClick={() => setExpanded(isOpen ? null : step.step)} className="w-full flex items-center justify-between gap-4 text-left cursor-pointer">
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="font-serif italic text-base text-[#B8913A] shrink-0 w-6">{step.step}</span>
                      <div className="min-w-0">
                        <h3 className="font-sans font-bold text-sm text-[#2C2920] truncate">{step.title}</h3>
                        <p className="text-[11px] text-[#8A8070] truncate">{step.duration} · {step.executor}</p>
                      </div>
                    </div>
                    <span className="text-[#B8913A] text-base shrink-0">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <p className="text-xs text-[#8A8070] leading-relaxed mt-3 pl-10 max-w-2xl">{step.details}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
