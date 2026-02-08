/**
 * Sample customer profiles for Mews trial environments
 * This file contains 300 predetermined customer profiles that are created
 * automatically when a new trial environment is set up.
 *
 * Profiles 1-150: Hand-curated diverse profiles
 * Profiles 151-300: Intelligently generated variations of profiles 1-150
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
  Classifications?: string[]; // Guest classifications (e.g., "Returning", "VeryImportant", "FriendOrFamily")
  Notes?: string;             // Free text notes about the guest
}

/**
 * 150 hand-curated diverse customer profiles (base profiles)
 * - 70% personal travelers (105 profiles)
 * - 30% business travelers (45 profiles)
 * - 25+ nationalities represented
 * - Mix of ages, genders, titles
 * - ~50% enriched with Classifications and contextual Notes
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
    PreferredLanguageCode: 'en-GB',
    Classifications: ['Returning', 'Important'],
    Notes: 'Regular guest who visits quarterly. Prefers rooms on higher floors with city views. Allergic to down pillows.'
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
    PreferredLanguageCode: 'en-US',
    Classifications: ['Military'],
    Notes: 'US Navy veteran. Prefers quiet rooms away from elevators and ice machines. Early riser who appreciates breakfast service starting at 6 AM.'
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
    PreferredLanguageCode: 'de-DE',
    Classifications: ['FriendOrFamily'],
    Notes: 'Brother-in-law of the Assistant Manager. Enjoys room 212 when available. Vegetarian dietary preferences.'
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
    PreferredLanguageCode: 'it-IT',
    Classifications: ['Student'],
    Notes: 'Erasmus exchange student. Budget conscious. Needs strong WiFi for online classes. Prefers rooms near common areas for socializing.'
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
    PreferredLanguageCode: 'pl-PL',
    Classifications: ['DisabledPerson', 'HealthCompliant'],
    Notes: 'Requires wheelchair accessible room on ground floor. Needs bathroom with grab bars and roll-in shower. Patient and understanding guest.'
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
    PreferredLanguageCode: 'sv-SE',
    Classifications: ['PreviousComplaint', 'Returning'],
    Notes: 'Had previous issue with noisy neighbors which was resolved professionally. Now satisfied and continues to return. Appreciates proactive communication from staff.'
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
    PreferredLanguageCode: 'cs-CZ',
    Classifications: ['Cashlist'],
    Notes: 'Prefers to pay all charges in cash. Requests itemized receipts for all services. Polite and organized guest.'
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
    PreferredLanguageCode: 'en-GB',
    Classifications: ['Media'],
    Notes: 'Freelance journalist covering travel and hospitality. May request information about property operations. Professional and discreet.'
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
    PreferredLanguageCode: 'en-US',
    Classifications: ['Problematic'],
    Notes: 'Can be very particular about room cleanliness and temperature. Requires extra attention to detail. Best to assign experienced housekeeping staff.'
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
    PreferredLanguageCode: 'de-DE',
    Classifications: ['Returning', 'VeryImportant'],
    Notes: 'Long-time guest who stays biannually. Prefers corner rooms with balconies. Enjoys local recommendations for authentic restaurants. Always leaves generous reviews.'
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
    PreferredLanguageCode: 'it-IT',
    Classifications: ['Airline'],
    Notes: 'Alitalia flight attendant with irregular schedule. Often requires late check-in after international flights. Prefers blackout curtains for daytime sleeping.'
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
    PreferredLanguageCode: 'pl-PL',
    Classifications: ['Staff', 'FriendOrFamily'],
    Notes: 'Niece of the Head Chef. Works as intern in hospitality management. Observant and learns from guest service practices.'
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
    PreferredLanguageCode: 'en-GB',
    Classifications: ['Returning'],
    Notes: 'Anniversary tradition to stay each September. Enjoys surprise room upgrades when available. Celebrates with partner room 308.'
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
    PreferredLanguageCode: 'en-US',
    Classifications: ['Military', 'Returning'],
    Notes: 'US Air Force Colonel based in Germany. Stays during family visits. Prefers connecting rooms when traveling with adult children. Respectful of property rules.'
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
    PreferredLanguageCode: 'de-DE',
    Classifications: ['Student'],
    Notes: 'PhD researcher attending conferences. Requires quiet study environment. Often works late in room. Appreciates strong desk lighting.'
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
    PreferredLanguageCode: 'pl-PL',
    Classifications: ['Important'],
    Notes: 'Concert pianist who stays during performance tours. Requires guarantee of quiet neighbors. Sometimes practices in room - has arranged keyboard setup.'
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
    PreferredLanguageCode: 'cs-CZ',
    Classifications: ['HealthCompliant'],
    Notes: 'Gluten-free dietary requirements. Always confirms breakfast options in advance. Carries medical documentation. Appreciates staff awareness of allergen information.'
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
    PreferredLanguageCode: 'en-GB',
    Classifications: ['Airline'],
    Notes: 'British Airways cabin crew member. Layover stays typically 24-48 hours. Prefers rooms away from street noise. Professional and low maintenance guest.'
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
    PreferredLanguageCode: 'fr-FR',
    Classifications: ['Student', 'Returning'],
    Notes: 'Architecture student who sketches in hotel lobbies and gardens. Stays during study breaks. Respectful of communal spaces. Often requests local architecture recommendations.'
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
    PreferredLanguageCode: 'it-IT',
    Classifications: ['Important', 'Returning'],
    Notes: 'Fashion buyer who stays during seasonal buying trips. VIP treatment appreciated. Prefers modern, stylish rooms. Influential on social media - often posts about stay experiences.'
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
    PreferredLanguageCode: 'pl-PL',
    Classifications: ['Returning', 'Important'],
    Notes: 'Travel blogger with 50K+ followers. Stays frequently during content creation trips. Values authenticity and unique experiences. Posts positive reviews when impressed.'
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
    PreferredLanguageCode: 'sv-SE',
    Classifications: ['FriendOrFamily'],
    Notes: 'Former colleague of the General Manager from previous property. Enjoys catching up during stays. Prefers quiet corner rooms with workspace.'
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
    PreferredLanguageCode: 'en-GB',
    Classifications: ['DisabledPerson'],
    Notes: 'Hearing impaired guest. Appreciates visual alerts for fire alarms and door knocks. Prefers written communication for check-in details. Very appreciative of accessibility accommodations.'
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
    PreferredLanguageCode: 'en-US',
    Classifications: ['Military'],
    Notes: 'US Marine Corps veteran. Appreciates straightforward, efficient service. Prefers ground floor rooms for easier access. Often travels with service dog.'
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
    PreferredLanguageCode: 'de-DE',
    Classifications: ['PreviousComplaint', 'Returning'],
    Notes: 'Previous complaint about WiFi connectivity was addressed with upgraded router. Now satisfied and continues to book. Requires reliable internet for work.'
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
    PreferredLanguageCode: 'es-ES',
    Classifications: ['Cashlist', 'Returning'],
    Notes: 'Regular guest who prefers cash transactions for business expense tracking. Always requests detailed invoices. Organized and efficient check-in process.'
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
    PreferredLanguageCode: 'pl-PL',
    Classifications: ['Media', 'Important'],
    Notes: 'Food critic for major Polish lifestyle magazine. Evaluates hotel restaurants and breakfast service. Professional and fair in assessments. Maintains anonymity when possible.'
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
    PreferredLanguageCode: 'pt-PT',
    Classifications: ['Airline'],
    Notes: 'TAP Air Portugal flight attendant. Regular layovers on European routes. Prefers early breakfast before 6 AM departures. Reliable and punctual guest.'
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
    PreferredLanguageCode: 'en-GB',
    Classifications: ['Returning', 'VeryImportant'],
    Notes: 'Award-winning novelist who writes in hotel rooms for inspiration. Stays for week-long writing retreats. Requests "Do Not Disturb" for extended periods. Values privacy and quiet atmosphere.'
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
    PreferredLanguageCode: 'fr-FR',
    Classifications: ['Student'],
    Notes: 'Medical student attending clinical rotations. Budget conscious but values cleanliness. Studies late into the night. Appreciates quiet environment and good lighting.'
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
    PreferredLanguageCode: 'es-ES',
    Classifications: ['Returning', 'Problematic'],
    Notes: 'Particular about towel quality and room temperature. Has specific requests but is consistent guest. Best to review his preferences before arrival to ensure smooth stay.'
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
    PreferredLanguageCode: 'pl-PL',
    Classifications: ['HealthCompliant'],
    Notes: 'Severe peanut allergy. Requires detailed allergen information for all meals. Carries EpiPen. Staff should be briefed on emergency procedures before arrival.'
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
    PreferredLanguageCode: 'cs-CZ',
    Classifications: ['FriendOrFamily', 'Staff'],
    Notes: 'Cousin of the Night Manager. Part-time hospitality consultant. Often provides helpful feedback on operations. Professional and supportive.'
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
    PreferredLanguageCode: 'en-GB',
    Classifications: ['Important', 'Returning'],
    Notes: 'Art gallery owner who attends regional exhibitions. Appreciates art in hotel decor. Books extended stays for major art fairs. Cultured and engaging guest.'
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
    PreferredLanguageCode: 'fr-FR',
    Classifications: ['Airline', 'Returning'],
    Notes: 'Air France long-haul pilot. Irregular schedules with 48-72 hour layovers. Prefers blackout rooms for jet lag recovery. Professional and understanding of service limitations.'
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
    PreferredLanguageCode: 'it-IT',
    Classifications: ['Student', 'Returning'],
    Notes: 'Language instructor attending summer teaching programs. Stays for 2-3 week periods. Enjoys practicing local language with staff. Friendly and culturally curious guest.'
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
    PreferredLanguageCode: 'pl-PL',
    Classifications: ['Important'],
    Notes: 'Professional photographer who documents hotel architecture and design. May take photos in public areas. Respectful of other guests privacy. Creates beautiful property portfolios.'
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
    Classifications: ['VeryImportant', 'Returning'],
    Notes: 'C-level executive who books 10+ nights monthly. Prefers executive floor rooms with meeting space. Requires 24/7 business center access. Loyal corporate account.'
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
    Classifications: ['Important', 'Returning'],
    Notes: 'VP of Operations with frequent stays. Holds client meetings in hotel conference rooms. Prefers rooms near business facilities. Professional and courteous.'
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
    Classifications: ['VeryImportant'],
    Notes: 'Senior partner who brings high-value client meetings to property. Requires premium suites when entertaining. Excellent tipper and ambassador for the property.'
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
    Classifications: ['Important', 'Problematic'],
    Notes: 'Banking executive with high standards. Expects prompt service and attention to detail. Can be demanding but fair. Best to assign senior staff for check-in.'
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
    Classifications: ['Returning'],
    Notes: 'Design director who stays during trade shows. Books months in advance. Appreciates modern aesthetics. Sometimes extends stay last minute for project work.'
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
    Classifications: ['Important', 'Cashlist'],
    Notes: 'Tech sales manager who closes deals over property meals. Prefers to settle accounts in cash for expense reports. Brings valuable corporate clients to restaurant.'
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
    Classifications: ['Returning', 'Important'],
    Notes: 'Regional manager with weekly stays. Books same room number 405 when available. Needs reliable wake-up calls for early meetings. Punctual and organized.'
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
    Classifications: ['VeryImportant', 'Returning'],
    Notes: 'Board member who books executive suites for multi-day strategy sessions. Requires conference room access and catering services. High-value corporate account.'
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
    Classifications: ['VeryImportant', 'Important'],
    Notes: 'Managing partner of major financial firm. Extremely discreet service required. Often accompanied by business associates. Premium service expectations.'
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
    Classifications: ['Important', 'Returning'],
    Notes: 'Startup founder attending investor meetings. Books last minute but stays frequently. Values fast WiFi above all else. Night owl who works until 2 AM.'
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
    Classifications: ['Returning', 'PreviousComplaint'],
    Notes: 'IT consultant with monthly visits. Previous complaint about slow internet was resolved with upgraded service. Now satisfied and loyal guest. Requires technical support occasionally.'
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
    Classifications: ['Important', 'Media'],
    Notes: 'Investment banker featured in financial publications. Values privacy and discretion. Often works on confidential deals from room. Professional and low-key presence.'
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
    Classifications: ['Returning'],
    Notes: 'Software developer who stays during training sessions. Prefers quiet floors for concentration. Early check-in requested when possible. Appreciates technical amenities.'
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
  },

  // Additional Personal Travelers (101-135)
  {
    FirstName: 'Henrik',
    LastName: 'Nielsen',
    Email: 'henrik.nielsen@mail.dk',
    Phone: '+45 20 12 34 56',
    BirthDate: '1989-03-25',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'DK',
    PreferredLanguageCode: 'da-DK',
    Classifications: ['Returning'],
    Notes: 'Danish architect who stays for design conferences. Appreciates Scandinavian design elements. Often sketches in the lobby.'
  },
  {
    FirstName: 'Elena',
    LastName: 'Popescu',
    Email: 'elena.popescu@yahoo.ro',
    Phone: '+40 21 234 5678',
    BirthDate: '1992-07-14',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'RO',
    PreferredLanguageCode: 'ro-RO'
  },
  {
    FirstName: 'Koen',
    LastName: 'de Vries',
    Email: 'koen.devries@ziggo.nl',
    Phone: '+31 20 123 4567',
    BirthDate: '1985-11-09',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'NL',
    PreferredLanguageCode: 'nl-NL',
    Classifications: ['Student', 'Returning'],
    Notes: 'Graduate student researching European tourism. Stays during academic conferences. Friendly and inquisitive. Vegetarian with preference for local organic produce.'
  },
  {
    FirstName: 'Yuki',
    LastName: 'Tanaka',
    Email: 'yuki.tanaka@gmail.com',
    Phone: '+81 3 1234 5678',
    BirthDate: '1994-02-18',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'JP',
    PreferredLanguageCode: 'ja-JP',
    Classifications: ['Important'],
    Notes: 'Japanese travel influencer with large social media following. Documents unique hotel experiences. Professional and respectful of privacy policies.'
  },
  {
    FirstName: 'Mikhail',
    LastName: 'Volkov',
    Email: 'mikhail.volkov@yandex.ru',
    Phone: '+7 495 123 4567',
    BirthDate: '1978-09-30',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'RU',
    PreferredLanguageCode: 'ru-RU'
  },
  {
    FirstName: 'Siobhan',
    LastName: 'O\'Connor',
    Email: 'siobhan.oconnor@eircom.net',
    Phone: '+353 1 234 5678',
    BirthDate: '1990-05-22',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'IE',
    PreferredLanguageCode: 'en-IE',
    Classifications: ['Airline'],
    Notes: 'Aer Lingus cabin crew member. Regular European layovers. Prefers rooms with good natural light. Always courteous and low-maintenance.'
  },
  {
    FirstName: 'Andreas',
    LastName: 'Papadopoulos',
    Email: 'andreas.papadopoulos@gmail.com',
    Phone: '+30 210 123 4567',
    BirthDate: '1987-08-11',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'GR',
    PreferredLanguageCode: 'el-GR'
  },
  {
    FirstName: 'Astrid',
    LastName: 'Hansen',
    Email: 'astrid.hansen@online.no',
    Phone: '+47 22 123 456',
    BirthDate: '1993-12-07',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'NO',
    PreferredLanguageCode: 'no-NO',
    Classifications: ['HealthCompliant', 'Returning'],
    Notes: 'Norwegian marine biologist attending environmental conferences. Vegan dietary requirements. Prefers eco-friendly hotel practices. Appreciates sustainability initiatives.'
  },
  {
    FirstName: 'Lucas',
    LastName: 'Müller',
    Email: 'lucas.mueller@bluewin.ch',
    Phone: '+41 44 123 4567',
    BirthDate: '1981-04-19',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'CH',
    PreferredLanguageCode: 'de-CH',
    Classifications: ['VeryImportant'],
    Notes: 'Swiss watch industry executive. Values precision and punctuality. Expects Swiss standards of service. Loyal guest who recommends property to colleagues.'
  },
  {
    FirstName: 'Katja',
    LastName: 'Novak',
    Email: 'katja.novak@gmail.com',
    Phone: '+386 1 234 5678',
    BirthDate: '1995-06-28',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'SI',
    PreferredLanguageCode: 'sl-SI'
  },
  {
    FirstName: 'Filip',
    LastName: 'Jovanović',
    Email: 'filip.jovanovic@gmail.com',
    Phone: '+381 11 123 4567',
    BirthDate: '1988-10-15',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'RS',
    PreferredLanguageCode: 'sr-RS'
  },
  {
    FirstName: 'Maija',
    LastName: 'Virtanen',
    Email: 'maija.virtanen@gmail.com',
    Phone: '+358 9 1234 567',
    BirthDate: '1991-01-23',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'FI',
    PreferredLanguageCode: 'fi-FI',
    Classifications: ['Student'],
    Notes: 'Finnish design student on scholarship program. Minimalist preferences. Studies hotel interior design. Takes detailed notes on room layouts and aesthetics.'
  },
  {
    FirstName: 'Georg',
    LastName: 'Huber',
    Email: 'georg.huber@aon.at',
    Phone: '+43 1 234 5678',
    BirthDate: '1976-07-09',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'AT',
    PreferredLanguageCode: 'de-AT',
    Classifications: ['Returning', 'Important'],
    Notes: 'Austrian conductor who stays during symphony tours. Requires absolute quiet for practice and rest. Books connecting rooms for instrument storage. Appreciates cultural recommendations.'
  },
  {
    FirstName: 'Emma',
    LastName: 'Larsen',
    Email: 'emma.larsen@hotmail.dk',
    Phone: '+45 21 234 567',
    BirthDate: '1994-09-17',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'DK',
    PreferredLanguageCode: 'da-DK'
  },
  {
    FirstName: 'Bas',
    LastName: 'Janssen',
    Email: 'bas.janssen@xs4all.nl',
    Phone: '+31 30 234 5678',
    BirthDate: '1982-03-31',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'NL',
    PreferredLanguageCode: 'nl-NL',
    Classifications: ['Military'],
    Notes: 'Royal Netherlands Army officer attending NATO meetings. Professional demeanor. Prefers early breakfast. Always punctual for check-out.'
  },
  {
    FirstName: 'Zara',
    LastName: 'Ahmed',
    Email: 'zara.ahmed@gmail.com',
    Phone: '+44 121 234 5678',
    BirthDate: '1989-11-25',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'GB',
    PreferredLanguageCode: 'en-GB',
    Classifications: ['HealthCompliant'],
    Notes: 'British-Pakistani doctor with halal dietary requirements. Requests prayer facilities information. Professional and appreciative of cultural accommodation.'
  },
  {
    FirstName: 'Noah',
    LastName: 'Cohen',
    Email: 'noah.cohen@gmail.com',
    Phone: '+972 3 123 4567',
    BirthDate: '1986-05-14',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'IL',
    PreferredLanguageCode: 'he-IL'
  },
  {
    FirstName: 'Alina',
    LastName: 'Petrenko',
    Email: 'alina.petrenko@ukr.net',
    Phone: '+380 44 123 4567',
    BirthDate: '1993-08-03',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'UA',
    PreferredLanguageCode: 'uk-UA',
    Classifications: ['Problematic'],
    Notes: 'Ukrainian artist with specific requests regarding room lighting for painting. Can be particular about temperature and window positioning. Needs advance notice for special accommodations.'
  },
  {
    FirstName: 'Wei',
    LastName: 'Zhang',
    Email: 'wei.zhang@qq.com',
    Phone: '+86 10 1234 5678',
    BirthDate: '1988-12-11',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'CN',
    PreferredLanguageCode: 'zh-CN'
  },
  {
    FirstName: 'Priya',
    LastName: 'Sharma',
    Email: 'priya.sharma@gmail.com',
    Phone: '+91 11 1234 5678',
    BirthDate: '1992-04-08',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'IN',
    PreferredLanguageCode: 'hi-IN',
    Classifications: ['Student', 'HealthCompliant'],
    Notes: 'Indian medical researcher presenting at conferences. Vegetarian with preference for South Indian cuisine. Needs reliable WiFi for remote lab meetings. Professional and organized.'
  },
  {
    FirstName: 'Bruno',
    LastName: 'Silva',
    Email: 'bruno.silva@uol.com.br',
    Phone: '+55 11 1234 5678',
    BirthDate: '1979-06-22',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'BR',
    PreferredLanguageCode: 'pt-BR',
    Classifications: ['Returning'],
    Notes: 'Brazilian football coach who stays during European scouting trips. Friendly and sociable. Often uses hotel facilities for video analysis. Appreciates late check-out options.'
  },
  {
    FirstName: 'Min-Jun',
    LastName: 'Park',
    Email: 'minjun.park@naver.com',
    Phone: '+82 2 1234 5678',
    BirthDate: '1990-10-29',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'KR',
    PreferredLanguageCode: 'ko-KR'
  },
  {
    FirstName: 'Fatima',
    LastName: 'Al-Sayed',
    Email: 'fatima.alsayed@gmail.com',
    Phone: '+971 4 123 4567',
    BirthDate: '1987-02-16',
    Sex: 'Female',
    Title: 'Misses',
    NationalityCode: 'AE',
    PreferredLanguageCode: 'ar-AE',
    Classifications: ['Important', 'HealthCompliant'],
    Notes: 'Emirates businesswoman attending European trade shows. Halal dietary requirements. Values privacy and discretion. Prefers female housekeeping staff when possible.'
  },
  {
    FirstName: 'Liam',
    LastName: 'Murphy',
    Email: 'liam.murphy@gmail.com',
    Phone: '+353 21 234 5678',
    BirthDate: '1984-11-07',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'IE',
    PreferredLanguageCode: 'en-IE',
    Classifications: ['FriendOrFamily'],
    Notes: 'Friend of the property owner from university days. Enjoys catching up with management team. Often stays for extended weekends. Appreciates local pub recommendations.'
  },
  {
    FirstName: 'Ingrid',
    LastName: 'Johansen',
    Email: 'ingrid.johansen@gmail.com',
    Phone: '+47 23 456 789',
    BirthDate: '1991-09-19',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'NO',
    PreferredLanguageCode: 'no-NO'
  },
  {
    FirstName: 'Omar',
    LastName: 'Benjelloun',
    Email: 'omar.benjelloun@gmail.com',
    Phone: '+212 5 1234 5678',
    BirthDate: '1986-07-26',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'MA',
    PreferredLanguageCode: 'ar-MA'
  },
  {
    FirstName: 'Linnea',
    LastName: 'Karlsson',
    Email: 'linnea.karlsson@gmail.com',
    Phone: '+46 70 123 4567',
    BirthDate: '1995-03-12',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'SE',
    PreferredLanguageCode: 'sv-SE',
    Classifications: ['Media', 'Important'],
    Notes: 'Swedish travel vlogger creating European hotel content. Professional filming equipment. Always requests permission before recording. Generates positive social media exposure.'
  },
  {
    FirstName: 'Dimitri',
    LastName: 'Konstantinou',
    Email: 'dimitri.konstantinou@gmail.com',
    Phone: '+357 22 123 456',
    BirthDate: '1980-12-03',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'CY',
    PreferredLanguageCode: 'el-CY'
  },
  {
    FirstName: 'Sofie',
    LastName: 'Peeters',
    Email: 'sofie.peeters@skynet.be',
    Phone: '+32 2 123 4567',
    BirthDate: '1989-08-21',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'BE',
    PreferredLanguageCode: 'nl-BE',
    Classifications: ['Airline', 'Returning'],
    Notes: 'Brussels Airlines crew member with regular European routes. Prefers early check-in for morning departures. Professional and punctual. Appreciates quiet rooms for rest between flights.'
  },
  {
    FirstName: 'Tomasz',
    LastName: 'Pawlak',
    Email: 'tomasz.pawlak@gmail.com',
    Phone: '+48 32 123 4567',
    BirthDate: '1977-05-18',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'PL',
    PreferredLanguageCode: 'pl-PL'
  },
  {
    FirstName: 'Aisha',
    LastName: 'Hassan',
    Email: 'aisha.hassan@gmail.com',
    Phone: '+20 2 1234 5678',
    BirthDate: '1993-01-09',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'EG',
    PreferredLanguageCode: 'ar-EG'
  },
  {
    FirstName: 'Lars',
    LastName: 'Sørensen',
    Email: 'lars.sorensen@gmail.com',
    Phone: '+45 22 345 678',
    BirthDate: '1985-10-27',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'DK',
    PreferredLanguageCode: 'da-DK',
    Classifications: ['PreviousComplaint', 'Returning'],
    Notes: 'Had issue with breakfast timing on previous stay which was resolved. Now books regularly. Early riser who appreciates 6 AM breakfast start. Loyal and understanding guest.'
  },
  {
    FirstName: 'Anya',
    LastName: 'Ivanova',
    Email: 'anya.ivanova@mail.ru',
    Phone: '+7 812 123 4567',
    BirthDate: '1991-02-14',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'RU',
    PreferredLanguageCode: 'ru-RU',
    Classifications: ['Important'],
    Notes: 'Russian ballet dancer performing in European productions. Requires specific room temperature for muscle recovery. Often books extended stays for rehearsals. Cultural ambassador.'
  },
  {
    FirstName: 'Tim',
    LastName: 'van den Berg',
    Email: 'tim.vandenberg@gmail.com',
    Phone: '+31 10 345 6789',
    BirthDate: '1988-06-05',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'NL',
    PreferredLanguageCode: 'nl-NL'
  },
  {
    FirstName: 'Lena',
    LastName: 'Meyer',
    Email: 'lena.meyer@gmx.at',
    Phone: '+43 664 123 4567',
    BirthDate: '1994-11-30',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'AT',
    PreferredLanguageCode: 'de-AT',
    Classifications: ['DisabledPerson'],
    Notes: 'Austrian guest with mobility challenges. Requires accessible room with wide doorways. Uses wheelchair occasionally. Very appreciative of staff assistance. Independent and positive attitude.'
  },

  // Additional Business Travelers (136-150)
  {
    FirstName: 'Henrik',
    LastName: 'Andersen',
    Email: 'henrik.andersen@nordicsolutions.dk',
    Phone: '+45 33 12 34 56',
    BirthDate: '1979-04-12',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'DK',
    PreferredLanguageCode: 'da-DK',
    Classifications: ['Returning', 'Important'],
    Notes: 'Danish logistics manager with monthly stays. Books same room 510 when available. Needs early breakfast for 7 AM meetings. Professional and efficient.'
  },
  {
    FirstName: 'Natasha',
    LastName: 'Volkov',
    Email: 'natasha.volkov@russiancorp.ru',
    Phone: '+7 495 234 5678',
    BirthDate: '1985-09-23',
    Sex: 'Female',
    Title: 'Misses',
    NationalityCode: 'RU',
    PreferredLanguageCode: 'ru-RU',
    Classifications: ['VeryImportant'],
    Notes: 'Senior executive managing European operations. Requires executive suite and business center access. Often hosts client dinners. High-value corporate account.'
  },
  {
    FirstName: 'Kenji',
    LastName: 'Yamamoto',
    Email: 'kenji.yamamoto@tokyotech.jp',
    Phone: '+81 3 2345 6789',
    BirthDate: '1976-12-08',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'JP',
    PreferredLanguageCode: 'ja-JP',
  },
  {
    FirstName: 'Sophia',
    LastName: 'Van der Meer',
    Email: 'sophia.vandermeer@dutchbank.nl',
    Phone: '+31 20 456 7890',
    BirthDate: '1983-07-19',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'NL',
    PreferredLanguageCode: 'nl-NL',
    Classifications: ['Important', 'Returning'],
    Notes: 'Financial analyst who stays during quarterly audits. Requires quiet workspace. Values reliable WiFi above all. Often extends stays for project completion.'
  },
  {
    FirstName: 'Ahmed',
    LastName: 'Al-Rashid',
    Email: 'ahmed.alrashid@dubaiventures.ae',
    Phone: '+971 4 234 5678',
    BirthDate: '1981-03-27',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'AE',
    PreferredLanguageCode: 'ar-AE',
  },
  {
    FirstName: 'Niamh',
    LastName: 'Kelly',
    Email: 'niamh.kelly@dublinconsult.ie',
    Phone: '+353 1 345 6789',
    BirthDate: '1988-11-14',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'IE',
    PreferredLanguageCode: 'en-IE',
    Classifications: ['Returning'],
    Notes: 'Irish consultant working on European projects. Books multiple times per quarter. Prefers rooms with work desks. Often takes conference calls from room.'
  },
  {
    FirstName: 'Viktor',
    LastName: 'Sokolov',
    Email: 'viktor.sokolov@moscowpartners.ru',
    Phone: '+7 499 123 4567',
    BirthDate: '1977-05-31',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'RU',
    PreferredLanguageCode: 'ru-RU',
  },
  {
    FirstName: 'Li',
    LastName: 'Chen',
    Email: 'li.chen@beijingtech.cn',
    Phone: '+86 10 8765 4321',
    BirthDate: '1984-08-16',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'CN',
    PreferredLanguageCode: 'zh-CN',
    Classifications: ['Important'],
    Notes: 'Chinese tech company representative establishing European partnerships. Professional and detail-oriented. Appreciates cultural sensitivity. Books extended stays for negotiations.'
  },
  {
    FirstName: 'Rajesh',
    LastName: 'Kumar',
    Email: 'rajesh.kumar@mumbaisoft.in',
    Phone: '+91 22 1234 5678',
    BirthDate: '1980-10-22',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'IN',
    PreferredLanguageCode: 'en-IN',
  },
  {
    FirstName: 'Kristina',
    LastName: 'Kovač',
    Email: 'kristina.kovac@zagrebcorp.hr',
    Phone: '+385 1 234 5678',
    BirthDate: '1986-02-09',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'HR',
    PreferredLanguageCode: 'hr-HR',
    Classifications: ['Returning', 'PreviousComplaint'],
    Notes: 'Croatian business development manager. Previous complaint about conference room booking was resolved professionally. Now satisfied regular guest. Appreciates proactive communication.'
  },
  {
    FirstName: 'Takeshi',
    LastName: 'Nakamura',
    Email: 'takeshi.nakamura@osakaind.jp',
    Phone: '+81 6 1234 5678',
    BirthDate: '1975-12-14',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'JP',
    PreferredLanguageCode: 'ja-JP',
  },
  {
    FirstName: 'Eleni',
    LastName: 'Dimitriou',
    Email: 'eleni.dimitriou@athensconsult.gr',
    Phone: '+30 210 234 5678',
    BirthDate: '1989-06-18',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'GR',
    PreferredLanguageCode: 'el-GR',
    Classifications: ['Important'],
    Notes: 'Greek strategy consultant working with European clients. Holds client meetings in hotel conference rooms. Professional and organized. Books multiple rooms for team visits.'
  },
  {
    FirstName: 'Markus',
    LastName: 'Huber',
    Email: 'markus.huber@viennafinance.at',
    Phone: '+43 1 345 6789',
    BirthDate: '1982-09-05',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'AT',
    PreferredLanguageCode: 'de-AT',
  },
  {
    FirstName: 'Soo-Jin',
    LastName: 'Kim',
    Email: 'soojin.kim@seoulcorp.kr',
    Phone: '+82 2 3456 7890',
    BirthDate: '1987-11-29',
    Sex: 'Female',
    Title: 'Miss',
    NationalityCode: 'KR',
    PreferredLanguageCode: 'ko-KR',
    Classifications: ['Returning'],
    Notes: 'South Korean business executive attending trade shows. Books months in advance. Appreciates efficient service. Often requests late check-out for evening flights.'
  },
  {
    FirstName: 'Bjorn',
    LastName: 'Olafsson',
    Email: 'bjorn.olafsson@reykjavikventures.is',
    Phone: '+354 5 123 456',
    BirthDate: '1978-04-07',
    Sex: 'Male',
    Title: 'Mister',
    NationalityCode: 'IS',
    PreferredLanguageCode: 'is-IS',
  }
];

/**
 * Name banks organized by nationality for generating customer variations
 */
