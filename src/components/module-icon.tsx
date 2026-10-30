const paths: Record<string, string> = {
  DB: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  AC: "M9 5H5v16h14V5h-4 M9 3h6v4H9z M8 12l2 2 5-5 M8 18h7",
  FM: "M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4 M8 14h3 M14 14h2 M8 18h3",
  KP: "M4 3v17h17 M8 16v-4 M13 16V8 M18 16V5",
  CC: "M4 4h16v16H4z M4 9h16 M9 9v11 M13 13h3 M13 16h3",
  EO: "M9 3h6v5H9z M3 16h6v5H3z M15 16h6v5h-6z M12 8v4 M6 16v-4h12v4",
  HP: "M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6z M8 12l3 3 5-6",
  PC: "M4 4v17 M8 5h10v4H8z M11 12h10v4H11z M7 19h8",
  RE: "M5 3h10l4 4v14H5z M14 3v5h5 M8 12h8 M8 16h8",
  NO: "M5 17h14l-2-3V9a5 5 0 0 0-10 0v5z M10 21h4 M12 2v2",
  AD: "M4 6h16 M4 12h16 M4 18h16 M8 3v6 M16 9v6 M10 15v6",
};
export function ModuleIcon({ symbol }: { symbol: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[symbol] ?? paths.DB} />
    </svg>
  );
}
export function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14 M13 6l6 6-6 6" />
    </svg>
  );
}
