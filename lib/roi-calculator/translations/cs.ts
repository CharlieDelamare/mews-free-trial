import type { TranslationDictionary } from '../types/translations';

const cs: TranslationDictionary = {
  labels: {
    totalAnnualImpact: 'celkový roční dopad',
    costSavings: 'úspora nákladů',
    revenueUplift: 'nárůst příjmů',
    hoursReclaimed: 'získané hodiny',
    annualImpact: 'roční dopad',
    impactSummary: 'Souhrn dopadu',
    hrs: 'hod',
    perYear: 'ročně',
    annualRevenueGain: 'Roční nárůst příjmů',
    laborCostSavings: 'Úspora mzdových nákladů',
    timeSaved: 'Ušetřený čas',
    revpar: 'RevPAR',
    rooms: 'Pokoje',
    revenueUpliftPercent: 'Nárůst příjmů',
    exportRoiReport: 'Exportovat ROI report',
    chooseSections: 'Vyberte sekce, které chcete zahrnout do PDF',
    selectAtLeastOne: 'Vyberte alespoň jednu sekci pro export.',
    cancel: 'Zrušit',
    exportPdf: 'Exportovat PDF',
    generating: 'Generování...',
  },

  modules: {
    guestExperience: 'Zážitek hostů',
    payment: 'Platby a fakturace',
    rms: 'Revenue management',
  },

  levers: {
    checkIn: 'Efektivita check-inu',
    roomAssignment: 'Přiřazení pokojů',
    upsell: 'Upselling na portálu',
    directBooking: 'Přímé rezervace',
    tokenization: 'Tokenizace',
    chargeback: 'Snížení chargebacků',
    reconciliation: 'Rekonciliace',
    noShow: 'Ochrana proti neúčasti',
    multiCurrency: 'Více měn',
    revenueUplift: 'Nárůst příjmů',
    rateAutomation: 'Automatizace sazeb',
  },

  pdfLevers: {
    checkInAutomation: 'Automatizace check-inu a check-outu',
    roomAssignment: 'Automatické přiřazení pokojů',
    guestPortalUpselling: 'Upselling přes portál pro hosty',
    directBookingCommission: 'Přímé rezervace a ušetřené provize',
    paymentTokenization: 'Tokenizace plateb',
    chargebackReduction: 'Snížení chargebacků',
    autoReconciliation: 'Automatická rekonciliace',
    noShowFeeCapture: 'Účtování poplatků za neúčast',
    multiCurrencyRevenue: 'Příjmy z více měn',
    dynamicPricingUplift: 'Nárůst příjmů z dynamického cenotvorby',
    rateUpdateAutomation: 'Automatizace aktualizace sazeb',
  },

  leverResultType: {
    timeReclaimed: 'získaný čas',
    costSaving: 'úspora',
    revenueUplift: 'příjmy',
  },

  subtexts: {
    costSavingsSubtext: 'Z automatizovaného check-inu, zpracování plateb a rekonciliace',
    revenueUpliftSubtext: 'Z dynamické cenotvorby, upsellingu hostů, přímých rezervací a vymáhání neúčastí',
    hoursReclaimedSubtext: 'Čas recepce, back office a revenue managementu vrácený vašemu týmu',
  },

  narratives: {
    titleSlideNarrative: ({ costSavings, revenueUplift, totalTime }) =>
      `Váš hotel ušetří ${costSavings} díky automatizaci, získá ${revenueUplift} na nových příjmech a uvolní ${totalTime} hodin práce zaměstnanců — každý rok.`,

    guestExperienceNarrative: ({ active, val }) => {
      const parts: string[] = [];
      parts.push('Mews promění vaši recepci z úzkého místa v bezproblémový kontaktní bod s hosty.');
      if (active('checkIn')) {
        parts.push('Digitální check-in a check-out uvolní váš tým, aby se mohl věnovat pohostinnosti místo papírování.');
      }
      if (active('roomAssignment')) {
        parts.push('Automatické přiřazení pokojů eliminuje každodenní časově náročný úkol pro vaši recepci.');
      }
      if (active('upsell')) {
        parts.push(`Portál pro hosty vytváří ${val('upsell')} nových příjmů prostřednictvím personalizovaných nabídek upsellingu během rezervačního procesu.`);
      }
      if (active('directBooking')) {
        parts.push(`Zvýšením počtu přímých rezervací snižujete závislost na OTA a ušetříte ${val('directBooking')} ročně navíc.`);
      }
      return parts.join(' ');
    },

    paymentNarrative: ({ active, val }) => {
      const parts: string[] = [];
      parts.push('Mews Payments eliminuje ruční zpracování plateb — váš finanční tým tráví méně času administrativou a více času strategickými rozhodnutími.');
      if (active('tokenization')) {
        parts.push('Bezpečná tokenizace automatizuje zpracování transakcí a šetří vašemu týmu hodiny opakující se práce.');
      }
      if (active('reconciliation')) {
        parts.push(`Automatická rekonciliace nahrazuje ruční párování a šetří ${val('reconciliation')} na mzdových nákladech.`);
      }
      if (active('chargeback')) {
        parts.push(`Integrovaná prevence podvodů výrazně snižuje chargebacky a šetří ${val('chargeback')} ročně.`);
      }
      if (active('noShow')) {
        parts.push(`Automatické záruky kartou na účtu zachytí ${val('noShow')} na poplatcích za neúčast, které byste jinak odepsali.`);
      }
      if (active('multiCurrency')) {
        parts.push('Podpora více měn umožňuje zahraničním hostům platit v jejich vlastní měně, odstraňuje bariéry a otevírá dodatečné příjmy.');
      }
      return parts.join(' ');
    },

    rmsNarrative: ({ active, val }) => {
      const parts: string[] = [];
      if (active('revenueUplift')) {
        parts.push(`Mews RMS nahrazuje odhady dynamickou cenotvorbou řízenou umělou inteligencí, která reaguje na tržní podmínky v reálném čase — nepřetržitý optimalizační engine přinášející ${val('revenueUplift')} na dodatečném RevPAR.`);
      }
      if (active('rateAutomation')) {
        parts.push(`Automatická distribuce přes všechny cenové plány a kanály eliminuje hodiny ručních aktualizací, šetří ${val('rateAutomation')} na mzdových nákladech a umožňuje vašemu týmu soustředit se na strategii místo tabulek.`);
      }
      return parts.join(' ');
    },

    rmsManagerNote: (hasManager) =>
      hasManager
        ? 'Váš revenue manažer se může soustředit na strategii a tržní pozicování místo tabulek.'
        : 'Získáváte optimalizaci příjmů na podnikové úrovni bez potřeby dedikovaného revenue manažera — umělá inteligence řídí cenotvorbu nepřetržitě.',

    summaryNarrative: ({ moduleCount, costSavings, revenueUplift, totalTime }) =>
      `V ${moduleCount} modul${moduleCount > 1 ? 'ech' : 'u'} Mews přináší ${costSavings} v úspoře nákladů a ${revenueUplift} na nových příjmech — a zároveň uvolňuje ${totalTime} hodin práce zaměstnanců ročně.`,

    pdfGuestExperienceNarrative: ({ upsellRevenue, commissionSaved, formatCurrency }) => {
      let text = 'Mews promění vaši recepci z úzkého místa v bezproblémový kontaktní bod s hosty. Digitální check-in a check-out uvolní váš tým, aby se mohl věnovat pohostinnosti místo papírování, a automatické přiřazení pokojů eliminuje každodenní časově náročný úkol.';
      if (upsellRevenue > 0) {
        text += ` Portál pro hosty vytváří ${formatCurrency(upsellRevenue)} nových příjmů prostřednictvím personalizovaných nabídek upsellingu během rezervačního procesu.`;
      }
      if (commissionSaved > 0) {
        text += ` Zvýšením počtu přímých rezervací snižujete závislost na OTA a ušetříte ${formatCurrency(commissionSaved)} ročně navíc.`;
      }
      return text;
    },

    pdfPaymentNarrative: ({ reconciliationCostSavings, chargebackReduction, chargebackRate, mewsChargebackRate, noShowRevenue, multiCurrencyRevenue, formatCurrency }) => {
      let text = 'Mews Payments eliminuje ruční zpracování plateb — váš finanční tým tráví méně času administrativou a více času strategickými rozhodnutími. Bezpečná tokenizace automatizuje zpracování transakcí a šetří vašemu týmu hodiny opakující se práce.';
      if (reconciliationCostSavings > 0) {
        text += ` Automatická rekonciliace nahrazuje každodenní ruční párování a šetří ${formatCurrency(reconciliationCostSavings)} na mzdových nákladech.`;
      }
      if (chargebackReduction > 0) {
        text += ` Integrovaná prevence podvodů snižuje míru chargebacků z ${chargebackRate} % na ${mewsChargebackRate} % a šetří ${formatCurrency(chargebackReduction)} ročně.`;
      }
      if (noShowRevenue > 0) {
        text += ` Automatické záruky kartou na účtu zachytí ${formatCurrency(noShowRevenue)} na poplatcích za neúčast, které byste jinak odepsali.`;
      }
      if (multiCurrencyRevenue > 0) {
        text += ` Podpora více měn umožňuje zahraničním hostům platit v jejich vlastní měně, odstraňuje bariéry a přináší ${formatCurrency(multiCurrencyRevenue)} dodatečných příjmů.`;
      }
      return text;
    },

    pdfRmsNarrative: ({ annualRevenueGain, annualHoursSaved, annualLaborCostSavings, numberOfRooms, hasRevenueManager, hasExistingRMS, formatCurrency }) => {
      let text = `Mews RMS nahrazuje odhady dynamickou cenotvorbou řízenou umělou inteligencí, která reaguje na tržní podmínky v reálném čase — nepřetržitý optimalizační engine přinášející ${formatCurrency(annualRevenueGain)} na dodatečném RevPAR napříč vašimi ${numberOfRooms} pokoji.`;
      if (annualHoursSaved > 0) {
        text += ` Automatická distribuce přes všechny cenové plány a kanály eliminuje hodiny ručních aktualizací a šetří ${formatCurrency(annualLaborCostSavings)} na mzdových nákladech.`;
      }
      text += hasRevenueManager
        ? ' Váš revenue manažer se může soustředit na strategii a tržní pozicování místo tabulek.'
        : ' Získáváte optimalizaci příjmů na podnikové úrovni bez potřeby dedikovaného revenue manažera — umělá inteligence řídí cenotvorbu nepřetržitě.';
      return text;
    },
  },

  slideFooter: 'Mews ROI Report',

  formulas: {
    checkIn: (p) => `${p.annualRes} rezervací/rok x (${p.checkInSaved} check-in + ${p.checkOutSaved} check-out ušetřeno) / 60 = ${p.totalHours} hod/rok`,
    roomAssignment: (p) => `${p.annualRes} rezervací/rok x ${p.assignTime}/rezervaci / 60 = ${p.totalHours} hod/rok`,
    upsell: (p) => `${p.annualRes} rezervací/rok x ${p.cs}${p.adr} ADR x ${p.onlineCheckIn}% online check-in x ${p.uplift}% nárůst = ${p.total}`,
    directBooking: (p) => `${p.annualRes} rezervací/rok x ${p.directIncrease}% více přímých x ${p.cs}${p.adr} ADR x ${p.commission}% provize = ${p.total}`,
    tokenization: (p) => `${p.annualRes} rezervací/rok x ${p.seconds}s na transakci / 3 600 = ${p.totalHours} hod/rok`,
    chargeback: (p) => `(${p.currentRate}% - ${p.mewsRate}%) snížení x ${p.cs}${p.costPerMonth}/měs x 12 = ${p.total}`,
    reconciliation: (p) => `(${p.currentDaily} - ${p.mewsDaily}) hod/den x 365 dní = ${p.totalHours} hod/rok`,
    noShow: (p) => `${p.cs}${p.monthlyRev}/měs x 12 x ${p.noShowRate}% neúčast x ${p.uncollectedFees}% nevybrané poplatky = ${p.total}`,
    multiCurrency: (p) => `${p.cs}${p.monthlyRev}/měs x 12 x ${p.foreignPercent}% zahraniční x ${p.adoption}% adopce x ${p.share}% podíl = ${p.total}`,
    revenueUplift: (p) => `${p.cs}${p.revpar} RevPAR x ${p.upliftPercent}% nárůst = ${p.cs}${p.revparUplift}/pokoj/noc x ${p.rooms} pokojů x 365 dní = ${p.total}`,
    rateAutomation: (p) => `${p.updatesPerWeek} aktualizací/týden x 52 týdnů x ${p.ratePlans} plánů x ${p.channels} kanálů x ${p.updateTime} min / 60 = ${p.totalHours} hod/rok`,
  },
};

export default cs;
