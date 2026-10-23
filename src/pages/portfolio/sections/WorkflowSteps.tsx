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
    <section id="section-2" className="px-6 md:px-16 py-32 bg-[#F8F5F0] border-b border-[#2C2920]/5">
      <div className="max-w-4xl mx-auto">
        <SectionHeader eyebrow="(VẬN HÀNH CHI TIẾT)" title="Quy trình làm việc" accent="từ khảo sát đến bàn giao" />

        {!steps ? (
          <p className="text-xs text-[#8A8070]">Đang tải...</p>
        ) : (
          <div className="divide-y divide-[#2C2920]/10">
            {steps.map(step => {
              const isOpen = expanded === step.step;
              return (
                <div key={step.step} className="py-6">
                  <button onClick={() => setExpanded(isOpen ? null : step.step)} className="w-full flex items-start justify-between gap-6 text-left cursor-pointer">
                    <div className="flex items-start gap-5">
                      <span className="font-serif italic text-xl text-[#B8913A] shrink-0 w-8">{step.step}</span>
                      <div>
                        <h3 className="font-sans font-bold text-base text-[#2C2920]">{step.title}</h3>
                        <p className="text-xs text-[#8A8070] mt-1">{step.duration} · {step.executor}</p>
                      </div>
                    </div>
                    <span className="text-[#B8913A] text-lg shrink-0">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <p className="text-xs text-[#8A8070] leading-relaxed mt-4 ml-13 pl-[2.6rem] max-w-2xl">{step.details}</p>
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
