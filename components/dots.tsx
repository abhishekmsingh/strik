export function Dots({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      aria-hidden="true"
    >
      <span
        className="size-1.5 rounded-full bg-current"
        style={{ animation: "strik-dot 1.2s ease-in-out infinite" }}
      />
      <span
        className="size-1.5 rounded-full bg-current"
        style={{
          animation: "strik-dot 1.2s ease-in-out infinite",
          animationDelay: "0.15s",
        }}
      />
      <span
        className="size-1.5 rounded-full bg-current"
        style={{
          animation: "strik-dot 1.2s ease-in-out infinite",
          animationDelay: "0.3s",
        }}
      />
    </span>
  );
}