const nameVariants: Record<string, { male: string[]; female: string[] }> = {
  GB: {
    male: ['Oliver', 'George', 'Harry', 'Jack', 'Jacob', 'Charlie', 'Thomas', 'Oscar', 'William', 'James'],
    female: ['Olivia', 'Amelia', 'Isla', 'Ava', 'Emily', 'Isabella', 'Mia', 'Poppy', 'Ella', 'Lily']
  },
  US: {
    male: ['Liam', 'Noah', 'Oliver', 'Elijah', 'James', 'William', 'Benjamin', 'Lucas', 'Henry', 'Alexander'],
    female: ['Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Charlotte', 'Mia', 'Amelia', 'Harper', 'Evelyn']
  },
  FR: {
    male: ['Gabriel', 'Raphaël', 'Léo', 'Louis', 'Lucas', 'Adam', 'Arthur', 'Hugo', 'Jules', 'Maël'],
    female: ['Louise', 'Alice', 'Chloé', 'Inès', 'Léa', 'Manon', 'Rose', 'Anna', 'Lina', 'Mila']
  },
  DE: {
    male: ['Noah', 'Matteo', 'Elias', 'Finn', 'Leon', 'Paul', 'Emil', 'Ben', 'Jonas', 'Felix'],
    female: ['Emma', 'Mia', 'Hannah', 'Sophia', 'Anna', 'Lea', 'Marie', 'Lena', 'Lina', 'Emily']
  },
  IT: {
    male: ['Leonardo', 'Francesco', 'Alessandro', 'Lorenzo', 'Matteo', 'Andrea', 'Gabriele', 'Riccardo', 'Tommaso', 'Edoardo'],
    female: ['Sofia', 'Giulia', 'Aurora', 'Alice', 'Ginevra', 'Emma', 'Giorgia', 'Greta', 'Beatrice', 'Anna']
  },
  ES: {
    male: ['Hugo', 'Mateo', 'Martín', 'Lucas', 'Leo', 'Daniel', 'Alejandro', 'Pablo', 'Manuel', 'Álvaro'],
    female: ['Lucía', 'Sofía', 'María', 'Martina', 'Paula', 'Julia', 'Daniela', 'Valeria', 'Alba', 'Emma']
  },
  PL: {
    male: ['Antoni', 'Jakub', 'Jan', 'Szymon', 'Franciszek', 'Filip', 'Aleksander', 'Mikołaj', 'Wojciech', 'Kacper'],
    female: ['Zuzanna', 'Julia', 'Zofia', 'Hanna', 'Maja', 'Lena', 'Alicja', 'Amelia', 'Oliwia', 'Maria']
  },
  SE: {
    male: ['Oscar', 'William', 'Lucas', 'Liam', 'Elias', 'Alexander', 'Hugo', 'Oliver', 'Charlie', 'Leo'],
    female: ['Alice', 'Lilly', 'Maja', 'Elsa', 'Ella', 'Alicia', 'Olivia', 'Julia', 'Ebba', 'Wilma']
  },
  NL: {
    male: ['Noah', 'Sem', 'Lucas', 'Daan', 'Levi', 'Finn', 'Luuk', 'Bram', 'Thijs', 'Milan'],
    female: ['Emma', 'Tess', 'Sophie', 'Julia', 'Lisa', 'Anna', 'Eva', 'Sara', 'Mila', 'Noor']
  },
  PT: {
    male: ['Santiago', 'Francisco', 'João', 'Afonso', 'Tomás', 'Martim', 'Rodrigo', 'Miguel', 'Guilherme', 'Duarte'],
    female: ['Matilde', 'Leonor', 'Beatriz', 'Mariana', 'Carolina', 'Ana', 'Inês', 'Sofia', 'Maria', 'Francisca']
  },
  CZ: {
    male: ['Jakub', 'Jan', 'Tomáš', 'Adam', 'Matěj', 'Lukáš', 'Filip', 'Ondřej', 'Vojtěch', 'Marek'],
    female: ['Tereza', 'Eliška', 'Anna', 'Natálie', 'Karolína', 'Adéla', 'Viktorie', 'Barbora', 'Sofie', 'Lucie']
  },
  DK: {
    male: ['William', 'Oliver', 'Noah', 'Oscar', 'Lucas', 'Carl', 'Victor', 'Magnus', 'Frederik', 'Emil'],
    female: ['Emma', 'Ida', 'Clara', 'Laura', 'Sofia', 'Anna', 'Ella', 'Isabella', 'Freja', 'Alma']
  },
  RO: {
    male: ['David', 'Andrei', 'Alexandru', 'Ștefan', 'Luca', 'Matei', 'Mihai', 'Darius', 'Gabriel', 'Cristian'],
    female: ['Maria', 'Elena', 'Ioana', 'Andreea', 'Ana', 'Alexandra', 'Sofia', 'Gabriela', 'Daria', 'Antonia']
  },
  JP: {
    male: ['Haruto', 'Yuto', 'Sota', 'Hinata', 'Kaito', 'Riku', 'Sora', 'Ren', 'Yuma', 'Hayato'],
    female: ['Hina', 'Yui', 'Sakura', 'Aoi', 'Yuna', 'Mei', 'Mio', 'Rin', 'Honoka', 'Akari']
  },
  RU: {
    male: ['Alexander', 'Mikhail', 'Ivan', 'Dmitry', 'Maxim', 'Artem', 'Andrey', 'Sergey', 'Nikita', 'Kirill'],
    female: ['Sofia', 'Maria', 'Anna', 'Anastasia', 'Victoria', 'Daria', 'Polina', 'Alina', 'Elizaveta', 'Ekaterina']
  },
  IE: {
    male: ['Jack', 'James', 'Noah', 'Conor', 'Daniel', 'Finn', 'Liam', 'Oisín', 'Cillian', 'Ryan'],
    female: ['Emily', 'Grace', 'Fiadh', 'Sophie', 'Ava', 'Amelia', 'Ella', 'Emma', 'Mia', 'Hannah']
  },
  GR: {
    male: ['Georgios', 'Dimitrios', 'Konstantinos', 'Ioannis', 'Nikolaos', 'Christos', 'Panagiotis', 'Andreas', 'Alexandros', 'Vasileios'],
    female: ['Maria', 'Eleni', 'Aikaterini', 'Sofia', 'Dimitra', 'Vasiliki', 'Anna', 'Georgia', 'Konstantina', 'Christina']
  },
  NO: {
    male: ['Jakob', 'Emil', 'Noah', 'Oliver', 'Filip', 'William', 'Lucas', 'Aksel', 'Oskar', 'Magnus'],
    female: ['Emma', 'Nora', 'Ella', 'Sofie', 'Olivia', 'Ingrid', 'Emilie', 'Leah', 'Sara', 'Tiril']
  },
  CH: {
    male: ['Noah', 'Liam', 'Luca', 'David', 'Leon', 'Elia', 'Gabriel', 'Samuel', 'Ben', 'Louis'],
    female: ['Mia', 'Emma', 'Elena', 'Lina', 'Mila', 'Emilia', 'Sofia', 'Anna', 'Laura', 'Lea']
  },
  default: {
    male: ['Michael', 'David', 'John', 'Daniel', 'Matthew', 'Christopher', 'Andrew', 'Joseph', 'Robert', 'Brian'],
    female: ['Sarah', 'Jennifer', 'Jessica', 'Michelle', 'Amanda', 'Ashley', 'Rebecca', 'Laura', 'Nicole', 'Rachel']
  }
};

