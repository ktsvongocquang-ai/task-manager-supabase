import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../../../services/supabase';

export type Seg = 'can-ho' | 'nha-pho-du-an' | 'nha-pho' | 'villa';
export const VALID_SEGS: Seg[] = ['can-ho', 'nha-pho-du-an', 'nha-pho', 'villa'];

export interface ArchitectStat {
  value: string;
  label: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface LandingPageRow {
  id: string;
  slug: string;
  default_phone: string | null;
  default_zalo: string | null;
  architect_name: string | null;
  architect_role: string | null;
  architect_photo: string | null;
  architect_signature: string | null;
  architect_quote: string | null;
  architect_zalo: string | null;
  architect_stats: ArchitectStat[] | null;
  offer_slots_left: number | null;
  offer_month: string | null;
  response_promise: string | null;
  legal_name: string | null;
  tax_code: string | null;
  address: string | null;
  maps_url: string | null;
  hotline: string | null;
  founded_at: string | null;
  social_links: SocialLink[] | null;
}

interface SalesRep {
  code: string;
  name: string;
  phone: string | null;
  zalo: string | null;
}

const SS_SEG = 'lp_seg';
const SS_SALE = 'lp_sale';
const SS_NGUON = 'lp_nguon';
const SS_UTM = 'lp_utm';

function readSession(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(key);
}

export function useLeadParams(slug: string | undefined) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState<LandingPageRow | null | undefined>(undefined);
  const [salesRep, setSalesRep] = useState<SalesRep | null>(null);

  const seg = useMemo<Seg | undefined>(() => {
    const fromQuery = searchParams.get('seg');
    if (fromQuery && VALID_SEGS.includes(fromQuery as Seg)) return fromQuery as Seg;
    const fromSession = readSession(SS_SEG);
    if (fromSession && VALID_SEGS.includes(fromSession as Seg)) return fromSession as Seg;
    return undefined;
  }, [searchParams]);

  const sale = searchParams.get('sale') || readSession(SS_SALE) || undefined;
  const nguon = searchParams.get('nguon') || readSession(SS_NGUON) || undefined;

  const utm = useMemo(() => {
    const fromQuery: Record<string, string> = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(key => {
      const v = searchParams.get(key);
      if (v) fromQuery[key] = v;
    });
    if (Object.keys(fromQuery).length > 0) return fromQuery;
    try {
      const stored = readSession(SS_UTM);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (seg) sessionStorage.setItem(SS_SEG, seg);
    if (sale) sessionStorage.setItem(SS_SALE, sale);
    if (nguon) sessionStorage.setItem(SS_NGUON, nguon);
    if (Object.keys(utm).length > 0) sessionStorage.setItem(SS_UTM, JSON.stringify(utm));
  }, [seg, sale, nguon, utm]);

  // NV4.5 — chọn loại công trình bằng tay: đổi seg trên URL không reload trang
  const setSeg = (next: Seg) => {
    sessionStorage.setItem(SS_SEG, next);
    const params = new URLSearchParams(searchParams);
    params.set('seg', next);
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    let cancelled = false;
    const query = slug
      ? supabase.from('landing_pages').select('*').eq('slug', slug).maybeSingle()
      : Promise.resolve({ data: null as LandingPageRow | null });
    query
      .then(({ data }) => {
        if (!cancelled) setPage(data as LandingPageRow | null);
      })
      .catch(() => {
        if (!cancelled) setPage(null);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    const query = sale
      ? supabase.from('sales_reps').select('code,name,phone,zalo').eq('code', sale).eq('active', true).maybeSingle()
      : Promise.resolve({ data: null as SalesRep | null });
    query
      .then(({ data }) => {
        if (!cancelled) setSalesRep(data as SalesRep | null);
      })
      .catch(() => {
        if (!cancelled) setSalesRep(null);
      });
    return () => {
      cancelled = true;
    };
  }, [sale]);

  const phone = salesRep?.phone || page?.default_phone || page?.hotline || '';
  const zalo = salesRep?.zalo || page?.default_zalo || '';

  return { seg, setSeg, sale, nguon, utm, page, salesRep, phone, zalo, pageLoading: page === undefined };
}
