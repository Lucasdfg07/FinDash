/**
 * Accessibility utilities for WCAG 2.1 AA compliance
 * Helpers for keyboard navigation, screen readers, color contrast, etc.
 */

/**
 * Check if color contrast meets WCAG AA standards (4.5:1 for text, 3:1 for graphics)
 * @param foreground - foreground color hex (e.g., #ffffff)
 * @param background - background color hex (e.g., #000000)
 * @returns true if contrast ratio meets AA standards
 */
export function meetsContrastStandard(
  foreground: string,
  background: string
): boolean {
  const fgLuminance = getRelativeLuminance(foreground);
  const bgLuminance = getRelativeLuminance(background);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  const contrastRatio = (lighter + 0.05) / (darker + 0.05);

  // AA standard is 4.5:1 for normal text, 3:1 for large text and graphics
  return contrastRatio >= 4.5;
}

/**
 * Calculate relative luminance according to WCAG formula
 */
function getRelativeLuminance(hexColor: string): number {
  const rgb = parseInt(hexColor.slice(1), 16);
  const r = (rgb >> 16) & 255;
  const g = (rgb >> 8) & 255;
  const b = rgb & 255;

  const [rs, gs, bs] = [r, g, b].map((val) => {
    const sRGB = val / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Keyboard navigation helper - handle escape key
 */
export function useKeyboardNavigation(onEscape: () => void) {
  return (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onEscape();
    }
  };
}

/**
 * Generate accessible ARIA labels
 */
export const a11yLabels = {
  loading: 'Carregando...',
  error: 'Erro ao carregar conteúdo',
  success: 'Sucesso',
  warning: 'Aviso',
  info: 'Informação',
  close: 'Fechar',
  menu: 'Abrir menu',
  search: 'Buscar',
  filter: 'Filtros',
  sort: 'Ordenar',
  next: 'Próximo',
  previous: 'Anterior',
  noResults: 'Nenhum resultado encontrado',
} as const;

/**
 * Focus management helpers
 */
export function focusElement(selector: string) {
  const element = document.querySelector(selector) as HTMLElement;
  if (element) {
    element.focus();
  }
}

export function isFocusable(element: HTMLElement): boolean {
  const focusableElements = [
    'A',
    'BUTTON',
    'INPUT',
    'SELECT',
    'TEXTAREA',
    '[tabindex]',
  ];
  return focusableElements.some((selector) => element.matches(selector));
}

/**
 * Screen reader only text
 */
export const srOnly = {
  className:
    'absolute left-[-10000px] width-1 height-1 overflow-hidden text-black',
  props: {
    className:
      'absolute left-[-10000px] width-1 height-1 overflow-hidden text-black',
  },
};

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user has high contrast preference
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: more)').matches;
}

/**
 * Announce to screen readers using aria-live region
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}
