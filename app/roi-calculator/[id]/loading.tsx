export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ backgroundColor: 'var(--mews-cream)' }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 rounded-full animate-spin"
          style={{
            border: '4px solid var(--mews-primary-pink)',
            borderTopColor: 'transparent',
          }}
        />
        <p className="text-lg font-semibold" style={{ color: 'var(--mews-night-black)', opacity: 0.7 }}>
          Building your ROI&hellip;
        </p>
        <p className="text-sm" style={{ color: 'var(--mews-night-black)', opacity: 0.4 }}>
          This usually takes a few seconds
        </p>
      </div>
    </div>
  );
}
