import { useEffect, useState } from 'react';
import { supabase } from '../../../../services/supabase';
import { SectionLabel } from '../ui/SectionLabel';
import { ButtonGhost } from '../ui/Button';
import { Lightbox } from '../ui/Lightbox';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import type { Seg } from '../hooks/useLeadParams';
import { LP_SECTION_SPACING } from '../ui/constants';

interface ProjectRow {
  id: string;
  title: string;
  area_m2: number | null;
  location: string | null;
  style: string | null;
  duration_days: number | null;
  problem_solved: string | null;
  before_image: string | null;
  after_image: string | null;
  detail_images: string[] | null;
}

interface Props {
  seg: Seg | undefined;
  onBookVisit: () => void;
}

function ProjectCard({ project, delay }: { project: ProjectRow; delay: number }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const images = (project.detail_images || []).filter(Boolean);
  const hasCompare = !!project.before_image && !!project.after_image;
  const coverOnly = !hasCompare && !!project.after_image;

  return (
    <div className="space-y-5" style={{ animationDelay: `${delay}ms` }}>
      {hasCompare ? (
        <BeforeAfterSlider
          before={project.before_image!}
          after={project.after_image!}
          alt={project.title}
          onOpen={() => images.length > 0 && setLightboxIndex(0)}
        />
      ) : coverOnly ? (
        <button
          onClick={() => images.length > 0 && setLightboxIndex(0)}
          className="block w-full aspect-[4/5] rounded-lp overflow-hidden bg-lp-greige cursor-pointer"
        >
          <img src={project.after_image!} alt={project.title} loading="lazy" className="w-full h-full object-cover" />
        </button>
      ) : null}

      {images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setLightboxIndex(i)}
              className="snap-start shrink-0 w-20 h-20 rounded-lp overflow-hidden cursor-pointer"
            >
              <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        <h3 className="font-lp-serif text-xl text-lp-ink">{project.title}</h3>
        <p className="font-lp-sans text-xs text-lp-muted">
          {[project.area_m2 ? `${project.area_m2}m²` : null, project.location].filter(Boolean).join(' · ')}
        </p>
        <p className="font-lp-sans text-xs text-lp-muted">
          {[project.style, project.duration_days ? `${project.duration_days} ngày thi công` : null].filter(Boolean).join(' · ')}
        </p>
        {project.problem_solved && <p className="font-lp-serif italic text-sm text-lp-ink pt-1">{project.problem_solved}</p>}
      </div>

      {lightboxIndex !== null && images.length > 0 && (
        <Lightbox images={images} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onChangeIndex={setLightboxIndex} />
      )}
    </div>
  );
}

export function ProjectsBlock({ seg, onBookVisit }: Props) {
  const [projects, setProjects] = useState<ProjectRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const base = supabase.from('landing_projects').select('*').order('sort_order').limit(3);
    const query = seg ? base.eq('segment', seg) : base.eq('is_featured', true);
    query
      .then(({ data }) => {
        if (!cancelled) setProjects((data as ProjectRow[]) || []);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, [seg]);

  // NV5.6 — không có công trình nào thì ẩn cả section
  if (projects !== null && projects.length === 0) return null;

  return (
    <section id="projects" className={`px-6 ${LP_SECTION_SPACING} bg-white`}>
      <div className="max-w-6xl mx-auto">
        <SectionLabel className="mb-3">(CÔNG TRÌNH ĐÃ TRAO TAY)</SectionLabel>
        <h2 className="font-lp-serif text-3xl md:text-4xl font-light text-lp-ink mb-12 leading-tight">
          Mỗi công trình,
          <br />
          một lời hứa đã giữ đúng
        </h2>

        {projects === null ? (
          <p className="text-xs text-lp-muted">Đang tải...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {projects.map((p, i) => (
              <ProjectCard key={p.id} project={p} delay={i * 80} />
            ))}
          </div>
        )}

        <div className="mt-12">
          <ButtonGhost onClick={onBookVisit}>Đặt lịch xem công trình thực tế</ButtonGhost>
        </div>
      </div>
    </section>
  );
}
