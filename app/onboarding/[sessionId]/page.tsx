'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { WizardShell } from '@/components/onboarding/WizardShell';
import { Step1Upload } from '@/components/onboarding/steps/Step1Upload';
import { Step2Property } from '@/components/onboarding/steps/Step2Property';
import { Step3Rooms } from '@/components/onboarding/steps/Step3Rooms';
import { Step4Services } from '@/components/onboarding/steps/Step4Services';
import { Step5Rates } from '@/components/onboarding/steps/Step5Rates';
import { Step5Accounting } from '@/components/onboarding/steps/Step5Accounting';
import { Step6Distribution } from '@/components/onboarding/steps/Step6Distribution';
import { Step7Policies } from '@/components/onboarding/steps/Step7Policies';
import { Step8Taxes } from '@/components/onboarding/steps/Step8Taxes';
import { Step9GuestJourney } from '@/components/onboarding/steps/Step9GuestJourney';
import { Step10Connect } from '@/components/onboarding/steps/Step10Connect';

import type {
  OnboardingSessionData,
  ExcelData,
  OnboardingAnswers,
  ParametersData,
  GeneralQuestionsData,
  ResourceCategory,
  Resource,
  ResourceFeature,
  BookableService,
  ProductCategory,
  BookableProduct,
  AdditionalService,
  AdditionalProduct,
  BusinessSegment,
  Department,
  RateGroup,
  BaseRate,
  DerivedRate,
  RatePrice,
  AccountingCategory,
  DistributionAnswers,
  PolicyAnswers,
  TaxAnswers,
  GuestJourneyAnswers,
} from '@/types/onboarding';
import type { ParseSummary } from '@/lib/onboarding-excel';

// Empty defaults
const EMPTY_EXCEL: ExcelData = {
  generalQuestions: {},
  resourceCategories: [],
  resources: [],
  resourceFeatures: [],
  bookableServices: [],
  bookableProductCategories: [],
  bookableProducts: [],
  additionalServices: [],
  additionalProductCategories: [],
  additionalProducts: [],
  businessSegments: [],
  departments: [],
  rateGroups: [],
  baseRates: [],
  derivedRates: [],
  ratePrices: [],
  accountingCategories: [],
  translations: [],
  tasks: [],
  parameters: {
    propertyTypes: [],
    pricingModes: [],
    spaceTypes: [],
    classifications: [],
    rateTypes: [],
    productTypes: [],
    consumptionMoments: [],
    countryCodes: [],
    reservationStrategies: [],
    availabilityStrategies: [],
    reservationPurposes: [],
  },
};