const lastNameVariants: string[] = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White',
  'Harris', 'Clark', 'Lewis', 'Walker', 'Hall', 'Young', 'Allen', 'King', 'Wright', 'Scott',
  'Green', 'Baker', 'Adams', 'Nelson', 'Hill', 'Mitchell', 'Campbell', 'Roberts', 'Carter', 'Phillips'
];

/**
 * Generates a variation of an existing customer profile
 * Creates a deterministic but varied customer based on the original
 */
function generateCustomerVariation(baseCustomer: SampleCustomer, index: number): SampleCustomer {
  const nationality = baseCustomer.NationalityCode || 'GB';
  const sex = baseCustomer.Sex || 'Male';

  // Get name banks for this nationality
  const nameBank = nameVariants[nationality] || nameVariants.default;
  const firstNames = sex === 'Male' ? nameBank.male : nameBank.female;

  // Use deterministic selection based on index
  const firstNameIndex = index % firstNames.length;
  const lastNameIndex = index % lastNameVariants.length;

  const newFirstName = firstNames[firstNameIndex];
  const newLastName = lastNameVariants[lastNameIndex];

  // Generate email based on new name
  const emailDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'icloud.com', 'protonmail.com'];
  const domainIndex = index % emailDomains.length;
  const newEmail = `${newFirstName.toLowerCase()}.${newLastName.toLowerCase()}@${emailDomains[domainIndex]}`;

  // Generate variation of phone number if original exists
  let newPhone: string | undefined;
  if (baseCustomer.Phone) {
    // Keep the country code, vary the last 4 digits
    const basePhone = baseCustomer.Phone.replace(/\d{4}$/, '');
    const newDigits = String(1000 + (index * 123) % 9000).padStart(4, '0');
    newPhone = basePhone + newDigits;
  }

  // Vary birth date by +/- a few years
  let newBirthDate: string | undefined;
  if (baseCustomer.BirthDate) {
    const baseDate = new Date(baseCustomer.BirthDate);
    const yearOffset = ((index % 7) - 3); // Offset by -3 to +3 years
    baseDate.setFullYear(baseDate.getFullYear() + yearOffset);
    newBirthDate = baseDate.toISOString().split('T')[0];
  }

  return {
    FirstName: newFirstName,
    LastName: newLastName,
    Email: newEmail,
    Phone: newPhone,
    BirthDate: newBirthDate,
    Sex: baseCustomer.Sex,
    Title: baseCustomer.Title,
    NationalityCode: baseCustomer.NationalityCode,
    PreferredLanguageCode: baseCustomer.PreferredLanguageCode,
    Classifications: baseCustomer.Classifications, // Keep the same classifications
    Notes: baseCustomer.Notes // Keep the same notes pattern
  };
}

