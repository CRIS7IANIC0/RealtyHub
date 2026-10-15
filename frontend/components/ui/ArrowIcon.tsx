/** Flecha dibujada (trazo 1.75) para enlaces y botones; sustituye los glifos de texto. */
export default function ArrowIcon({
  dir = "right",
  size = 16,
  className = "",
}: {
  dir?: "right" | "left";
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`inline-block shrink-0 ${dir === "left" ? "rotate-180" : ""} ${className}`}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
