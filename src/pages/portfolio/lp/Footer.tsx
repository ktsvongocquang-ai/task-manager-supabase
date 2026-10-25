import { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase';
import type { LandingPageRow, Seg } from './hooks/useLeadParams';
import { track } from './lib/track';

interface Props {
  page: LandingPageRow | null | undefined;
  seg: Seg | undefined;
}

interface WorkflowStepRow {
  step_no: string;
  title: string;
  duration: string | null;
  executor: string | null;
  details: string | null;
  sort_order: number;
}

const SOCIAL_LABEL: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  behance: 'Behance',
  tiktok: 'TikTok',
  zalo: 'Zalo OA',
};

function yearsActive(foundedAt: string | null): number | null {
  if (!foundedAt) return null;
  const founded = new Date(foundedAt);
  if (Number.isNaN(founded.getTime())) return null;
  const diffYears = (Date.now() - founded.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.floor(diffYears);
}

export function Footer({ page, seg }: Props) {
  const [steps, setSteps] = useState<WorkflowStepRow[] | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    supabase
      .from('landing_workflow_steps')
      .select('step_no,title,duration,executor,details,sort_order')
      .order('sort_order')
      .then(({ data }) => setSteps((data as WorkflowStepRow[]) || []))
      .catch(() => setSteps([]));
  }, []);

  // NV9.2 — căn hộ không hiện bước "Thi công phần thô"
  const visibleSteps = (steps || []).filter(s => !(seg === 'can-ho' && s.title === 'Thi công phần thô'));
  const years = yearsActive(page?.founded_at || null);
  const socials = (page?.social_links || []).filter(s => s.url);

  return (
    <footer className="px-6 py-16 bg-lp-ink text-white/60">
      <div className="max-w-5xl mx-auto space-y-10">
        {visibleSteps.length > 0 && (
          <div className="border-t border-white/10 pt-8">
            <button
              onClick={() => setExpanded(v => !v)}
              className="font-lp-sans text-xs font-semibold text-white/80 flex items-center gap-2 cursor-pointer"
            >
              Quy trình 8 bước từ khảo sát đến bàn giao
              <span aria-hidden="true">{expanded ? '−' : '+'}</span>
            </button>
            {expanded && (
              <ol className="mt-4 space-y-3">
                {visibleSteps.map(s => (
                  <li key={s.step_no} className="flex gap-3 text-xs">
                    <span className="font-lp-serif italic text-lp-gold shrink-0 w-6">{s.step_no}</span>
                    <span>
                      <span className="text-white/80 font-semibold">{s.title}</span>
                      {s.duration && <span className="text-white/40"> · {s.duration}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-1 font-lp-sans text-xs">
            {page?.legal_name && <p className="text-white/80 font-semibold">{page.legal_name}</p>}
            {page?.tax_code && <p>MST: {page.tax_code}</p>}
            {page?.address &&
              (page?.maps_url ? (
                <a href={page.maps_url} target="_blank" rel="noopener noreferrer" className="hover:text-lp-gold transition-colors">
                  {page.address}
                </a>
              ) : (
                <p>{page.address}</p>
              ))}
            {page?.hotline && <p>Hotline: {page.hotline}</p>}
            {years != null && years > 0 && <p>{years} năm hoạt động</p>}
          </div>

          <div className="flex flex-col items-start md:items-end gap-3">
            <a
              href="https://dqharchitects.vn"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('click_website')}
              className="font-lp-sans text-xs font-semibold text-lp-gold hover:text-white transition-colors"
            >
              Xem hồ sơ năng lực đầy đủ →
            </a>
            {socials.length > 0 && (
              <div className="flex gap-3">
                {socials.map(s => (
                  <a
                    key={s.platform}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] uppercase tracking-wide text-white/50 hover:text-lp-gold transition-colors"
                  >
                    {SOCIAL_LABEL[s.platform] || s.platform}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
