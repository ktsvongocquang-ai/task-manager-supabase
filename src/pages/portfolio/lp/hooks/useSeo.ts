import { useEffect } from 'react';

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

// NV3.5 — <title>, meta description, og:image để link dán vào comment hiện ảnh đẹp
export function useSeo({ title, description, image }: { title: string; description?: string; image?: string | null }) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;
    if (description) {
      setMeta('description', description);
      setMeta('og:description', description, 'property');
    }
    setMeta('og:title', title, 'property');
    if (image) setMeta('og:image', image, 'property');
    return () => {
      document.title = prevTitle;
    };
  }, [title, description, image]);
}