export default function OnboardingWizardPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<OnboardingSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Local mutable copies of excel + answers (held in refs to avoid stale closure in save)
  const excelRef = useRef<ExcelData>(EMPTY_EXCEL);
  const answersRef = useRef<OnboardingAnswers>({});
  const [excel, setExcelState] = useState<ExcelData>(EMPTY_EXCEL);
  const [answers, setAnswersState] = useState<OnboardingAnswers>({});
  const [uploadSummary, setUploadSummary] = useState<ParseSummary | null>(null);

  // Keep refs in sync
  const setExcel = (data: ExcelData) => {
    excelRef.current = data;
    setExcelState(data);
  };
  const setAnswers = (data: OnboardingAnswers) => {
    answersRef.current = data;
    setAnswersState(data);
  };

  // Load session
  useEffect(() => {
    fetch(`/api/onboarding/sessions/${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSession(data.session);
          if (data.session.excelData) {
            const ed = data.session.excelData as ExcelData;
            setExcel(ed);
            setUploadSummary({
              propertyName: ed.generalQuestions.name,
              roomCount: ed.resources.length,
              categoryCount: ed.resourceCategories.length,
              rateCount: ed.baseRates.length + ed.derivedRates.length,
              productCount: ed.bookableProducts.length + ed.additionalProducts.length,
              serviceCount: ed.bookableServices.length + ed.additionalServices.length,
            });
          }
          if (data.session.answers) {
            setAnswers(data.session.answers as OnboardingAnswers);
          }
        } else {
          router.push('/onboarding');
        }
      })
      .catch(() => router.push('/onboarding'))
      .finally(() => setIsLoading(false));
  }, [sessionId, router]);

  const save = useCallback(
    async (step?: number): Promise<boolean> => {
      if (!session) return false;
      setIsSaving(true);
      try {
        const res = await fetch(`/api/onboarding/sessions/${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            excelData: excelRef.current,
            answers: answersRef.current,
            propertyName: excelRef.current.generalQuestions.name ?? null,
            ...(step !== undefined && { currentStep: step }),
          }),
        });
        const data = await res.json();
        if (data.success) {
          setSession(data.session);
          setLastSaved(new Date());
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [session, sessionId],
  );

  const goToStep = useCallback(
    async (targetStep: number) => {
      await save(targetStep);
    },
    [save],
  );

  const handleNext = async () => {
    if (!session) return;
    const nextStep = Math.min(session.currentStep + 1, 10);
    await goToStep(nextStep);
  };

  const handleBack = async () => {
    if (!session) return;
    const prevStep = Math.max(session.currentStep - 1, 0);
    await goToStep(prevStep);
  };

  if (isLoading || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--mews-cream)]">
        <div className="text-sm text-gray-400 animate-pulse">Loading session…</div>
      </div>
    );
  }

  const currentStep = session.currentStep;
  const params2 = excel.parameters as ParametersData;

  const stepContent = (() => {
    switch (currentStep) {
      case 0:
        return (
          <Step1Upload
            sessionId={sessionId}
            summary={uploadSummary}
            onFileUploaded={(newId, summary) => {
              // If a new session was created during file upload, redirect to it
              if (newId !== sessionId) {
                router.push(`/onboarding/${newId}`);
                return;
              }
              setUploadSummary(summary);
            }}
            onStartEmpty={() => handleNext()}
            onResetSummary={() => setUploadSummary(null)}
          />
        );
      case 1:
        return (
          <Step2Property
            data={excel.generalQuestions as GeneralQuestionsData}
            parameters={params2}
            onChange={(d) => setExcel({ ...excel, generalQuestions: d })}
          />
        );
      case 2:
        return (
          <Step3Rooms
            categories={excel.resourceCategories as ResourceCategory[]}
            resources={excel.resources as Resource[]}
            features={excel.resourceFeatures as ResourceFeature[]}
            parameters={params2}
            onChange={({ categories, resources, features }) => {
              setExcel({
                ...excel,
                ...(categories !== undefined && { resourceCategories: categories }),
                ...(resources !== undefined && { resources }),
                ...(features !== undefined && { resourceFeatures: features }),
              });
            }}
          />
        );
      case 3:
        return (
          <Step4Services
            bookableServices={excel.bookableServices as BookableService[]}
            bookableProductCategories={excel.bookableProductCategories as ProductCategory[]}
            bookableProducts={excel.bookableProducts as BookableProduct[]}
            additionalServices={excel.additionalServices as AdditionalService[]}
            additionalProductCategories={excel.additionalProductCategories as ProductCategory[]}
            additionalProducts={excel.additionalProducts as AdditionalProduct[]}
            parameters={params2}
            onChange={(update) => setExcel({ ...excel, ...update })}
          />
        );
      case 4:
        return (
          <Step5Rates
            rateGroups={excel.rateGroups as RateGroup[]}
            baseRates={excel.baseRates as BaseRate[]}
            derivedRates={excel.derivedRates as DerivedRate[]}
            ratePrices={excel.ratePrices as RatePrice[]}
            parameters={params2}
            onChange={(update) => setExcel({ ...excel, ...update })}
          />
        );
      case 5:
        return (
          <Step5Accounting
            accountingCategories={excel.accountingCategories as AccountingCategory[]}
            businessSegments={excel.businessSegments as BusinessSegment[]}
            departments={excel.departments as Department[]}
            onChange={(update) => setExcel({ ...excel, ...update })}
          />
        );
      case 6:
        return (
          <Step6Distribution
            answers={(answers.distribution ?? {}) as DistributionAnswers}
            onChange={(d) => setAnswers({ ...answers, distribution: d })}
          />
        );
      case 7:
        return (
          <Step7Policies
            answers={(answers.policies ?? {}) as PolicyAnswers}
            rateGroups={excel.rateGroups as RateGroup[]}
            onChange={(p) => setAnswers({ ...answers, policies: p })}
          />
        );
      case 8:
        return (
          <Step8Taxes
            answers={(answers.taxes ?? {}) as TaxAnswers}
            accountingCategories={excel.accountingCategories as AccountingCategory[]}
            onChange={(t) => setAnswers({ ...answers, taxes: t })}
            onAccountingCategoriesChange={(rows) =>
              setExcel({ ...excel, accountingCategories: rows })
            }
          />
        );
      case 9:
        return (
          <Step9GuestJourney
            answers={(answers.guestJourney ?? {}) as GuestJourneyAnswers}
            onChange={(g) => setAnswers({ ...answers, guestJourney: g })}
          />
        );
      case 10:
        return (
          <Step10Connect
            session={session}
            onSessionUpdated={(s) => setSession(s)}
          />
        );
      default:
        return null;
    }
  })();

  return (
    <WizardShell
      currentStep={currentStep}
      sessionId={sessionId}
      isSaving={isSaving}
      lastSaved={lastSaved}
      onBack={handleBack}
      onNext={handleNext}
      onStepClick={goToStep}
      isLastStep={currentStep === 10}
    >
      {stepContent}
    </WizardShell>
  );
}
