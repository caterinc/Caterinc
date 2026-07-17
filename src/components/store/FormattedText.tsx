// Minimal formatting for admin-written page content: *texto* renders bold.
// No HTML injection — just splits the string and wraps matched segments.
export function FormattedText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return (
    <div className={className}>
      {parts.map((part, i) =>
        part.startsWith("*") && part.endsWith("*") && part.length > 2
          ? <strong key={i}>{part.slice(1, -1)}</strong>
          : part
      )}
    </div>
  );
}
