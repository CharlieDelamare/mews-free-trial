import type { TranslationDictionary } from '../types/translations';

const fi: TranslationDictionary = {
  labels: {
    totalAnnualImpact: 'vuotuinen kokonaisvaikutus',
    costSavings: 'kustannussäästöt',
    revenueUplift: 'tuottojen kasvu',
    hoursReclaimed: 'vapautuneet tunnit',
    annualImpact: 'vuotuinen vaikutus',
    impactSummary: 'Vaikutusyhteenveto',
    hrs: 't',
    perYear: 'vuodessa',
    annualRevenueGain: 'Vuotuinen tuottolisäys',
    laborCostSavings: 'Työvoimakustannusten säästöt',
    timeSaved: 'Säästetty aika',
    revpar: 'RevPAR',
    rooms: 'Huoneet',
    revenueUpliftPercent: 'Tuottojen kasvu',
    exportRoiReport: 'Vie ROI-raportti',
    chooseSections: 'Valitse PDF-raporttiin sisällytettävät osiot',
    selectAtLeastOne: 'Valitse vähintään yksi osio vientiä varten.',
    cancel: 'Peruuta',
    exportPdf: 'Vie PDF',
    generating: 'Luodaan...',
  },

  modules: {
    guestExperience: 'Vieraskokemus',
    payment: 'Maksaminen ja laskutus',
    rms: 'Tuotonhallinta',
  },

  levers: {
    checkIn: 'Sisäänkirjautumisen tehokkuus',
    roomAssignment: 'Huonejako',
    upsell: 'Lisämyynti portaalissa',
    directBooking: 'Suoravaraus',
    tokenization: 'Tokenisointi',
    chargeback: 'Takaisinperinnän vähentäminen',
    reconciliation: 'Täsmäytys',
    noShow: 'Suoja saapumatta jättämiselle',
    multiCurrency: 'Monivaluutta',
    revenueUplift: 'Tuottojen kasvu',
    rateAutomation: 'Hinta-automaatio',
  },

  pdfLevers: {
    checkInAutomation: 'Sisään- ja uloskirjautumisen automaatio',
    roomAssignment: 'Automaattinen huonejako',
    guestPortalUpselling: 'Lisämyynti vierasportaalissa',
    directBookingCommission: 'Suoravaraukset ja säästetyt komissiot',
    paymentTokenization: 'Maksutokenisointi',
    chargebackReduction: 'Takaisinperinnän vähentäminen',
    autoReconciliation: 'Automaattinen täsmäytys',
    noShowFeeCapture: 'Saapumatta jättämisen maksujen kerääminen',
    multiCurrencyRevenue: 'Monivaluuttatuotot',
    dynamicPricingUplift: 'Dynaamisen hinnoittelun tuottolisäys',
    rateUpdateAutomation: 'Hintapäivitysten automaatio',
  },

  leverResultType: {
    timeReclaimed: 'vapautunut aika',
    costSaving: 'säästö',
    revenueUplift: 'tuotto',
  },

  subtexts: {
    costSavingsSubtext: 'Automatisoidusta sisäänkirjautumisesta, maksunkäsittelystä ja täsmäytyksestä',
    revenueUpliftSubtext: 'Dynaamisesta hinnoittelusta, lisämyynnistä, suoravarauksista ja saapumatta jättämisten perinnästä',
    hoursReclaimedSubtext: 'Vastaanoton, taustatoimintojen ja tuotonhallinnan aika palautettuna tiimillesi',
  },

  narratives: {
    titleSlideNarrative: ({ costSavings, revenueUplift, totalTime }) =>
      `Kiinteistösi säästää ${costSavings} automaation avulla, saavuttaa ${revenueUplift} uutta tuottoa ja vapauttaa ${totalTime} työtuntia — joka vuosi.`,

    guestExperienceNarrative: ({ active, val }) => {
      const parts: string[] = [];
      parts.push('Mews muuttaa vastaanottosi pullonkaulasta saumattomaksi vieraskontaktipisteeksi.');
      if (active('checkIn')) {
        parts.push('Digitaalinen sisään- ja uloskirjautuminen vapauttaa tiimisi keskittymään vieraanvaraisuuteen paperitöiden sijaan.');
      }
      if (active('roomAssignment')) {
        parts.push('Automaattinen huonejako poistaa päivittäisen aikasyöpön vastaanottotiimiltäsi.');
      }
      if (active('upsell')) {
        parts.push(`Vierasportaali tuottaa ${val('upsell')} uutta tuottoa henkilökohtaisten lisämyyntitarjousten kautta varausprosessin aikana.`);
      }
      if (active('directBooking')) {
        parts.push(`Lisäämällä suoravarausten osuutta vähennät OTA-riippuvuutta ja pidät ${val('directBooking')} enemmän vuodessa.`);
      }
      return parts.join(' ');
    },

    paymentNarrative: ({ active, val }) => {
      const parts: string[] = [];
      parts.push('Mews Payments poistaa manuaalisen maksunkäsittelyn — taloustiimisi käyttää vähemmän aikaa hallintoon ja enemmän strategisiin päätöksiin.');
      if (active('tokenization')) {
        parts.push('Turvallinen tokenisointi automatisoi tapahtumankäsittelyn ja säästää tiimiltäsi tunteja toistuvaa työtä.');
      }
      if (active('reconciliation')) {
        parts.push(`Automaattinen täsmäytys korvaa manuaalisen kohdistamisen ja vapauttaa ${val('reconciliation')} työvoimakustannuksissa.`);
      }
      if (active('chargeback')) {
        parts.push(`Sisäänrakennettu petosten esto vähentää takaisinperintöjä merkittävästi ja säästää ${val('chargeback')} vuosittain.`);
      }
      if (active('noShow')) {
        parts.push(`Automaattinen korttitakuu kerää ${val('noShow')} saapumatta jättämisen maksuissa, jotka muuten kirjattaisiin luottotappioksi.`);
      }
      if (active('multiCurrency')) {
        parts.push('Monivaluuttatuki antaa kansainvälisten vieraiden maksaa omassa valuutassaan, poistaa kitkaa ja avaa lisätuottoja.');
      }
      return parts.join(' ');
    },

    rmsNarrative: ({ active, val }) => {
      const parts: string[] = [];
      if (active('revenueUplift')) {
        parts.push(`Mews RMS korvaa arvailun tekoälypohjaisella dynaamisella hinnoittelulla, joka reagoi markkinaolosuhteisiin reaaliajassa — ympärivuorokautinen tuotonoptimointimoottori, joka tuottaa ${val('revenueUplift')} lisä-RevPARia.`);
      }
      if (active('rateAutomation')) {
        parts.push(`Automaattinen jakelu kaikkiin hintasuunnitelmiisi ja kanaviisi poistaa tuntien manuaaliset päivitykset, säästää ${val('rateAutomation')} työvoimakustannuksissa ja antaa tiimisi keskittyä strategiaan taulukkolaskennan sijaan.`);
      }
      return parts.join(' ');
    },

    rmsManagerNote: (hasManager) =>
      hasManager
        ? 'Tuottopäällikkösi voi keskittyä strategiaan ja markkina-asemointiin taulukkolaskennan sijaan.'
        : 'Saat yritystason tuotonoptimointia ilman erillistä tuottopäällikköä — tekoäly hoitaa hinnoittelun ympäri vuorokauden.',

    summaryNarrative: ({ moduleCount, costSavings, revenueUplift, totalTime }) =>
      `${moduleCount} moduuli${moduleCount > 1 ? 'n' : 'n'} kautta Mews tuottaa ${costSavings} kustannussäästöjä ja ${revenueUplift} uutta tuottoa — vapauttaen samalla ${totalTime} työtuntia vuodessa.`,

    pdfGuestExperienceNarrative: ({ upsellRevenue, commissionSaved, formatCurrency }) => {
      let text = 'Mews muuttaa vastaanottosi pullonkaulasta saumattomaksi vieraskontaktipisteeksi. Digitaalinen sisään- ja uloskirjautuminen vapauttaa tiimisi keskittymään vieraanvaraisuuteen paperitöiden sijaan, ja automaattinen huonejako poistaa päivittäisen aikasyöpön.';
      if (upsellRevenue > 0) {
        text += ` Vierasportaali tuottaa ${formatCurrency(upsellRevenue)} uutta tuottoa henkilökohtaisten lisämyyntitarjousten kautta varausprosessin aikana.`;
      }
      if (commissionSaved > 0) {
        text += ` Lisäämällä suoravarausten osuutta vähennät OTA-riippuvuutta ja pidät ${formatCurrency(commissionSaved)} enemmän vuodessa.`;
      }
      return text;
    },

    pdfPaymentNarrative: ({ reconciliationCostSavings, chargebackReduction, chargebackRate, mewsChargebackRate, noShowRevenue, multiCurrencyRevenue, formatCurrency }) => {
      let text = 'Mews Payments poistaa manuaalisen maksunkäsittelyn — taloustiimisi käyttää vähemmän aikaa hallintoon ja enemmän strategisiin päätöksiin. Turvallinen tokenisointi automatisoi tapahtumankäsittelyn ja säästää tiimiltäsi tunteja toistuvaa työtä.';
      if (reconciliationCostSavings > 0) {
        text += ` Automaattinen täsmäytys korvaa päivittäisen manuaalisen kohdistamisen ja vapauttaa ${formatCurrency(reconciliationCostSavings)} työvoimakustannuksissa.`;
      }
      if (chargebackReduction > 0) {
        text += ` Sisäänrakennettu petosten esto vähentää takaisinperintäprosenttisi ${chargebackRate} prosentista ${mewsChargebackRate} prosenttiin ja säästää ${formatCurrency(chargebackReduction)} vuosittain.`;
      }
      if (noShowRevenue > 0) {
        text += ` Automaattinen korttitakuu kerää ${formatCurrency(noShowRevenue)} saapumatta jättämisen maksuissa, jotka muuten kirjattaisiin luottotappioksi.`;
      }
      if (multiCurrencyRevenue > 0) {
        text += ` Monivaluuttatuki antaa kansainvälisten vieraiden maksaa omassa valuutassaan, poistaa kitkaa ja avaa ${formatCurrency(multiCurrencyRevenue)} lisätuotoissa.`;
      }
      return text;
    },

    pdfRmsNarrative: ({ annualRevenueGain, annualHoursSaved, annualLaborCostSavings, numberOfRooms, hasRevenueManager, hasExistingRMS, formatCurrency }) => {
      let text = `Mews RMS korvaa arvailun tekoälypohjaisella dynaamisella hinnoittelulla, joka reagoi markkinaolosuhteisiin reaaliajassa — ympärivuorokautinen tuotonoptimointimoottori, joka tuottaa ${formatCurrency(annualRevenueGain)} lisä-RevPARia ${numberOfRooms} huoneen kautta.`;
      if (annualHoursSaved > 0) {
        text += ` Automaattinen jakelu kaikkiin hintasuunnitelmiisi ja kanaviisi poistaa tuntien manuaaliset päivitykset ja säästää ${formatCurrency(annualLaborCostSavings)} työvoimakustannuksissa.`;
      }
      text += hasRevenueManager
        ? ' Tuottopäällikkösi voi keskittyä strategiaan ja markkina-asemointiin taulukkolaskennan sijaan.'
        : ' Saat yritystason tuotonoptimointia ilman erillistä tuottopäällikköä — tekoäly hoitaa hinnoittelun ympäri vuorokauden.';
      return text;
    },
  },

  slideFooter: 'Mews ROI-raportti',

  formulas: {
    checkIn: (p) => `${p.annualRes} varausta/v x (${p.checkInSaved} sisäänkirj. + ${p.checkOutSaved} uloskirj. säästetty) / 60 = ${p.totalHours} t/v`,
    roomAssignment: (p) => `${p.annualRes} varausta/v x ${p.assignTime}/varaus / 60 = ${p.totalHours} t/v`,
    upsell: (p) => `${p.annualRes} varausta/v x ${p.cs}${p.adr} ADR x ${p.onlineCheckIn}% verkkokirjautuminen x ${p.uplift}% lisäys = ${p.total}`,
    directBooking: (p) => `${p.annualRes} varausta/v x ${p.directIncrease}% enemmän suoria x ${p.cs}${p.adr} ADR x ${p.commission}% komissio = ${p.total}`,
    tokenization: (p) => `${p.annualRes} varausta/v x ${p.seconds}s per tapahtuma / 3 600 = ${p.totalHours} t/v`,
    chargeback: (p) => `(${p.currentRate}% - ${p.mewsRate}%) vähennys x ${p.cs}${p.costPerMonth}/kk x 12 = ${p.total}`,
    reconciliation: (p) => `(${p.currentDaily} - ${p.mewsDaily}) t/pv x 365 päivää = ${p.totalHours} t/v`,
    noShow: (p) => `${p.cs}${p.monthlyRev}/kk x 12 x ${p.noShowRate}% saapumatta x ${p.uncollectedFees}% keräämättömät maksut = ${p.total}`,
    multiCurrency: (p) => `${p.cs}${p.monthlyRev}/kk x 12 x ${p.foreignPercent}% ulkomaiset x ${p.adoption}% käyttöönotto x ${p.share}% osuus = ${p.total}`,
    revenueUplift: (p) => `${p.cs}${p.revpar} RevPAR x ${p.upliftPercent}% lisäys = ${p.cs}${p.revparUplift}/huone/yö x ${p.rooms} huonetta x 365 päivää = ${p.total}`,
    rateAutomation: (p) => `${p.updatesPerWeek} päivitystä/vko x 52 vkoa x ${p.ratePlans} hintasuun. x ${p.channels} kanavaa x ${p.updateTime} min / 60 = ${p.totalHours} t/v`,
  },
};

export default fi;
