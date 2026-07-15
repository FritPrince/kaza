'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

/**
 * Navigation as a magazine table of contents: deep forest chrome, sections
 * named like rubrics, the active entry marked by a clay tab.
 */
const SECTIONS: Array<{ label: string; items: Array<{ href: string; label: string }> }> = [
  {
    label: 'Pilotage',
    items: [
      { href: '/', label: 'Économie' },
      { href: '/users', label: 'Utilisateurs' },
    ],
  },
  {
    label: 'Contenu',
    items: [
      { href: '/moderation', label: 'Modération' },
      { href: '/settings', label: 'Configuration' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-forest-deep text-paper">
      <div className="px-6 pb-8 pt-7">
        <Link href="/" className="font-display text-2xl font-semibold tracking-tight">
          Kaza
        </Link>
        <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-sand-deep">Back-office</p>
      </div>

      <nav className="flex-1 space-y-7 px-3">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-3 pb-2 text-[11px] uppercase tracking-[0.18em] text-forest-soft">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'relative block rounded px-3 py-2 text-sm transition-colors',
                        active
                          ? 'bg-forest text-paper before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-clay-soft'
                          : 'text-sand hover:bg-forest hover:text-paper',
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-forest px-6 py-4 text-xs text-forest-soft">
        v0.1.0 — usage interne
      </div>
    </aside>
  );
}
