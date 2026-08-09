export function BrandMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <circle cx="32" cy="32" r="30" className="fill-primary" />
      <ellipse
        cx="32"
        cy="32"
        rx="27"
        ry="10"
        className="stroke-accent"
        strokeWidth="2.5"
        transform="rotate(-18 32 32)"
      />
      <ellipse
        cx="32"
        cy="32"
        rx="27"
        ry="10"
        className="stroke-accent"
        strokeWidth="2.5"
        opacity="0.55"
        transform="rotate(18 32 32)"
      />
      <circle cx="32" cy="32" r="6.5" className="fill-accent" />
    </svg>
  );
}
