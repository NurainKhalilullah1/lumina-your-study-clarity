type DetectOverflowOptions = {
  reason?: string;
  maxOffenders?: number;
};

const EPS = 1; // px tolerance

function getNodeLabel(el: Element) {
  const htmlEl = el as HTMLElement;
  const id = htmlEl.id ? `#${htmlEl.id}` : "";
  const cls = htmlEl.className
    ? `.${String(htmlEl.className).trim().split(/\s+/).slice(0, 3).join(".")}`
    : "";
  return `${el.tagName.toLowerCase()}${id}${cls}`;
}

function getDomPath(el: Element, maxDepth = 6) {
  const parts: string[] = [];
  let cur: Element | null = el;
  let depth = 0;

  while (cur && depth < maxDepth) {
    parts.unshift(getNodeLabel(cur));
    cur = cur.parentElement;
    depth += 1;
  }

  return parts.join(" > ");
}

export function detectHorizontalOverflow(options: DetectOverflowOptions = {}) {
  if (typeof document === "undefined") return;

  const { reason = "(unspecified)", maxOffenders = 15 } = options;
  const root = document.documentElement;
  const clientW = root.clientWidth;
  const scrollW = root.scrollWidth;
  const delta = scrollW - clientW;

  // Always print a single-line summary (cheap), detailed list only if overflowing.
  // eslint-disable-next-line no-console
  console.debug(
    `[overflow-check] ${reason} — clientWidth=${clientW}, scrollWidth=${scrollW}, delta=${delta}`
  );

  if (delta <= EPS) return;

  const offenders: Array<{
    el: Element;
    path: string;
    rectRight: number;
    rectWidth: number;
    scrollWidth: number;
    clientWidth: number;
  }> = [];

  const all = Array.from(document.body.querySelectorAll("*"));
  for (const el of all) {
    if (!(el instanceof HTMLElement)) continue;
    const rect = el.getBoundingClientRect();
    const rectRight = rect.left + rect.width;

    const isOutsideViewport = rectRight > clientW + EPS;
    const hasInternalOverflow = el.scrollWidth > el.clientWidth + EPS;

    if (!isOutsideViewport && !hasInternalOverflow) continue;

    offenders.push({
      el,
      path: getDomPath(el),
      rectRight,
      rectWidth: rect.width,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    });

    if (offenders.length >= maxOffenders) break;
  }

  // eslint-disable-next-line no-console
  console.groupCollapsed(
    `[overflow-check] Found ${offenders.length} offender(s) — ${reason}`
  );
  offenders.forEach((o, idx) => {
    // eslint-disable-next-line no-console
    console.log(
      `#${idx + 1}`,
      {
        path: o.path,
        rectRight: Math.round(o.rectRight),
        rectWidth: Math.round(o.rectWidth),
        scrollWidth: o.scrollWidth,
        clientWidth: o.clientWidth,
      },
      o.el
    );
  });
  // eslint-disable-next-line no-console
  console.groupEnd();
}
