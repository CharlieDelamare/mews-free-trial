import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatDistanceToNow } from 'date-fns';
import { Plus, ArrowRight, TrendingUp } from 'lucide-react';

export const metadata = { title: 'Business Case Presentations — Mews ROI' };

// TODO: always renders USD ($). To support per-presentation currencies, add a
// currencySymbol column to RoiPresentation and populate it from extractMetadata.
function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}k`;
  return `$${Math.round(amount)}`;
}

export default async function ROICalculatorDashboard() {
  const presentations = await prisma.roiPresentation.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      country: true,
      hotelType: true,
      numberOfRooms: true,
      totalAnnualSavings: true,
      updatedAt: true,
    },
  });

  return (
    <div className="min-h-screen bg-[--mews-linen] p-6 lg:p-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-3xl font-bold text-[--mews-night-black]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Business Case Presentations
            </h1>
            <p
              className="text-[--mews-night-black]/50 mt-1"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {presentations.length === 0
                ? 'No presentations yet'
                : `${presentations.length} presentation${presentations.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <Link
            href="/roi-calculator/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[--mews-night-black] text-white text-sm font-medium hover:bg-[--mews-deep-blue] transition-colors"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <Plus className="w-4 h-4" /> Create New
          </Link>
        </div>

        {/* Empty state */}
        {presentations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[--mews-blue] flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-[--mews-night-black]" />
            </div>
            <h2
              className="text-xl font-semibold text-[--mews-night-black] mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              No presentations yet
            </h2>
            <p
              className="text-[--mews-night-black]/50 mb-6 max-w-sm"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Build a tailored business case for a prospect in minutes.
            </p>
            <Link
              href="/roi-calculator/new"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[--mews-night-black] text-white text-sm font-medium hover:bg-[--mews-deep-blue] transition-colors"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <Plus className="w-4 h-4" /> Create your first presentation
            </Link>
          </div>
        )}

        {/* Presentations table */}
        {presentations.length > 0 && (
          <div className="rounded-2xl border border-[--mews-night-black]/10 bg-white overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[--mews-night-black]/8">
                  <th className="text-left px-6 py-3.5 text-xs font-medium text-[--mews-night-black]/50 uppercase tracking-wide" style={{ fontFamily: 'var(--font-body)' }}>Name</th>
                  <th className="text-left px-6 py-3.5 text-xs font-medium text-[--mews-night-black]/50 uppercase tracking-wide hidden sm:table-cell" style={{ fontFamily: 'var(--font-body)' }}>Type · Country</th>
                  <th className="text-right px-6 py-3.5 text-xs font-medium text-[--mews-night-black]/50 uppercase tracking-wide hidden md:table-cell" style={{ fontFamily: 'var(--font-body)' }}>Rooms</th>
                  <th className="text-right px-6 py-3.5 text-xs font-medium text-[--mews-night-black]/50 uppercase tracking-wide" style={{ fontFamily: 'var(--font-body)' }}>Annual Savings</th>
                  <th className="text-right px-6 py-3.5 text-xs font-medium text-[--mews-night-black]/50 uppercase tracking-wide hidden lg:table-cell" style={{ fontFamily: 'var(--font-body)' }}>Updated</th>
                  <th className="px-6 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {presentations.map((p) => (
                  <tr key={p.id} className="border-b border-[--mews-night-black]/6 last:border-0 hover:bg-[--mews-linen]/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium text-[--mews-night-black] text-sm" style={{ fontFamily: 'var(--font-body)' }}>{p.name}</span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="text-sm text-[--mews-night-black]/60" style={{ fontFamily: 'var(--font-body)' }}>
                        {p.hotelType} · {p.country}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right hidden md:table-cell">
                      <span className="text-sm text-[--mews-night-black]/60" style={{ fontFamily: 'var(--font-body)' }}>{p.numberOfRooms}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-[--mews-night-black]" style={{ fontFamily: 'var(--font-data-small)' }}>
                        {p.totalAnnualSavings > 0 ? formatCurrency(p.totalAnnualSavings) : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right hidden lg:table-cell">
                      <span className="text-sm text-[--mews-night-black]/40" style={{ fontFamily: 'var(--font-body)' }}>
                        {formatDistanceToNow(p.updatedAt, { addSuffix: true })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/roi-calculator/${p.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[--mews-night-black]/15 text-xs font-medium text-[--mews-night-black] hover:bg-[--mews-night-black] hover:text-white hover:border-[--mews-night-black] transition-colors"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        View <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
