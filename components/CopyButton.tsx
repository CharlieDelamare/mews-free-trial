'use client';

import { useToast } from './Toast';

interface CopyButtonProps {
  text: string;
  label?: string;
  toastMessage?: string;
  className?: string;
}

export function CopyButton({ text, label = 'Copy', toastMessage = 'Copied!', className }: CopyButtonProps) {
  const { showToast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    showToast(toastMessage);
  };

  return (
    <button
      onClick={handleCopy}
      className={className || 'text-primary-600 hover:text-primary-700 text-sm font-medium px-3 py-1.5 rounded hover:bg-primary-50 transition-colors'}
    >
      {label}
    </button>
  );
}
