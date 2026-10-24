// Íconos SVG inline (trazo, 24x24), sin dependencias.
type P = { className?: string };
const base = (className = "h-5 w-5") => ({
  className,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const IconoPeligro = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);
export const IconoOk = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10Z" />
    <path d="m8 12 3 3 5-6" />
  </svg>
);
export const IconoBuscar = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
export const IconoUbicacion = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
export const IconoPlata = ({ className }: P) => (
  <svg {...base(className)}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
);
export const IconoReloj = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const IconoGuion = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
  </svg>
);
export const IconoGiro = ({ className }: P) => (
  <svg {...base(`${className ?? "h-5 w-5"} animate-spin`)}>
    <path d="M21 12a9 9 0 1 1-6.2-8.6" />
  </svg>
);
export const IconoCasa = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z" />
  </svg>
);
export const IconoChat = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </svg>
);
export const IconoRed = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="12" cy="5" r="2.5" />
    <circle cx="5" cy="18" r="2.5" />
    <circle cx="19" cy="18" r="2.5" />
    <path d="m10.8 7.2-4.6 8.6M13.2 7.2l4.6 8.6M7.5 18h9" />
  </svg>
);
export const IconoAjustes = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="18" cy="18" r="2" />
  </svg>
);
export const IconoEscudo = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
export const IconoFlecha = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
