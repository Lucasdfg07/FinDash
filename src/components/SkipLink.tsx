/**
 * Skip Link Component
 * Allows keyboard users to skip to main content
 * WCAG 2.1 AA requirement for accessibility
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="absolute left-[-9999px] focus:left-0 focus:top-0 focus:z-50 bg-[var(--accent-color)] text-white px-4 py-2 rounded"
    >
      Pular para conteúdo principal
    </a>
  );
}
