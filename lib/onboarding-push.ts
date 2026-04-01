/**
 * Onboarding push service
 *
 * Attempts to push each config answer from steps 6–9 to the Mews Connector API.
 * All 6 endpoints are proposed new endpoints — they do not yet exist.
 * Each push attempt returns a PushResult with status 'staged' + the prepared payload,
 * so the data is ready to wire up the moment Mews confirms the endpoints.
 */

import type { OnboardingSession } from '@prisma/client';
import type { OnboardingAnswers, PushResult } from '@/types/onboarding';
import { buildMewsAuth, mewsEndpoint } from '@/lib/mews-api';

export async function pushOnboardingSession(
  session: OnboardingSession,
  accessToken: string,
): Promise<PushResult[]> {
  if (!session.answers) return [];

  const answers = session.answers as unknown as OnboardingAnswers;
  const auth = buildMewsAuth(accessToken);
  const results: PushResult[] = [];

  // ── 1. Cancellation policies ──────────────────────────────────────────────
  const cancelPolicies = answers.policies?.cancellationPolicies ?? [];
  if (cancelPolicies.length > 0) {
    const payload = {
      ...auth,
      CancellationPolicies: cancelPolicies.map((cp) => ({
        RateId: null, // resolved after Excel import creates rates
        ApplicabilityType: 'Creation',
        Penalty: cp.penaltyType === 'None'
          ? { Absolute: { Value: 0, CurrencyCode: null } }
          : cp.penaltyType === 'Percentage'
          ? { Relative: { Value: (cp.penaltyValue ?? 0) / 100 } }
          : cp.penaltyType === 'FirstNight'
          ? { Absolute: { Value: null, CurrencyCode: null, FirstNight: true } }
          : { Absolute: { Value: null, CurrencyCode: null, FullStay: true } },
        FlatFeeModifier: null,
        Description: { 'en-US': cp.description ?? '' },
        CancellationOffsetDays: Math.floor((cp.freeCancellationHours ?? 0) / 24),
        CancellationOffsetInterval: 'BeforeStart',
        CancellationOffsetMinutes: 0,
        RateGroupName: cp.rateGroupName,
      })),
    };

    results.push({
      item: `Cancellation policies (${cancelPolicies.length} rate group${cancelPolicies.length > 1 ? 's' : ''})`,
      status: 'staged',
      endpointNote: 'POST /connector/v1/cancellationPolicies/add — proposed endpoint',
      payload,
    });
  }

  // ── 2. City tax product ───────────────────────────────────────────────────
  const cityTax = answers.taxes?.cityTax;
  if (cityTax?.exists) {
    const payload = {
      ...auth,
      Products: [
        {
          ServiceId: null, // resolved after Excel import
          CategoryId: null,
          Names: { 'en-US': cityTax.name ?? 'City Tax' },
          ShortNames: { 'en-US': cityTax.name ?? 'City Tax' },
          Descriptions: {
            'en-US': cityTax.exemptions
              ? `Municipal tourist tax. Exemptions: ${cityTax.exemptions}`
              : 'Municipal tourist tax',
          },
          Charging: cityTax.calculationBase === 'PerRoomPerNight'
            ? 'PerTimeUnit'
            : 'PerPersonPerTimeUnit',
          Pricing: {
            Discriminator: 'Absolute',
            Value: { Amount: cityTax.amount ?? 0, CurrencyCode: null },
          },
          IsActive: true,
        },
      ],
    };

    results.push({
      item: `City tax product (${cityTax.name ?? 'City Tax'}, ${cityTax.amount ?? '?'} ${cityTax.calculationBase ?? ''})`,
      status: 'staged',
      endpointNote: 'POST /connector/v1/products/add — proposed endpoint',
      payload,
    });
  }

  // ── 3. Payment settings ───────────────────────────────────────────────────
  const policies = answers.policies;
  if (policies?.acceptedPaymentMethods?.length || policies?.autoChargeRule) {
    const methodMap: Record<string, string> = {
      Visa: 'CreditCard',
      Mastercard: 'CreditCard',
      Amex: 'CreditCard',
      SEPA: 'BankTransfer',
      BankTransfer: 'BankTransfer',
      Cash: 'Cash',
    };
    const mewsMethods = Array.from(
      new Set(
        (policies.acceptedPaymentMethods ?? []).map((m) => methodMap[m] ?? m),
      ),
    );

    const payload = {
      ...auth,
      AcceptedPaymentMethods: mewsMethods,
      AutoChargeRule: policies.autoChargeRule
        ? { Discriminator: policies.autoChargeRule, Value: null }
        : null,
    };

    results.push({
      item: `Payment settings (${mewsMethods.join(', ') || 'none'})`,
      status: 'staged',
      endpointNote: 'POST /connector/v1/enterprises/updatePaymentSettings — proposed endpoint',
      payload,
    });
  }

  // ── 4. IBE / Booking Engine settings ─────────────────────────────────────
  const gj = answers.guestJourney;
  if (gj?.ibeCardRequirement || gj?.ibeLanguage || gj?.ibeBrandColor) {
    const payload = {
      ...auth,
      ServiceId: null, // resolved after Excel import
      DefaultLanguageCode: gj.ibeLanguage ?? 'en-US',
      BrandColor: gj.ibeBrandColor ?? null,
      CardRequirement: gj.ibeCardRequirement
        ? { Discriminator: gj.ibeCardRequirement, Value: null }
        : null,
      IsEnabled: true,
    };

    results.push({
      item: `IBE / Booking Engine settings`,
      status: 'staged',
      endpointNote: 'POST /connector/v1/services/updateBookingEngine — proposed endpoint',
      payload,
    });
  }

  // ── 5. Legal content (T&C and Privacy URLs) ───────────────────────────────
  if (gj?.termsUrl || gj?.privacyUrl) {
    const payload = {
      ...auth,
      ServiceId: null, // resolved after Excel import
      TermsAndConditionsUrl: gj.termsUrl ? { 'en-US': gj.termsUrl } : null,
      PrivacyPolicyUrl: gj.privacyUrl ? { 'en-US': gj.privacyUrl } : null,
    };

    results.push({
      item: `Legal URLs (T&C + Privacy Policy)`,
      status: 'staged',
      endpointNote: 'POST /connector/v1/services/updateLegalContent — proposed endpoint',
      payload,
    });
  }

  // ── 6. Users ──────────────────────────────────────────────────────────────
  const users = gj?.users ?? [];
  if (users.length > 0) {
    const payload = {
      ...auth,
      Users: users.map((u) => ({
        Email: u.email,
        FirstName: u.firstName,
        LastName: u.lastName,
        RoleIds: null, // resolved after role lookup
        Role: u.role,
        SendInvitation: true,
      })),
    };

    results.push({
      item: `Users (${users.length} user${users.length > 1 ? 's' : ''})`,
      status: 'staged',
      endpointNote: 'POST /connector/v1/enterprises/addUser — proposed endpoint',
      payload,
    });
  }

  // If nothing was staged, note that
  if (results.length === 0) {
    results.push({
      item: 'No config answers to push',
      status: 'staged',
      endpointNote: 'Complete steps 6–9 to generate push payloads',
    });
  }

  // Attempt existing endpoints where applicable
  // (none of the 6 above exist yet — all staged)
  // Future: when endpoints are confirmed, replace 'staged' with actual HTTP calls here.
  void mewsEndpoint; // referenced to avoid unused import warning

  return results;
}
