"use client";

// Botón de cerrar: ícono X, 44 px, foco visible.
export default function BotonCerrar({ onClick, etiqueta }: { onClick: () => void; etiqueta: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      className="presionable flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-pastilla text-suave hover:bg-panel hover:text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        className="h-5 w-5"
        aria-hidden
      >
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  );
}
