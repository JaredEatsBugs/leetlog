export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-7 items-center justify-center rounded-[7px] bg-brand">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <span className="text-[17px] font-bold tracking-tight">LeetLog</span>
    </span>
  );
}