/**
 * Generate additional customers based on variations of the base customers
 * Generates variations to reach a total of 300 customers
 */
const generatedCustomers: SampleCustomer[] = [];
const baseCount = sampleCustomers.length;
const targetTotal = 300;
const variationsNeeded = targetTotal - baseCount;

for (let i = 0; i < variationsNeeded; i++) {
  // Cycle through base customers to create variations
  const baseIndex = i % baseCount;
  const baseCustomer = sampleCustomers[baseIndex];
  const variation = generateCustomerVariation(baseCustomer, i);
  generatedCustomers.push(variation);
}

// Combine base and generated customers for a total of 300
const allCustomers = [...sampleCustomers, ...generatedCustomers];

/**
 * Get sample customers with optional count parameter
 * If count > 300, cycles through the 300 profiles with modified emails
 *
 * @param count - Number of customers to return (default: 300)
 * @returns Array of customer profiles
 */
export function getSampleCustomers(count: number = 300): SampleCustomer[] {
  if (count <= 300) {
    return allCustomers.slice(0, count);
  }

  // For counts > 300, cycle through customers with modified emails
  const result: SampleCustomer[] = [...allCustomers];
  const cyclesNeeded = Math.ceil((count - 300) / 300);

  for (let cycle = 1; cycle <= cyclesNeeded; cycle++) {
    const remainingCount = Math.min(300, count - result.length);

    for (let i = 0; i < remainingCount; i++) {
      const baseCustomer = allCustomers[i];
      const cycledCustomer = {
        ...baseCustomer,
        Email: baseCustomer.Email.replace('@', `+${cycle}@`) // Modify email with +N suffix
      };
      result.push(cycledCustomer);
    }
  }

  return result.slice(0, count);
}
