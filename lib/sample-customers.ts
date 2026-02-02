/**
 * Sample customer profiles for Mews trial environments
 * This file contains 100 predetermined customer profiles that are created
 * automatically when a new trial environment is set up.
 */

export interface SampleCustomer {
  FirstName: string;
  LastName: string;
  Email: string;
  Phone?: string;
  BirthDate?: string;        // ISO 8601 format: "1990-05-15"
  Sex?: 'Male' | 'Female';
  Title?: 'Mister' | 'Miss' | 'Misses';  // Valid Mews API values only
  NationalityCode?: string;  // ISO 3166-1 alpha-2: "GB", "US", "DE"
  PreferredLanguageCode?: string; // From lib/codes.ts: "en-GB", "fr-FR"
  CompanyIdentifier?: {
    Name: string;
  };
}

/**
 * 100 diverse customer profiles
 * - 70% personal travelers
 * - 30% business travelers
 * - 20+ nationalities represented
 * - Mix of ages, genders, titles
 */
export const sampleCustomers: SampleCustomer[] = [
  // Personal Travelers (1-70)
  {
    FirstName: 'Emma',
    LastName: 'Thompson',
    Email: 'emma.thompson@gmail.com',
    Phone: '+44 20 7123 4567',
    BirthDate: '1985-03-15',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'GB',
    PreferredLanguageCode: 'en-GB'
  },
  {
    FirstName: 'James',
    LastName: 'Anderson',
    Email: 'james.anderson@outlook.com',
    Phone: '+1 212 555 0123',
    BirthDate: '1978-07-22',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'US',
    PreferredLanguageCode: 'en-US'
  },
  {
    FirstName: 'Sophie',
    LastName: 'Martin',
    Email: 'sophie.martin@gmail.com',
    Phone: '+33 1 42 68 53 00',
    BirthDate: '1992-11-08',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'FR',
    PreferredLanguageCode: 'fr-FR'
  },
  {
    FirstName: 'Lukas',
    LastName: 'Müller',
    Email: 'lukas.mueller@gmail.com',
    Phone: '+49 30 12345678',
    BirthDate: '1988-04-30',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'DE',
    PreferredLanguageCode: 'de-DE'
  },
  {
    FirstName: 'Isabella',
    LastName: 'Rossi',
    Email: 'isabella.rossi@libero.it',
    Phone: '+39 06 1234 5678',
    BirthDate: '1995-09-12',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'IT',
    PreferredLanguageCode: 'it-IT'
  },
  {
    FirstName: 'Carlos',
    LastName: 'García',
    Email: 'carlos.garcia@yahoo.es',
    Phone: '+34 91 123 45 67',
    BirthDate: '1982-06-18',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'ES',
    PreferredLanguageCode: 'es-ES'
  },
  {
    FirstName: 'Anna',
    LastName: 'Kowalski',
    Email: 'anna.kowalski@gmail.com',
    Phone: '+48 22 123 45 67',
    BirthDate: '1990-02-28',
    Sex: 'Female',
    Title: 'Misses',
    NationalityCode: 'PL',
    PreferredLanguageCode: 'pl-PL'
  },
  {
    FirstName: 'Lars',
    LastName: 'Andersson',
    Email: 'lars.andersson@gmail.com',
    Phone: '+46 8 123 456 78',
    BirthDate: '1975-12-05',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'SE',
    PreferredLanguageCode: 'sv-SE'
  },
  {
    FirstName: 'Maria',
    LastName: 'Santos',
    Email: 'maria.santos@gmail.com',
    Phone: '+351 21 123 4567',
    BirthDate: '1993-08-20',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'PT',
    PreferredLanguageCode: 'pt-PT'
  },
  {
    FirstName: 'Jan',
    LastName: 'Novák',
    Email: 'jan.novak@seznam.cz',
    Phone: '+420 222 123 456',
    BirthDate: '1987-01-14',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'CZ',
    PreferredLanguageCode: 'cs-CZ'
  },
  {
    FirstName: 'Olivia',
    LastName: 'Williams',
    Email: 'olivia.williams@gmail.com',
    Phone: '+44 161 123 4567',
    BirthDate: '1991-05-09',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'GB',
    PreferredLanguageCode: 'en-GB'
  },
  {
    FirstName: 'Michael',
    LastName: 'Johnson',
    Email: 'michael.johnson@yahoo.com',
    Phone: '+1 415 555 0156',
    BirthDate: '1980-10-25',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'US',
    PreferredLanguageCode: 'en-US'
  },
  {
    FirstName: 'Julie',
    LastName: 'Dubois',
    Email: 'julie.dubois@orange.fr',
    Phone: '+33 4 78 90 12 34',
    BirthDate: '1989-07-03',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'FR',
    PreferredLanguageCode: 'fr-FR'
  },
  {
    FirstName: 'Hans',
    LastName: 'Schmidt',
    Email: 'hans.schmidt@web.de',
    Phone: '+49 89 123 45678',
    BirthDate: '1972-11-19',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'DE',
    PreferredLanguageCode: 'de-DE'
  },
  {
    FirstName: 'Giulia',
    LastName: 'Bianchi',
    Email: 'giulia.bianchi@gmail.com',
    Phone: '+39 02 1234 5678',
    BirthDate: '1994-04-16',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'IT',
    PreferredLanguageCode: 'it-IT'
  },
  {
    FirstName: 'Miguel',
    LastName: 'Rodríguez',
    Email: 'miguel.rodriguez@hotmail.com',
    Phone: '+34 93 123 45 67',
    BirthDate: '1986-09-07',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'ES',
    PreferredLanguageCode: 'es-ES'
  },
  {
    FirstName: 'Marta',
    LastName: 'Nowak',
    Email: 'marta.nowak@o2.pl',
    Phone: '+48 71 123 45 67',
    BirthDate: '1996-03-22',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'PL',
    PreferredLanguageCode: 'pl-PL'
  },
  {
    FirstName: 'Erik',
    LastName: 'Larsson',
    Email: 'erik.larsson@hotmail.se',
    Phone: '+46 31 123 456 78',
    BirthDate: '1983-12-11',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'SE',
    PreferredLanguageCode: 'sv-SE'
  },
  {
    FirstName: 'Ana',
    LastName: 'Silva',
    Email: 'ana.silva@sapo.pt',
    Phone: '+351 22 123 4567',
    BirthDate: '1992-06-28',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'PT',
    PreferredLanguageCode: 'pt-PT'
  },
  {
    FirstName: 'Petr',
    LastName: 'Svoboda',
    Email: 'petr.svoboda@gmail.com',
    Phone: '+420 224 123 456',
    BirthDate: '1979-02-15',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'CZ',
    PreferredLanguageCode: 'cs-CZ'
  },
  {
    FirstName: 'Charlotte',
    LastName: 'Davies',
    Email: 'charlotte.davies@gmail.com',
    Phone: '+44 29 2123 4567',
    BirthDate: '1990-08-05',
    Sex: 'Female',
    Title: 'Misses',
    NationalityCode: 'GB',
    PreferredLanguageCode: 'en-GB'
  },
  {
    FirstName: 'Robert',
    LastName: 'Miller',
    Email: 'robert.miller@gmail.com',
    Phone: '+1 305 555 0189',
    BirthDate: '1977-04-12',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'US',
    PreferredLanguageCode: 'en-US'
  },
  {
    FirstName: 'Camille',
    LastName: 'Bernard',
    Email: 'camille.bernard@free.fr',
    Phone: '+33 5 56 12 34 56',
    BirthDate: '1995-11-30',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'FR',
    PreferredLanguageCode: 'fr-FR'
  },
  {
    FirstName: 'Thomas',
    LastName: 'Wagner',
    Email: 'thomas.wagner@gmail.com',
    Phone: '+49 40 123 45678',
    BirthDate: '1984-07-24',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'DE',
    PreferredLanguageCode: 'de-DE'
  },
  {
    FirstName: 'Francesca',
    LastName: 'Romano',
    Email: 'francesca.romano@tiscali.it',
    Phone: '+39 011 1234 567',
    BirthDate: '1991-01-08',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'IT',
    PreferredLanguageCode: 'it-IT'
  },
  {
    FirstName: 'Javier',
    LastName: 'López',
    Email: 'javier.lopez@gmail.com',
    Phone: '+34 95 123 45 67',
    BirthDate: '1976-05-19',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'ES',
    PreferredLanguageCode: 'es-ES'
  },
  {
    FirstName: 'Katarzyna',
    LastName: 'Wójcik',
    Email: 'katarzyna.wojcik@gmail.com',
    Phone: '+48 12 123 45 67',
    BirthDate: '1993-09-14',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'PL',
    PreferredLanguageCode: 'pl-PL'
  },
  {
    FirstName: 'Oskar',
    LastName: 'Nilsson',
    Email: 'oskar.nilsson@gmail.com',
    Phone: '+46 40 123 456 78',
    BirthDate: '1981-03-27',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'SE',
    PreferredLanguageCode: 'sv-SE'
  },
  {
    FirstName: 'Beatriz',
    LastName: 'Costa',
    Email: 'beatriz.costa@gmail.com',
    Phone: '+351 91 123 4567',
    BirthDate: '1988-12-02',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'PT',
    PreferredLanguageCode: 'pt-PT'
  },
  {
    FirstName: 'Jakub',
    LastName: 'Dvořák',
    Email: 'jakub.dvorak@centrum.cz',
    Phone: '+420 603 123 456',
    BirthDate: '1985-06-16',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'CZ',
    PreferredLanguageCode: 'cs-CZ'
  },
  {
    FirstName: 'Grace',
    LastName: 'Taylor',
    Email: 'grace.taylor@btinternet.com',
    Phone: '+44 113 123 4567',
    BirthDate: '1994-10-21',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'GB',
    PreferredLanguageCode: 'en-GB'
  },
  {
    FirstName: 'David',
    LastName: 'Wilson',
    Email: 'david.wilson@yahoo.com',
    Phone: '+1 617 555 0142',
    BirthDate: '1973-08-29',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'US',
    PreferredLanguageCode: 'en-US'
  },
  {
    FirstName: 'Léa',
    LastName: 'Petit',
    Email: 'lea.petit@wanadoo.fr',
    Phone: '+33 2 40 12 34 56',
    BirthDate: '1997-02-11',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'FR',
    PreferredLanguageCode: 'fr-FR'
  },
  {
    FirstName: 'Felix',
    LastName: 'Becker',
    Email: 'felix.becker@gmx.de',
    Phone: '+49 69 123 45678',
    BirthDate: '1982-11-06',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'DE',
    PreferredLanguageCode: 'de-DE'
  },
  {
    FirstName: 'Chiara',
    LastName: 'Ferrari',
    Email: 'chiara.ferrari@alice.it',
    Phone: '+39 051 1234 567',
    BirthDate: '1989-04-23',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'IT',
    PreferredLanguageCode: 'it-IT'
  },
  {
    FirstName: 'Diego',
    LastName: 'Martínez',
    Email: 'diego.martinez@gmail.com',
    Phone: '+34 96 123 45 67',
    BirthDate: '1978-07-17',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'ES',
    PreferredLanguageCode: 'es-ES'
  },
  {
    FirstName: 'Magdalena',
    LastName: 'Kamińska',
    Email: 'magdalena.kaminska@wp.pl',
    Phone: '+48 61 123 45 67',
    BirthDate: '1996-01-25',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'PL',
    PreferredLanguageCode: 'pl-PL'
  },
  {
    FirstName: 'Gustav',
    LastName: 'Johansson',
    Email: 'gustav.johansson@telia.com',
    Phone: '+46 13 123 456 78',
    BirthDate: '1974-09-08',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'SE',
    PreferredLanguageCode: 'sv-SE'
  },
  {
    FirstName: 'Inês',
    LastName: 'Ferreira',
    Email: 'ines.ferreira@hotmail.com',
    Phone: '+351 21 987 6543',
    BirthDate: '1991-05-13',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'PT',
    PreferredLanguageCode: 'pt-PT'
  },
  {
    FirstName: 'Tomáš',
    LastName: 'Černý',
    Email: 'tomas.cerny@email.cz',
    Phone: '+420 777 123 456',
    BirthDate: '1986-12-19',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'CZ',
    PreferredLanguageCode: 'cs-CZ'
  },
  {
    FirstName: 'Amelia',
    LastName: 'Brown',
    Email: 'amelia.brown@gmail.com',
    Phone: '+44 141 123 4567',
    BirthDate: '1992-03-04',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'GB',
    PreferredLanguageCode: 'en-GB'
  },
  {
    FirstName: 'Christopher',
    LastName: 'Martinez',
    Email: 'christopher.martinez@hotmail.com',
    Phone: '+1 713 555 0167',
    BirthDate: '1979-06-20',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'US',
    PreferredLanguageCode: 'en-US'
  },
  {
    FirstName: 'Chloé',
    LastName: 'Rousseau',
    Email: 'chloe.rousseau@sfr.fr',
    Phone: '+33 3 20 12 34 56',
    BirthDate: '1993-10-15',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'FR',
    PreferredLanguageCode: 'fr-FR'
  },
  {
    FirstName: 'Maximilian',
    LastName: 'Hoffmann',
    Email: 'max.hoffmann@t-online.de',
    Phone: '+49 221 123 45678',
    BirthDate: '1983-02-28',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'DE',
    PreferredLanguageCode: 'de-DE'
  },
  {
    FirstName: 'Valentina',
    LastName: 'Colombo',
    Email: 'valentina.colombo@virgilio.it',
    Phone: '+39 081 1234 567',
    BirthDate: '1995-08-09',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'IT',
    PreferredLanguageCode: 'it-IT'
  },
  {
    FirstName: 'Alejandro',
    LastName: 'Fernández',
    Email: 'alejandro.fernandez@terra.es',
    Phone: '+34 91 987 65 43',
    BirthDate: '1981-11-26',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'ES',
    PreferredLanguageCode: 'es-ES'
  },
  {
    FirstName: 'Agnieszka',
    LastName: 'Lewandowska',
    Email: 'agnieszka.lewandowska@interia.pl',
    Phone: '+48 42 123 45 67',
    BirthDate: '1990-04-07',
    Sex: 'Female',
    Title: 'Misses',
    NationalityCode: 'PL',
    PreferredLanguageCode: 'pl-PL'
  },
  {
    FirstName: 'Nils',
    LastName: 'Eriksson',
    Email: 'nils.eriksson@spray.se',
    Phone: '+46 19 123 456 78',
    BirthDate: '1977-07-31',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'SE',
    PreferredLanguageCode: 'sv-SE'
  },
  {
    FirstName: 'Mariana',
    LastName: 'Oliveira',
    Email: 'mariana.oliveira@gmail.com',
    Phone: '+351 93 456 7890',
    BirthDate: '1994-12-14',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'PT',
    PreferredLanguageCode: 'pt-PT'
  },
  {
    FirstName: 'Martin',
    LastName: 'Procházka',
    Email: 'martin.prochazka@atlas.cz',
    Phone: '+420 731 123 456',
    BirthDate: '1988-05-22',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'CZ',
    PreferredLanguageCode: 'cs-CZ'
  },
  {
    FirstName: 'Lily',
    LastName: 'Evans',
    Email: 'lily.evans@sky.com',
    Phone: '+44 117 123 4567',
    BirthDate: '1987-09-18',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'GB',
    PreferredLanguageCode: 'en-GB'
  },
  {
    FirstName: 'Daniel',
    LastName: 'Garcia',
    Email: 'daniel.garcia@aol.com',
    Phone: '+1 602 555 0134',
    BirthDate: '1975-01-05',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'US',
    PreferredLanguageCode: 'en-US'
  },
  {
    FirstName: 'Manon',
    LastName: 'Moreau',
    Email: 'manon.moreau@bbox.fr',
    Phone: '+33 4 91 12 34 56',
    BirthDate: '1998-06-27',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'FR',
    PreferredLanguageCode: 'fr-FR'
  },
  {
    FirstName: 'Alexander',
    LastName: 'Fischer',
    Email: 'alexander.fischer@yahoo.de',
    Phone: '+49 711 123 45678',
    BirthDate: '1984-10-12',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'DE',
    PreferredLanguageCode: 'de-DE'
  },
  {
    FirstName: 'Martina',
    LastName: 'Russo',
    Email: 'martina.russo@fastwebnet.it',
    Phone: '+39 055 1234 567',
    BirthDate: '1992-03-29',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'IT',
    PreferredLanguageCode: 'it-IT'
  },
  {
    FirstName: 'Pablo',
    LastName: 'Sánchez',
    Email: 'pablo.sanchez@outlook.es',
    Phone: '+34 92 123 45 67',
    BirthDate: '1980-08-03',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'ES',
    PreferredLanguageCode: 'es-ES'
  },
  {
    FirstName: 'Zofia',
    LastName: 'Zielińska',
    Email: 'zofia.zielinska@gmail.com',
    Phone: '+48 58 123 45 67',
    BirthDate: '1989-11-11',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'PL',
    PreferredLanguageCode: 'pl-PL'
  },
  {
    FirstName: 'Viktor',
    LastName: 'Pettersson',
    Email: 'viktor.pettersson@passagen.se',
    Phone: '+46 18 123 456 78',
    BirthDate: '1976-04-16',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'SE',
    PreferredLanguageCode: 'sv-SE'
  },
  {
    FirstName: 'Carolina',
    LastName: 'Pereira',
    Email: 'carolina.pereira@clix.pt',
    Phone: '+351 96 789 0123',
    BirthDate: '1993-07-08',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'PT',
    PreferredLanguageCode: 'pt-PT'
  },
  {
    FirstName: 'David',
    LastName: 'Kučera',
    Email: 'david.kucera@seznam.cz',
    Phone: '+420 604 123 456',
    BirthDate: '1985-12-23',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'CZ',
    PreferredLanguageCode: 'cs-CZ'
  },
  {
    FirstName: 'Sophia',
    LastName: 'Wilson',
    Email: 'sophia.wilson@talktalk.net',
    Phone: '+44 131 123 4567',
    BirthDate: '1991-02-19',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'GB',
    PreferredLanguageCode: 'en-GB'
  },
  {
    FirstName: 'Matthew',
    LastName: 'Rodriguez',
    Email: 'matthew.rodriguez@icloud.com',
    Phone: '+1 512 555 0198',
    BirthDate: '1979-05-14',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'US',
    PreferredLanguageCode: 'en-US'
  },
  {
    FirstName: 'Anaïs',
    LastName: 'Laurent',
    Email: 'anais.laurent@gmail.com',
    Phone: '+33 6 12 34 56 78',
    BirthDate: '1996-09-01',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'FR',
    PreferredLanguageCode: 'fr-FR'
  },
  {
    FirstName: 'Sebastian',
    LastName: 'Schneider',
    Email: 'sebastian.schneider@freenet.de',
    Phone: '+49 351 123 45678',
    BirthDate: '1982-12-27',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'DE',
    PreferredLanguageCode: 'de-DE'
  },
  {
    FirstName: 'Elena',
    LastName: 'Greco',
    Email: 'elena.greco@tin.it',
    Phone: '+39 010 1234 567',
    BirthDate: '1990-06-10',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'IT',
    PreferredLanguageCode: 'it-IT'
  },
  {
    FirstName: 'Rafael',
    LastName: 'Pérez',
    Email: 'rafael.perez@gmail.com',
    Phone: '+34 98 123 45 67',
    BirthDate: '1977-03-18',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'ES',
    PreferredLanguageCode: 'es-ES'
  },
  {
    FirstName: 'Natalia',
    LastName: 'Szymańska',
    Email: 'natalia.szymanska@onet.pl',
    Phone: '+48 91 123 45 67',
    BirthDate: '1994-10-06',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'PL',
    PreferredLanguageCode: 'pl-PL'
  },
  {
    FirstName: 'Anders',
    LastName: 'Gustafsson',
    Email: 'anders.gustafsson@gmail.com',
    Phone: '+46 21 123 456 78',
    BirthDate: '1973-08-24',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'SE',
    PreferredLanguageCode: 'sv-SE'
  },
  {
    FirstName: 'Joana',
    LastName: 'Rodrigues',
    Email: 'joana.rodrigues@iol.pt',
    Phone: '+351 91 234 5678',
    BirthDate: '1988-01-31',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'PT',
    PreferredLanguageCode: 'pt-PT'
  },

  // Business Travelers (71-100)
  {
    FirstName: 'Richard',
    LastName: 'Thompson',
    Email: 'richard.thompson@techcorp.com',
    Phone: '+44 20 7946 0958',
    BirthDate: '1975-04-12',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'GB',
    PreferredLanguageCode: 'en-GB',
    CompanyIdentifier: {
      Name: 'TechCorp International'
    }
  },
  {
    FirstName: 'Jennifer',
    LastName: 'Davis',
    Email: 'jennifer.davis@globalventures.com',
    Phone: '+1 646 555 0177',
    BirthDate: '1982-09-08',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'US',
    PreferredLanguageCode: 'en-US',
    CompanyIdentifier: {
      Name: 'Global Ventures Inc'
    }
  },
  {
    FirstName: 'Pierre',
    LastName: 'Lefevre',
    Email: 'pierre.lefevre@parisconsulting.fr',
    Phone: '+33 1 53 45 67 89',
    BirthDate: '1978-11-22',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'FR',
    PreferredLanguageCode: 'fr-FR',
    CompanyIdentifier: {
      Name: 'Paris Consulting Group'
    }
  },
  {
    FirstName: 'Sabine',
    LastName: 'Weber',
    Email: 'sabine.weber@deutschbank.de',
    Phone: '+49 69 910 12345',
    BirthDate: '1985-06-15',
    Sex: 'Female',
    Title: 'Misses',
    NationalityCode: 'DE',
    PreferredLanguageCode: 'de-DE',
    CompanyIdentifier: {
      Name: 'Deutsch Banking Solutions'
    }
  },
  {
    FirstName: 'Marco',
    LastName: 'Conti',
    Email: 'marco.conti@italdesign.it',
    Phone: '+39 02 7234 5678',
    BirthDate: '1980-03-27',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'IT',
    PreferredLanguageCode: 'it-IT',
    CompanyIdentifier: {
      Name: 'ItalDesign SpA'
    }
  },
  {
    FirstName: 'Carmen',
    LastName: 'Navarro',
    Email: 'carmen.navarro@ibertech.es',
    Phone: '+34 91 456 78 90',
    BirthDate: '1987-07-19',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'ES',
    PreferredLanguageCode: 'es-ES',
    CompanyIdentifier: {
      Name: 'IberTech Solutions'
    }
  },
  {
    FirstName: 'Andrzej',
    LastName: 'Kowalczyk',
    Email: 'andrzej.kowalczyk@warsawcorp.pl',
    Phone: '+48 22 456 78 90',
    BirthDate: '1976-12-03',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'PL',
    PreferredLanguageCode: 'pl-PL',
    CompanyIdentifier: {
      Name: 'Warsaw Corporation'
    }
  },
  {
    FirstName: 'Ingrid',
    LastName: 'Svensson',
    Email: 'ingrid.svensson@nordicgroup.se',
    Phone: '+46 8 567 890 12',
    BirthDate: '1983-02-14',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'SE',
    PreferredLanguageCode: 'sv-SE',
    CompanyIdentifier: {
      Name: 'Nordic Business Group'
    }
  },
  {
    FirstName: 'João',
    LastName: 'Almeida',
    Email: 'joao.almeida@lisbontech.pt',
    Phone: '+351 21 345 6789',
    BirthDate: '1981-05-28',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'PT',
    PreferredLanguageCode: 'pt-PT',
    CompanyIdentifier: {
      Name: 'Lisbon Tech Solutions'
    }
  },
  {
    FirstName: 'Eva',
    LastName: 'Horáková',
    Email: 'eva.horakova@pragueventures.cz',
    Phone: '+420 234 567 890',
    BirthDate: '1989-08-11',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'CZ',
    PreferredLanguageCode: 'cs-CZ',
    CompanyIdentifier: {
      Name: 'Prague Ventures Ltd'
    }
  },
  {
    FirstName: 'Andrew',
    LastName: 'Mitchell',
    Email: 'andrew.mitchell@londonfinance.co.uk',
    Phone: '+44 20 7123 4567',
    BirthDate: '1974-11-09',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'GB',
    PreferredLanguageCode: 'en-GB',
    CompanyIdentifier: {
      Name: 'London Finance Partners'
    }
  },
  {
    FirstName: 'Sarah',
    LastName: 'Thompson',
    Email: 'sarah.thompson@siliconvalley.com',
    Phone: '+1 408 555 0123',
    BirthDate: '1986-04-16',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'US',
    PreferredLanguageCode: 'en-US',
    CompanyIdentifier: {
      Name: 'Silicon Valley Innovations'
    }
  },
  {
    FirstName: 'François',
    LastName: 'Dupont',
    Email: 'francois.dupont@lyonenterprises.fr',
    Phone: '+33 4 72 34 56 78',
    BirthDate: '1979-07-23',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'FR',
    PreferredLanguageCode: 'fr-FR',
    CompanyIdentifier: {
      Name: 'Lyon Enterprises'
    }
  },
  {
    FirstName: 'Claudia',
    LastName: 'Bauer',
    Email: 'claudia.bauer@munichsystems.de',
    Phone: '+49 89 234 56789',
    BirthDate: '1984-01-19',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'DE',
    PreferredLanguageCode: 'de-DE',
    CompanyIdentifier: {
      Name: 'Munich Systems GmbH'
    }
  },
  {
    FirstName: 'Alessandro',
    LastName: 'Marino',
    Email: 'alessandro.marino@milanoholdings.it',
    Phone: '+39 02 3456 7890',
    BirthDate: '1977-10-05',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'IT',
    PreferredLanguageCode: 'it-IT',
    CompanyIdentifier: {
      Name: 'Milano Holdings'
    }
  },
  {
    FirstName: 'Lucía',
    LastName: 'Moreno',
    Email: 'lucia.moreno@barcelonaconsulting.es',
    Phone: '+34 93 234 56 78',
    BirthDate: '1990-06-12',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'ES',
    PreferredLanguageCode: 'es-ES',
    CompanyIdentifier: {
      Name: 'Barcelona Consulting'
    }
  },
  {
    FirstName: 'Piotr',
    LastName: 'Dąbrowski',
    Email: 'piotr.dabrowski@krakowitech.pl',
    Phone: '+48 12 345 67 89',
    BirthDate: '1982-03-30',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'PL',
    PreferredLanguageCode: 'pl-PL',
    CompanyIdentifier: {
      Name: 'Kraków iTech'
    }
  },
  {
    FirstName: 'Emma',
    LastName: 'Bergström',
    Email: 'emma.bergstrom@stockholmanalytics.se',
    Phone: '+46 8 678 901 23',
    BirthDate: '1988-09-07',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'SE',
    PreferredLanguageCode: 'sv-SE',
    CompanyIdentifier: {
      Name: 'Stockholm Analytics AB'
    }
  },
  {
    FirstName: 'Miguel',
    LastName: 'Carvalho',
    Email: 'miguel.carvalho@portobusiness.pt',
    Phone: '+351 22 456 7890',
    BirthDate: '1975-12-21',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'PT',
    PreferredLanguageCode: 'pt-PT',
    CompanyIdentifier: {
      Name: 'Porto Business Group'
    }
  },
  {
    FirstName: 'Tereza',
    LastName: 'Malá',
    Email: 'tereza.mala@brnocorp.cz',
    Phone: '+420 543 123 456',
    BirthDate: '1991-05-17',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'CZ',
    PreferredLanguageCode: 'cs-CZ',
    CompanyIdentifier: {
      Name: 'Brno Corporation'
    }
  },
  {
    FirstName: 'George',
    LastName: 'Roberts',
    Email: 'george.roberts@oxfordsolutions.com',
    Phone: '+44 186 512 3456',
    BirthDate: '1973-08-02',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'GB',
    PreferredLanguageCode: 'en-GB',
    CompanyIdentifier: {
      Name: 'Oxford Solutions Ltd'
    }
  },
  {
    FirstName: 'Lisa',
    LastName: 'Chang',
    Email: 'lisa.chang@seattletech.com',
    Phone: '+1 206 555 0145',
    BirthDate: '1985-02-26',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'US',
    PreferredLanguageCode: 'en-US',
    CompanyIdentifier: {
      Name: 'Seattle Tech Industries'
    }
  },
  {
    FirstName: 'Antoine',
    LastName: 'Girard',
    Email: 'antoine.girard@marseillegroup.fr',
    Phone: '+33 4 91 23 45 67',
    BirthDate: '1980-11-14',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'FR',
    PreferredLanguageCode: 'fr-FR',
    CompanyIdentifier: {
      Name: 'Marseille Business Group'
    }
  },
  {
    FirstName: 'Petra',
    LastName: 'Klein',
    Email: 'petra.klein@hamburglogistics.de',
    Phone: '+49 40 345 67890',
    BirthDate: '1987-04-08',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'DE',
    PreferredLanguageCode: 'de-DE',
    CompanyIdentifier: {
      Name: 'Hamburg Logistics'
    }
  },
  {
    FirstName: 'Luca',
    LastName: 'Esposito',
    Email: 'luca.esposito@napoliindustries.it',
    Phone: '+39 081 234 5678',
    BirthDate: '1978-07-25',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'IT',
    PreferredLanguageCode: 'it-IT',
    CompanyIdentifier: {
      Name: 'Napoli Industries Srl'
    }
  },
  {
    FirstName: 'Isabel',
    LastName: 'Ruiz',
    Email: 'isabel.ruiz@sevillatrade.es',
    Phone: '+34 95 456 78 90',
    BirthDate: '1983-12-11',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'ES',
    PreferredLanguageCode: 'es-ES',
    CompanyIdentifier: {
      Name: 'Sevilla Trade Partners'
    }
  },
  {
    FirstName: 'Marcin',
    LastName: 'Wiśniewski',
    Email: 'marcin.wisniewski@gdanskshipping.pl',
    Phone: '+48 58 234 56 78',
    BirthDate: '1976-09-29',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'PL',
    PreferredLanguageCode: 'pl-PL',
    CompanyIdentifier: {
      Name: 'Gdańsk Shipping Co'
    }
  },
  {
    FirstName: 'Sofia',
    LastName: 'Lindgren',
    Email: 'sofia.lindgren@goteborgexports.se',
    Phone: '+46 31 789 012 34',
    BirthDate: '1992-01-06',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'SE',
    PreferredLanguageCode: 'sv-SE',
    CompanyIdentifier: {
      Name: 'Göteborg Exports'
    }
  },
  {
    FirstName: 'Ricardo',
    LastName: 'Martins',
    Email: 'ricardo.martins@coimbraconsult.pt',
    Phone: '+351 239 123 456',
    BirthDate: '1979-06-18',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'PT',
    PreferredLanguageCode: 'pt-PT',
    CompanyIdentifier: {
      Name: 'Coimbra Consultants'
    }
  },
  {
    FirstName: 'Veronika',
    LastName: 'Nováková',
    Email: 'veronika.novakova@ostravainvest.cz',
    Phone: '+420 596 123 456',
    BirthDate: '1986-10-03',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'CZ',
    PreferredLanguageCode: 'cs-CZ',
    CompanyIdentifier: {
      Name: 'Ostrava Investment Group'
    }
  }
];

/**
 * Get the list of sample customers
 * @returns Array of 100 sample customer profiles
 */
export function getSampleCustomers(): SampleCustomer[] {
  return sampleCustomers;
}
