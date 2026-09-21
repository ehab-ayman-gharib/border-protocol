export function Portrait({
  index,
  className = "",
}: {
  index: number;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={
        [
          "Portrait of Jorji Costava",
          "Portrait of Boris Vance",
          "Portrait of Elysia Ward",
        ][index]
      }
      className={`portrait ${className}`}
      style={{ backgroundPosition: `${index * 50}% top` }}
    />
  );
}
