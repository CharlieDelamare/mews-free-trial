import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { deserializeState } from '@/lib/roi-calculator/utils/persistence';
import ROIStage from '@/components/roi-calculator/ROIStage';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const presentation = await prisma.roiPresentation.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: presentation ? `${presentation.name} — Mews ROI` : 'ROI Calculator' };
}

export default async function PresentationPage({ params }: Props) {
  const { id } = await params;

  const presentation = await prisma.roiPresentation.findUnique({ where: { id } });
  if (!presentation) notFound();

  const initialState = deserializeState(presentation.stateJson) ?? undefined;

  return <ROIStage presentationId={id} initialState={initialState} />;
}
