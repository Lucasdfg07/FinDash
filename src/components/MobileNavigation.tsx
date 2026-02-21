'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Home,
  Settings,
  TrendingUp,
  Wallet,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/transacoes', label: 'Transações', icon: Wallet },
  { href: '/analytics', label: 'Analytics', icon: TrendingUp },
  { href: '/custos-fixos', label: 'Custos', icon: BarChart3 },
  { href: '/configuracoes', label: 'Config', icon: Settings },
];

export function MobileNavigation() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session?.user) {
    return null;
  }

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Bottom Navigation Bar - always visible on mobile */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] md:hidden"
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex justify-around">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors ${
                isActive(href)
                  ? 'text-[var(--accent-color)] border-t-2 border-[var(--accent-color)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              aria-current={isActive(href) ? 'page' : undefined}
              title={label}
            >
              <Icon size={24} className="mb-1" />
              <span className="text-xs font-medium truncate">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Padding for fixed bottom nav */}
      <div className="h-20 md:hidden" />

      {/* Desktop Navigation - hidden on mobile */}
      <nav
        className="hidden md:flex md:flex-col md:gap-2 bg-[var(--bg-secondary)] p-4 rounded-lg"
        role="navigation"
        aria-label="Main navigation"
      >
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              isActive(href)
                ? 'bg-[var(--accent-color)] text-white'
                : 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
            }`}
            aria-current={isActive(href) ? 'page' : undefined}
          >
            <Icon size={20} />
            <span className="font-medium">{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
