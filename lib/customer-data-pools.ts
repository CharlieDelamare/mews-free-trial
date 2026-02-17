/**
 * Customer Data Pools — static data used by the dynamic customer generator
 *
 * Contains pools of first names (by nationality), last names (by nationality),
 * email domains, phone prefixes, note templates, classification probabilities,
 * and nationality distribution weights. The generator randomly picks from these
 * pools to create unique customer profiles each time.
 */

// ---------------------------------------------------------------------------
// First names by nationality code — ~30 per gender per nationality
// ---------------------------------------------------------------------------

export const firstNamesByNationality: Record<string, { male: string[]; female: string[] }> = {
  GB: {
    male: ['Oliver', 'George', 'Harry', 'Jack', 'Noah', 'Charlie', 'Thomas', 'Oscar', 'William', 'James',
           'Henry', 'Leo', 'Alfie', 'Edward', 'Freddie', 'Archie', 'Arthur', 'Ethan', 'Alexander', 'Joseph',
           'Samuel', 'Daniel', 'Logan', 'Benjamin', 'Lucas', 'Isaac', 'Jacob', 'Theo', 'Max', 'Sebastian'],
    female: ['Olivia', 'Amelia', 'Isla', 'Ava', 'Mia', 'Isabella', 'Sophia', 'Grace', 'Lily', 'Freya',
             'Emily', 'Ivy', 'Ella', 'Rosie', 'Florence', 'Willow', 'Poppy', 'Charlotte', 'Daisy', 'Jessica',
             'Evie', 'Phoebe', 'Sophie', 'Alice', 'Ruby', 'Sienna', 'Harper', 'Millie', 'Elsie', 'Aria']
  },
  US: {
    male: ['Liam', 'Noah', 'Oliver', 'Elijah', 'James', 'William', 'Benjamin', 'Lucas', 'Henry', 'Theodore',
           'Jack', 'Levi', 'Alexander', 'Mason', 'Ethan', 'Jacob', 'Michael', 'Daniel', 'Logan', 'Jackson',
           'Sebastian', 'Aiden', 'Matthew', 'Owen', 'Samuel', 'Ryan', 'Nathan', 'Carter', 'Luke', 'Dylan'],
    female: ['Olivia', 'Emma', 'Charlotte', 'Amelia', 'Sophia', 'Mia', 'Isabella', 'Ava', 'Evelyn', 'Luna',
             'Harper', 'Sofia', 'Camila', 'Eleanor', 'Elizabeth', 'Violet', 'Scarlett', 'Emily', 'Aria', 'Penelope',
             'Chloe', 'Layla', 'Mila', 'Nora', 'Hazel', 'Madison', 'Ellie', 'Lily', 'Nova', 'Riley']
  },
  FR: {
    male: ['Gabriel', 'Léo', 'Raphaël', 'Arthur', 'Louis', 'Jules', 'Adam', 'Lucas', 'Hugo', 'Maël',
           'Noah', 'Liam', 'Ethan', 'Paul', 'Nathan', 'Théo', 'Sacha', 'Tom', 'Mathis', 'Antoine',
           'Maxime', 'Alexandre', 'Pierre', 'Victor', 'Clément', 'Julien', 'Nicolas', 'Baptiste', 'Romain', 'Émile'],
    female: ['Emma', 'Jade', 'Louise', 'Alice', 'Léa', 'Chloé', 'Rose', 'Ambre', 'Anna', 'Mia',
             'Léonie', 'Inès', 'Lina', 'Juliette', 'Manon', 'Camille', 'Zoé', 'Eva', 'Sarah', 'Charlotte',
             'Marie', 'Margaux', 'Anaïs', 'Clara', 'Élise', 'Mathilde', 'Céline', 'Aurélie', 'Pauline', 'Noémie']
  },
  DE: {
    male: ['Noah', 'Matteo', 'Elias', 'Finn', 'Leon', 'Paul', 'Ben', 'Luca', 'Emil', 'Louis',
           'Felix', 'Henry', 'Theo', 'Lukas', 'Jonas', 'Maximilian', 'Julian', 'Moritz', 'Niklas', 'Tim',
           'Jan', 'David', 'Sebastian', 'Alexander', 'Tobias', 'Florian', 'Simon', 'Daniel', 'Philipp', 'Stefan'],
    female: ['Emilia', 'Mia', 'Sophia', 'Emma', 'Hannah', 'Lina', 'Ella', 'Mila', 'Marie', 'Clara',
             'Lea', 'Lena', 'Anna', 'Luisa', 'Johanna', 'Laura', 'Julia', 'Nele', 'Sophie', 'Charlotte',
             'Katharina', 'Lisa', 'Sarah', 'Amelie', 'Frieda', 'Ida', 'Greta', 'Helena', 'Marlene', 'Nina']
  },
  IT: {
    male: ['Leonardo', 'Francesco', 'Alessandro', 'Lorenzo', 'Mattia', 'Andrea', 'Gabriele', 'Riccardo', 'Tommaso', 'Edoardo',
           'Marco', 'Luca', 'Giuseppe', 'Davide', 'Antonio', 'Stefano', 'Matteo', 'Federico', 'Giovanni', 'Simone',
           'Roberto', 'Pietro', 'Filippo', 'Giacomo', 'Nicola', 'Emanuele', 'Daniele', 'Michele', 'Paolo', 'Diego'],
    female: ['Sofia', 'Aurora', 'Giulia', 'Ginevra', 'Alice', 'Beatrice', 'Emma', 'Vittoria', 'Ludovica', 'Matilde',
             'Anna', 'Chiara', 'Sara', 'Francesca', 'Elena', 'Valentina', 'Alessia', 'Martina', 'Elisa', 'Giorgia',
             'Camilla', 'Arianna', 'Bianca', 'Greta', 'Marta', 'Serena', 'Laura', 'Silvia', 'Ilaria', 'Lucia']
  },
  ES: {
    male: ['Hugo', 'Mateo', 'Martín', 'Lucas', 'Leo', 'Daniel', 'Alejandro', 'Pablo', 'Manuel', 'Álvaro',
           'Adrián', 'David', 'Mario', 'Diego', 'Javier', 'Carlos', 'Miguel', 'Jorge', 'Sergio', 'Iván',
           'Rafael', 'Fernando', 'Ángel', 'Rubén', 'Pedro', 'Antonio', 'Tomás', 'Alberto', 'Francisco', 'Enrique'],
    female: ['Lucía', 'Sofía', 'Martina', 'María', 'Julia', 'Paula', 'Emma', 'Daniela', 'Valentina', 'Alba',
             'Carmen', 'Noa', 'Claudia', 'Elena', 'Isabel', 'Laura', 'Irene', 'Adriana', 'Sara', 'Ana',
             'Marta', 'Inés', 'Natalia', 'Andrea', 'Cristina', 'Patricia', 'Rocío', 'Pilar', 'Beatriz', 'Rosa']
  },
  PL: {
    male: ['Antoni', 'Jakub', 'Jan', 'Szymon', 'Aleksander', 'Franciszek', 'Filip', 'Mikołaj', 'Wojciech', 'Kacper',
           'Adam', 'Michał', 'Marcel', 'Stanisław', 'Wiktor', 'Piotr', 'Tomasz', 'Mateusz', 'Krzysztof', 'Łukasz',
           'Dawid', 'Bartosz', 'Maciej', 'Kamil', 'Paweł', 'Robert', 'Marcin', 'Grzegorz', 'Rafał', 'Sebastian'],
    female: ['Zuzanna', 'Julia', 'Maja', 'Zofia', 'Hanna', 'Lena', 'Alicja', 'Maria', 'Amelia', 'Oliwia',
             'Laura', 'Emilia', 'Wiktoria', 'Natalia', 'Aleksandra', 'Anna', 'Karolina', 'Magdalena', 'Agnieszka', 'Katarzyna',
             'Monika', 'Dorota', 'Ewa', 'Joanna', 'Marta', 'Barbara', 'Patrycja', 'Kinga', 'Izabela', 'Beata']
  },
  SE: {
    male: ['Noah', 'William', 'Hugo', 'Lucas', 'Liam', 'Oscar', 'Oliver', 'Adam', 'Elias', 'Filip',
           'Leo', 'Alexander', 'Viktor', 'Erik', 'Emil', 'Axel', 'Gustav', 'Albin', 'Isak', 'Arvid',
           'Nils', 'Anders', 'Karl', 'Lars', 'Johan', 'Mattias', 'Henrik', 'Fredrik', 'Magnus', 'Per'],
    female: ['Alice', 'Maja', 'Elsa', 'Astrid', 'Wilma', 'Saga', 'Freja', 'Ebba', 'Ella', 'Alma',
             'Olivia', 'Selma', 'Stella', 'Agnes', 'Nora', 'Emilia', 'Elin', 'Linnéa', 'Ida', 'Julia',
             'Anna', 'Sara', 'Maria', 'Emma', 'Hanna', 'Klara', 'Sigrid', 'Ingrid', 'Lovisa', 'Karin']
  },
  PT: {
    male: ['Santiago', 'Francisco', 'Tomás', 'João', 'Afonso', 'Rodrigo', 'Martim', 'Guilherme', 'Duarte', 'Miguel',
           'Pedro', 'Rafael', 'Gabriel', 'Tiago', 'Diogo', 'André', 'Gonçalo', 'Daniel', 'Bernardo', 'Henrique',
           'Bruno', 'Ricardo', 'Hugo', 'Nuno', 'Paulo', 'José', 'Filipe', 'Luís', 'Rui', 'Carlos'],
    female: ['Maria', 'Leonor', 'Matilde', 'Beatriz', 'Carolina', 'Ana', 'Mariana', 'Inês', 'Sofia', 'Francisca',
             'Clara', 'Laura', 'Diana', 'Rita', 'Madalena', 'Lara', 'Catarina', 'Joana', 'Sara', 'Eva',
             'Teresa', 'Raquel', 'Helena', 'Filipa', 'Daniela', 'Patrícia', 'Andreia', 'Susana', 'Marta', 'Isabel']
  },
  CZ: {
    male: ['Jakub', 'Jan', 'Tomáš', 'Adam', 'Filip', 'Vojtěch', 'Lukáš', 'Matyáš', 'Ondřej', 'Daniel',
           'David', 'Matěj', 'Martin', 'Petr', 'Michal', 'Pavel', 'Jiří', 'Karel', 'Václav', 'Josef',
           'Marek', 'Radek', 'Milan', 'Jaroslav', 'Vladimír', 'Roman', 'Aleš', 'Zdeněk', 'Stanislav', 'Ivan'],
    female: ['Eliška', 'Anna', 'Adéla', 'Tereza', 'Sofie', 'Karolína', 'Natálie', 'Viktorie', 'Barbora', 'Nela',
             'Marie', 'Lucie', 'Kateřina', 'Hana', 'Jana', 'Petra', 'Lenka', 'Markéta', 'Eva', 'Veronika',
             'Monika', 'Michaela', 'Simona', 'Kristýna', 'Klára', 'Zuzana', 'Alena', 'Ivana', 'Martina', 'Jitka']
  },
  NL: {
    male: ['Noah', 'Sem', 'Liam', 'Lucas', 'Daan', 'Finn', 'Levi', 'James', 'Milan', 'Jesse',
           'Bram', 'Lars', 'Thijs', 'Tim', 'Thomas', 'Stijn', 'Ruben', 'Max', 'Sander', 'Pieter',
           'Jeroen', 'Wouter', 'Bas', 'Joris', 'Maarten', 'Dirk', 'Hendrik', 'Jan', 'Willem', 'Koen'],
    female: ['Emma', 'Julia', 'Mila', 'Sophie', 'Zoë', 'Sara', 'Anna', 'Noor', 'Eva', 'Lotte',
             'Sanne', 'Lisa', 'Fleur', 'Femke', 'Iris', 'Anouk', 'Daphne', 'Lieke', 'Nina', 'Roos',
             'Esmée', 'Maud', 'Floor', 'Tessa', 'Anne', 'Britt', 'Marieke', 'Eline', 'Milou', 'Naomi']
  },
  JP: {
    male: ['Haruto', 'Yuto', 'Sota', 'Haruki', 'Minato', 'Riku', 'Kaito', 'Asahi', 'Aoto', 'Hinata',
           'Ren', 'Yuma', 'Sora', 'Takumi', 'Kento', 'Ryota', 'Daiki', 'Shota', 'Kenji', 'Naoki',
           'Hiroshi', 'Takeshi', 'Masato', 'Yuki', 'Akira', 'Satoshi', 'Kazuki', 'Shingo', 'Taro', 'Koji'],
    female: ['Hina', 'Yui', 'Mio', 'Ichika', 'Koharu', 'Sakura', 'Akari', 'Himari', 'Rio', 'Yuna',
             'Mei', 'Aoi', 'Riko', 'Saki', 'Haruka', 'Yuki', 'Nanami', 'Momoka', 'Ayaka', 'Misaki',
             'Rina', 'Kanako', 'Tomoko', 'Chika', 'Emi', 'Keiko', 'Noriko', 'Yoko', 'Maki', 'Asuka']
  },
  KR: {
    male: ['Minjun', 'Seo-jun', 'Ha-jun', 'Do-yun', 'Eun-woo', 'Si-woo', 'Ji-ho', 'Ye-jun', 'Jun-seo', 'Hyun-woo',
           'Tae-hyung', 'Jin-woo', 'Sung-min', 'Jae-hyun', 'Min-ho', 'Young-jae', 'Dong-hyun', 'Seung-ho', 'Woo-jin', 'Kyung-soo',
           'Jun-ho', 'Sang-woo', 'Hye-sung', 'Joon-young', 'Dae-sung', 'Ki-tae', 'Byung-hun', 'Chang-min', 'In-sung', 'Hwan'],
    female: ['Seo-yeon', 'Ha-yoon', 'Ji-woo', 'Seo-yoon', 'Min-seo', 'Ha-eun', 'Ji-yoo', 'Ye-eun', 'Su-ah', 'Ji-ah',
             'Eun-ji', 'Yoo-jin', 'So-yeon', 'Ji-hye', 'Hye-jin', 'Min-young', 'Soo-jin', 'Na-young', 'Da-hye', 'Yeon-joo',
             'Sun-hee', 'Bo-ram', 'Ji-eun', 'Hee-young', 'Se-young', 'Soo-yeon', 'Min-ji', 'Jung-eun', 'Ga-young', 'Mi-sun']
  },
  DK: {
    male: ['William', 'Noah', 'Oscar', 'Lucas', 'Oliver', 'Alfred', 'Carl', 'Victor', 'Emil', 'Valdemar',
           'Magnus', 'Frederik', 'Christian', 'Rasmus', 'Mikkel', 'Mads', 'Søren', 'Anders', 'Peter', 'Lars',
           'Henrik', 'Thomas', 'Jens', 'Nikolaj', 'Kasper', 'Jakob', 'Mathias', 'Martin', 'Simon', 'Erik'],
    female: ['Alma', 'Ida', 'Clara', 'Freja', 'Ella', 'Nora', 'Sofia', 'Agnes', 'Anna', 'Karla',
             'Emma', 'Laura', 'Mathilde', 'Olivia', 'Maja', 'Emilie', 'Julie', 'Marie', 'Sarah', 'Sofie',
             'Camilla', 'Lærke', 'Signe', 'Astrid', 'Katrine', 'Cecilie', 'Rikke', 'Mette', 'Hanne', 'Lone']
  },
  FI: {
    male: ['Oliver', 'Elias', 'Leo', 'Väinö', 'Onni', 'Eino', 'Noel', 'Eeli', 'Leevi', 'Toivo',
           'Aleksi', 'Mikael', 'Matti', 'Juha', 'Jari', 'Antti', 'Timo', 'Pekka', 'Kari', 'Heikki',
           'Jukka', 'Markku', 'Tuomas', 'Ville', 'Lauri', 'Petri', 'Ilkka', 'Sami', 'Olli', 'Kimmo'],
    female: ['Aino', 'Eevi', 'Emma', 'Sofia', 'Helmi', 'Aada', 'Ella', 'Lilja', 'Olivia', 'Venla',
             'Anni', 'Emilia', 'Saara', 'Minna', 'Päivi', 'Tiina', 'Sari', 'Leena', 'Hanna', 'Kaisa',
             'Johanna', 'Riikka', 'Elina', 'Tuula', 'Maija', 'Sirpa', 'Helena', 'Katja', 'Anu', 'Piia']
  },
  EE: {
    male: ['Rasmus', 'Robin', 'Oliver', 'Hugo', 'Sebastian', 'Mattias', 'Marcus', 'Karl', 'Martin', 'Erik',
           'Andres', 'Priit', 'Toomas', 'Jüri', 'Indrek', 'Meelis', 'Raivo', 'Urmas', 'Margus', 'Tarmo',
           'Kristjan', 'Siim', 'Ott', 'Jaak', 'Madis', 'Hannes', 'Tõnu', 'Peeter', 'Aivar', 'Marko'],
    female: ['Sofia', 'Maria', 'Mia', 'Hanna', 'Emily', 'Liisa', 'Emma', 'Anna', 'Sandra', 'Laura',
             'Kadri', 'Marika', 'Piret', 'Tiina', 'Karin', 'Sirje', 'Eve', 'Ülle', 'Katrin', 'Riina',
             'Merle', 'Triin', 'Kristiina', 'Liina', 'Anu', 'Maarika', 'Epp', 'Helen', 'Mari', 'Kristi']
  },
  AT: {
    male: ['Paul', 'David', 'Felix', 'Maximilian', 'Leon', 'Elias', 'Tobias', 'Jonas', 'Lukas', 'Alexander',
           'Sebastian', 'Florian', 'Michael', 'Thomas', 'Daniel', 'Matthias', 'Andreas', 'Markus', 'Stefan', 'Christian',
           'Bernhard', 'Wolfgang', 'Franz', 'Josef', 'Peter', 'Georg', 'Martin', 'Christoph', 'Patrick', 'Manuel'],
    female: ['Anna', 'Emma', 'Marie', 'Lena', 'Laura', 'Emilia', 'Valentina', 'Mia', 'Sarah', 'Johanna',
             'Katharina', 'Sophie', 'Lisa', 'Julia', 'Elisabeth', 'Maria', 'Eva', 'Christina', 'Birgit', 'Claudia',
             'Susanne', 'Andrea', 'Martina', 'Nicole', 'Sabine', 'Petra', 'Monika', 'Barbara', 'Ingrid', 'Gerlinde']
  },
  BE: {
    male: ['Louis', 'Arthur', 'Noah', 'Lucas', 'Liam', 'Adam', 'Victor', 'Jules', 'Théo', 'Gabriel',
           'Thomas', 'Wout', 'Bram', 'Jef', 'Pieter', 'Jan', 'Arne', 'Thibaut', 'Maxime', 'Nicolas',
           'Antoine', 'Mathieu', 'Olivier', 'Philippe', 'Laurent', 'Stéphane', 'Marc', 'Patrick', 'Yves', 'Luc'],
    female: ['Emma', 'Louise', 'Olivia', 'Charlotte', 'Alice', 'Mila', 'Juliette', 'Noor', 'Elena', 'Marie',
             'An', 'Lies', 'Eva', 'Sofie', 'Laura', 'Sarah', 'Julie', 'Nathalie', 'Isabelle', 'Anne',
             'Céline', 'Elise', 'Claire', 'Caroline', 'Véronique', 'Katrien', 'Leen', 'Griet', 'Hilde', 'Lotte']
  },
  HU: {
    male: ['Bence', 'Máté', 'Dominik', 'Levente', 'Ádám', 'Dávid', 'Noel', 'Marcell', 'Balázs', 'Zsolt',
           'László', 'István', 'János', 'Gábor', 'Ferenc', 'Péter', 'Tamás', 'Zoltán', 'Attila', 'Csaba',
           'Tibor', 'József', 'András', 'Sándor', 'Imre', 'Gyula', 'Béla', 'Lajos', 'Miklós', 'Károly'],
    female: ['Hanna', 'Anna', 'Luca', 'Emma', 'Zoé', 'Boglárka', 'Lili', 'Nóra', 'Maja', 'Léna',
             'Katalin', 'Éva', 'Mária', 'Erzsébet', 'Ilona', 'Judit', 'Ágnes', 'Zsuzsa', 'Erika', 'Krisztina',
             'Andrea', 'Mónika', 'Szilvia', 'Tímea', 'Anita', 'Nikolett', 'Dóra', 'Vivien', 'Petra', 'Réka']
  },
  IE: {
    male: ['Jack', 'James', 'Noah', 'Conor', 'Daniel', 'Finn', 'Liam', 'Oisín', 'Cillian', 'Ryan',
           'Patrick', 'Sean', 'Michael', 'Padraig', 'Ciaran', 'Niall', 'Eoin', 'Declan', 'Kevin', 'Brian',
           'Ronan', 'Diarmuid', 'Fergus', 'Colm', 'Donal', 'Cathal', 'Aidan', 'Brendan', 'Dermot', 'Shane'],
    female: ['Emily', 'Grace', 'Fiadh', 'Sophie', 'Ava', 'Amelia', 'Ella', 'Emma', 'Mia', 'Hannah',
             'Aoife', 'Saoirse', 'Ciara', 'Niamh', 'Siobhán', 'Mairéad', 'Caoimhe', 'Sinéad', 'Deirdre', 'Orla',
             'Brigid', 'Maeve', 'Clodagh', 'Ailbhe', 'Róisín', 'Aisling', 'Grainne', 'Shauna', 'Eimear', 'Tara']
  },
  GR: {
    male: ['Georgios', 'Dimitrios', 'Konstantinos', 'Ioannis', 'Nikolaos', 'Christos', 'Panagiotis', 'Andreas', 'Alexandros', 'Vasileios',
           'Michail', 'Athanasios', 'Spyridon', 'Evangelos', 'Theodoros', 'Petros', 'Eleftherios', 'Stefanos', 'Antonios', 'Sotirios',
           'Emmanouil', 'Kostas', 'Yannis', 'Nikos', 'Stavros', 'Pavlos', 'Ilias', 'Angelos', 'Markos', 'Grigorios'],
    female: ['Maria', 'Eleni', 'Aikaterini', 'Sofia', 'Dimitra', 'Vasiliki', 'Anna', 'Georgia', 'Konstantina', 'Christina',
             'Panagiota', 'Sophia', 'Ioanna', 'Alexandra', 'Evangelia', 'Theodora', 'Nikoleta', 'Despoina', 'Paraskevi', 'Stavroula',
             'Athena', 'Daphne', 'Irini', 'Katerina', 'Chrysa', 'Foteini', 'Antonia', 'Angeliki', 'Marina', 'Stella']
  },
  NO: {
    male: ['Jakob', 'Emil', 'Noah', 'Oliver', 'Filip', 'William', 'Lucas', 'Aksel', 'Oskar', 'Magnus',
           'Henrik', 'Lars', 'Erik', 'Olav', 'Knut', 'Bjørn', 'Sigurd', 'Håkon', 'Leif', 'Tor',
           'Anders', 'Kristian', 'Johan', 'Martin', 'Petter', 'Trond', 'Geir', 'Svein', 'Rune', 'Arne'],
    female: ['Emma', 'Nora', 'Ella', 'Sofie', 'Olivia', 'Ingrid', 'Emilie', 'Leah', 'Sara', 'Tiril',
             'Astrid', 'Hilde', 'Solveig', 'Sigrid', 'Ragnhild', 'Marit', 'Liv', 'Anne', 'Kari', 'Grete',
             'Berit', 'Kirsten', 'Maren', 'Thea', 'Amalie', 'Aurora', 'Frida', 'Ida', 'Maja', 'Tuva']
  },
  CH: {
    male: ['Noah', 'Liam', 'Luca', 'David', 'Leon', 'Elia', 'Gabriel', 'Samuel', 'Ben', 'Louis',
           'Matteo', 'Lukas', 'Alexander', 'Fabian', 'Nico', 'Raphael', 'Florian', 'Marco', 'Stefan', 'Thomas',
           'Andreas', 'Daniel', 'Christian', 'Patrick', 'Beat', 'Reto', 'Ueli', 'Hans', 'Werner', 'Roland'],
    female: ['Mia', 'Emma', 'Elena', 'Lina', 'Mila', 'Emilia', 'Sofia', 'Anna', 'Laura', 'Lea',
             'Sara', 'Julia', 'Nina', 'Lara', 'Alina', 'Chiara', 'Valentina', 'Nadia', 'Corinne', 'Sandra',
             'Monika', 'Ursula', 'Brigitte', 'Ruth', 'Claudia', 'Verena', 'Margrit', 'Heidi', 'Franziska', 'Kathrin']
  },
  RO: {
    male: ['Andrei', 'Alexandru', 'David', 'Daniel', 'Mihai', 'Gabriel', 'Stefan', 'Ion', 'Nicolae', 'Cristian',
           'Adrian', 'Marius', 'Florin', 'Bogdan', 'Dragos', 'Vlad', 'Radu', 'Sorin', 'Lucian', 'Razvan',
           'Cosmin', 'Ciprian', 'Catalin', 'Ionut', 'Alin', 'Ovidiu', 'Liviu', 'Dumitru', 'Gheorghe', 'Vasile'],
    female: ['Maria', 'Ana', 'Elena', 'Ioana', 'Sofia', 'Andreea', 'Alexandra', 'Cristina', 'Mihaela', 'Laura',
             'Diana', 'Raluca', 'Adriana', 'Simona', 'Monica', 'Daniela', 'Gabriela', 'Alina', 'Carmen', 'Roxana',
             'Irina', 'Luminita', 'Florentina', 'Nicoleta', 'Ramona', 'Camelia', 'Denisa', 'Bianca', 'Oana', 'Dana']
  },
  RU: {
    male: ['Alexander', 'Dmitry', 'Maxim', 'Ivan', 'Artem', 'Mikhail', 'Daniil', 'Kirill', 'Andrei', 'Nikita',
           'Sergei', 'Vladimir', 'Nikolai', 'Alexei', 'Pavel', 'Oleg', 'Igor', 'Boris', 'Yuri', 'Viktor',
           'Evgeny', 'Valery', 'Anatoly', 'Konstantin', 'Roman', 'Stanislav', 'Gennady', 'Fyodor', 'Leonid', 'Timofei'],
    female: ['Sofia', 'Maria', 'Anna', 'Anastasia', 'Victoria', 'Polina', 'Elizaveta', 'Daria', 'Alisa', 'Varvara',
             'Ekaterina', 'Natalia', 'Olga', 'Tatiana', 'Irina', 'Elena', 'Svetlana', 'Marina', 'Yulia', 'Galina',
             'Nadezhda', 'Lyudmila', 'Valentina', 'Larisa', 'Tamara', 'Vera', 'Ksenia', 'Alina', 'Darya', 'Yana']
  },
  default: {
    male: ['Michael', 'David', 'John', 'Daniel', 'Matthew', 'Christopher', 'Andrew', 'Joseph', 'Robert', 'Brian',
           'James', 'William', 'Thomas', 'Alexander', 'Samuel', 'Benjamin', 'Nicholas', 'Jonathan', 'Stephen', 'Patrick',
           'Anthony', 'Timothy', 'Richard', 'Kevin', 'Philip', 'Edward', 'Mark', 'George', 'Peter', 'Paul'],
    female: ['Sarah', 'Jennifer', 'Jessica', 'Michelle', 'Amanda', 'Ashley', 'Rebecca', 'Laura', 'Nicole', 'Rachel',
             'Elizabeth', 'Katherine', 'Stephanie', 'Megan', 'Christina', 'Hannah', 'Victoria', 'Alexandra', 'Natalie', 'Emma',
             'Caroline', 'Samantha', 'Danielle', 'Allison', 'Catherine', 'Margaret', 'Diana', 'Helen', 'Claire', 'Linda']
  }
};

// ---------------------------------------------------------------------------
// Last names by nationality code — ~20 per nationality
// ---------------------------------------------------------------------------

export const lastNamesByNationality: Record<string, string[]> = {
  GB: [
    'Thompson', 'Williams', 'Taylor', 'Brown', 'Davies', 'Evans', 'Wilson', 'Roberts', 'Johnson', 'Walker',
    'Wright', 'Robinson', 'Hall', 'Clark', 'Harrison', 'Baker', 'Cooper', 'Bennett', 'Morris', 'Phillips'
  ],
  US: [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor',
    'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker'
  ],
  FR: [
    'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau',
    'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Girard', 'Bonnet'
  ],
  DE: [
    'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann',
    'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann'
  ],
  IT: [
    'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco',
    'Bruno', 'Gallo', 'Conti', 'De Luca', 'Costa', 'Mancini', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti'
  ],
  ES: [
    'García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández', 'Pérez', 'Sánchez', 'Ramírez', 'Torres',
    'Flores', 'Rivera', 'Gómez', 'Díaz', 'Reyes', 'Morales', 'Jiménez', 'Ruiz', 'Álvarez', 'Romero'
  ],
  PL: [
    'Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski', 'Zieliński', 'Szymański', 'Woźniak',
    'Dąbrowski', 'Kozłowski', 'Jankowski', 'Mazur', 'Kwiatkowski', 'Krawczyk', 'Piotrowski', 'Grabowski', 'Pawlak', 'Michalski'
  ],
  SE: [
    'Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson', 'Svensson', 'Gustafsson',
    'Pettersson', 'Jonsson', 'Jansson', 'Hansson', 'Bengtsson', 'Jönsson', 'Lindberg', 'Jakobsson', 'Magnusson', 'Lindström'
  ],
  PT: [
    'Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Sousa', 'Fernandes',
    'Gonçalves', 'Gomes', 'Lopes', 'Marques', 'Alves', 'Almeida', 'Ribeiro', 'Pinto', 'Carvalho', 'Teixeira'
  ],
  CZ: [
    'Novák', 'Svoboda', 'Novotný', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý', 'Horák', 'Němec',
    'Marek', 'Pospíšil', 'Hájek', 'Jelínek', 'Král', 'Růžička', 'Beneš', 'Fiala', 'Sedláček', 'Doležal'
  ],
  NL: [
    'De Jong', 'Jansen', 'De Vries', 'Van den Berg', 'Van Dijk', 'Bakker', 'Janssen', 'Visser', 'Smit', 'Meijer',
    'De Boer', 'Mulder', 'De Groot', 'Bos', 'Vos', 'Peters', 'Hendriks', 'Van Leeuwen', 'Dekker', 'Brouwer'
  ],
  JP: [
    'Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato',
    'Yoshida', 'Yamada', 'Sasaki', 'Yamaguchi', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu', 'Saito'
  ],
  KR: [
    'Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim',
    'Han', 'Oh', 'Seo', 'Shin', 'Kwon', 'Hwang', 'Ahn', 'Song', 'Yoo', 'Hong'
  ],
  DK: [
    'Nielsen', 'Jensen', 'Hansen', 'Andersen', 'Pedersen', 'Christensen', 'Larsen', 'Sørensen', 'Rasmussen', 'Jørgensen',
    'Petersen', 'Madsen', 'Kristensen', 'Olsen', 'Thomsen', 'Poulsen', 'Johansen', 'Knudsen', 'Mortensen', 'Møller'
  ],
  FI: [
    'Korhonen', 'Virtanen', 'Mäkinen', 'Nieminen', 'Mäkelä', 'Hämäläinen', 'Laine', 'Heikkinen', 'Koskinen', 'Järvinen',
    'Lehtonen', 'Lehtinen', 'Saarinen', 'Salminen', 'Heinonen', 'Niemi', 'Heikkilä', 'Kinnunen', 'Salonen', 'Turunen'
  ],
  EE: [
    'Tamm', 'Saar', 'Sepp', 'Mägi', 'Ilves', 'Kask', 'Kukk', 'Rebane', 'Koppel', 'Pärn',
    'Luik', 'Oja', 'Lõhmus', 'Mitt', 'Lepik', 'Kallas', 'Raud', 'Vaher', 'Toom', 'Kuusk'
  ],
  AT: [
    'Gruber', 'Huber', 'Bauer', 'Wagner', 'Müller', 'Pichler', 'Steiner', 'Moser', 'Mayer', 'Hofer',
    'Berger', 'Fuchs', 'Lechner', 'Schmid', 'Winkler', 'Weber', 'Schwarz', 'Maier', 'Reiter', 'Brunner'
  ],
  BE: [
    'Peeters', 'Janssens', 'Maes', 'Jacobs', 'Willems', 'Claes', 'Goossens', 'Wouters', 'Dubois', 'Lambert',
    'Dumont', 'Leclercq', 'Denis', 'Simon', 'Laurent', 'Vandenberghe', 'De Smedt', 'Hermans', 'Martens', 'Mertens'
  ],
  HU: [
    'Nagy', 'Kovács', 'Tóth', 'Szabó', 'Horváth', 'Varga', 'Kiss', 'Molnár', 'Németh', 'Farkas',
    'Balogh', 'Papp', 'Takács', 'Juhász', 'Lakatos', 'Mészáros', 'Oláh', 'Simon', 'Rácz', 'Fekete'
  ],
  IE: [
    'Murphy', 'Kelly', 'O\'Sullivan', 'Walsh', 'O\'Brien', 'Byrne', 'Ryan', 'O\'Connor', 'O\'Neill', 'O\'Reilly',
    'Doyle', 'McCarthy', 'Gallagher', 'Doherty', 'Kennedy', 'Lynch', 'Murray', 'Quinn', 'Moore', 'McLoughlin'
  ],
  GR: [
    'Papadopoulos', 'Vlahos', 'Angelopoulos', 'Nikolaidis', 'Georgiou', 'Dimitriou', 'Pappas', 'Ioannou', 'Christodoulou', 'Karagiannis',
    'Makris', 'Alexiou', 'Stavropoulos', 'Oikonomou', 'Theodoridis', 'Vasileiou', 'Konstantinou', 'Athanasiadis', 'Karamanlis', 'Papanikolaou'
  ],
  NO: [
    'Hansen', 'Johansen', 'Olsen', 'Larsen', 'Andersen', 'Pedersen', 'Nilsen', 'Kristiansen', 'Jensen', 'Karlsen',
    'Johnsen', 'Pettersen', 'Eriksen', 'Berg', 'Haugen', 'Hagen', 'Johannessen', 'Andreassen', 'Jacobsen', 'Dahl'
  ],
  CH: [
    'Müller', 'Meier', 'Schmid', 'Keller', 'Weber', 'Huber', 'Schneider', 'Meyer', 'Steiner', 'Fischer',
    'Gerber', 'Brunner', 'Baumann', 'Frei', 'Zimmermann', 'Moser', 'Widmer', 'Wyss', 'Graf', 'Roth'
  ],
  RO: [
    'Popa', 'Popescu', 'Pop', 'Radu', 'Ionescu', 'Dumitru', 'Stoica', 'Stan', 'Gheorghe', 'Ciobanu',
    'Rusu', 'Marin', 'Tudor', 'Constantin', 'Moldovan', 'Matei', 'Barbu', 'Nistor', 'Pavel', 'Dinu'
  ],
  RU: [
    'Ivanov', 'Smirnov', 'Kuznetsov', 'Popov', 'Vasiliev', 'Petrov', 'Sokolov', 'Mikhailov', 'Novikov', 'Fedorov',
    'Morozov', 'Volkov', 'Alekseev', 'Lebedev', 'Semenov', 'Egorov', 'Pavlov', 'Kozlov', 'Stepanov', 'Nikolaev'
  ],
  default: [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White',
    'Harris', 'Clark', 'Lewis', 'Walker', 'Hall', 'Young', 'Allen', 'King', 'Wright', 'Scott'
  ]
};

// ---------------------------------------------------------------------------
// Email domains
// ---------------------------------------------------------------------------

export const emailDomains: string[] = [
  'gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'icloud.com',
  'protonmail.com', 'live.com', 'mail.com', 'aol.com', 'zoho.com',
  'fastmail.com', 'hey.com', 'pm.me', 'tutanota.com', 'yandex.com'
];

// ---------------------------------------------------------------------------
// Phone prefixes by nationality
// ---------------------------------------------------------------------------

export const phonePrefixesByNationality: Record<string, string[]> = {
  GB: ['+44 20', '+44 161', '+44 113', '+44 141', '+44 29'],
  US: ['+1 212', '+1 415', '+1 305', '+1 617', '+1 713'],
  FR: ['+33 1', '+33 4', '+33 2', '+33 5', '+33 3'],
  DE: ['+49 30', '+49 89', '+49 69', '+49 40', '+49 221'],
  IT: ['+39 06', '+39 02', '+39 055', '+39 041', '+39 081'],
  ES: ['+34 91', '+34 93', '+34 96', '+34 95', '+34 94'],
  PL: ['+48 22', '+48 12', '+48 71', '+48 61', '+48 58'],
  SE: ['+46 8', '+46 31', '+46 40', '+46 18', '+46 90'],
  PT: ['+351 21', '+351 22', '+351 23', '+351 91', '+351 96'],
  CZ: ['+420 2', '+420 5', '+420 37', '+420 58', '+420 54'],
  NL: ['+31 20', '+31 10', '+31 70', '+31 30', '+31 50'],
  JP: ['+81 3', '+81 6', '+81 52', '+81 78', '+81 92'],
  KR: ['+82 2', '+82 51', '+82 53', '+82 62', '+82 42'],
  DK: ['+45 33', '+45 35', '+45 86', '+45 66', '+45 98'],
  FI: ['+358 9', '+358 3', '+358 2', '+358 14', '+358 17'],
  EE: ['+372 6', '+372 7', '+372 44', '+372 35', '+372 43'],
  AT: ['+43 1', '+43 316', '+43 512', '+43 662', '+43 732'],
  BE: ['+32 2', '+32 3', '+32 9', '+32 4', '+32 16'],
  HU: ['+36 1', '+36 72', '+36 62', '+36 52', '+36 96'],
  IE: ['+353 1', '+353 21', '+353 91', '+353 61', '+353 51'],
  GR: ['+30 21', '+30 231', '+30 261', '+30 281', '+30 241'],
  NO: ['+47 22', '+47 55', '+47 73', '+47 51', '+47 69'],
  CH: ['+41 44', '+41 22', '+41 31', '+41 61', '+41 21'],
  RO: ['+40 21', '+40 264', '+40 256', '+40 232', '+40 236'],
  RU: ['+7 495', '+7 812', '+7 383', '+7 343', '+7 846'],
  default: ['+44 20', '+1 212', '+33 1', '+49 30', '+34 91']
};

// ---------------------------------------------------------------------------
// Nationality weights for random selection
// ---------------------------------------------------------------------------

export interface NationalityConfig {
  code: string;
  languageCode: string;
  weight: number;
}

export const nationalityWeights: NationalityConfig[] = [
  { code: 'GB', languageCode: 'en-GB', weight: 15 },
  { code: 'US', languageCode: 'en-US', weight: 12 },
  { code: 'DE', languageCode: 'de-DE', weight: 10 },
  { code: 'FR', languageCode: 'fr-FR', weight: 10 },
  { code: 'ES', languageCode: 'es-ES', weight: 8 },
  { code: 'IT', languageCode: 'it-IT', weight: 8 },
  { code: 'NL', languageCode: 'nl-NL', weight: 5 },
  { code: 'PL', languageCode: 'pl-PL', weight: 5 },
  { code: 'CZ', languageCode: 'cs-CZ', weight: 3 },
  { code: 'PT', languageCode: 'pt-PT', weight: 3 },
  { code: 'SE', languageCode: 'sv-SE', weight: 2 },
  { code: 'DK', languageCode: 'da-DK', weight: 2 },
  { code: 'NO', languageCode: 'no-NO', weight: 2 },
  { code: 'IE', languageCode: 'en-IE', weight: 2 },
  { code: 'AT', languageCode: 'de-AT', weight: 2 },
  { code: 'CH', languageCode: 'de-CH', weight: 2 },
  { code: 'BE', languageCode: 'fr-BE', weight: 1 },
  { code: 'FI', languageCode: 'fi-FI', weight: 1 },
  { code: 'GR', languageCode: 'el-GR', weight: 1 },
  { code: 'HU', languageCode: 'hu-HU', weight: 1 },
  { code: 'RO', languageCode: 'ro-RO', weight: 1 },
  { code: 'RU', languageCode: 'ru-RU', weight: 1 },
  { code: 'EE', languageCode: 'et-EE', weight: 1 },
  { code: 'JP', languageCode: 'ja-JP', weight: 1 },
  { code: 'KR', languageCode: 'ko-KR', weight: 1 },
];

// ---------------------------------------------------------------------------
// Classification probabilities
// ---------------------------------------------------------------------------

export interface ClassificationConfig {
  name: string;
  probability: number;
  personal: boolean;
  business: boolean;
}

export const classificationConfigs: ClassificationConfig[] = [
  { name: 'Returning',         probability: 0.20, personal: true,  business: true },
  { name: 'VeryImportant',     probability: 0.04, personal: true,  business: true },
  { name: 'Important',         probability: 0.08, personal: true,  business: true },
  { name: 'FriendOrFamily',    probability: 0.04, personal: true,  business: false },
  { name: 'Military',          probability: 0.03, personal: true,  business: false },
  { name: 'Student',           probability: 0.05, personal: true,  business: false },
  { name: 'Airline',           probability: 0.04, personal: true,  business: false },
  { name: 'Media',             probability: 0.03, personal: true,  business: false },
  { name: 'Problematic',       probability: 0.03, personal: true,  business: true },
  { name: 'PreviousComplaint', probability: 0.04, personal: true,  business: true },
  { name: 'Cashlist',          probability: 0.03, personal: true,  business: true },
  { name: 'DisabledPerson',    probability: 0.03, personal: true,  business: false },
  { name: 'HealthCompliant',   probability: 0.03, personal: true,  business: false },
  { name: 'Staff',             probability: 0.02, personal: true,  business: false },
];

// ---------------------------------------------------------------------------
// Note templates — drawn from the existing translated note pool
// All of these strings have translations in es.ts, fr.ts, nl.ts, de.ts
// ---------------------------------------------------------------------------

export const personalNoteTemplates: string[] = [
  'Regular guest who visits quarterly. Prefers rooms on higher floors with city views. Allergic to down pillows.',
  'US Navy veteran. Prefers quiet rooms away from elevators and ice machines. Early riser who appreciates breakfast service starting at 6 AM.',
  'Brother-in-law of the Assistant Manager. Enjoys room 212 when available. Vegetarian dietary preferences.',
  'Erasmus exchange student. Budget conscious. Needs strong WiFi for online classes. Prefers rooms near common areas for socializing.',
  'Requires wheelchair accessible room on ground floor. Needs bathroom with grab bars and roll-in shower. Patient and understanding guest.',
  'Had previous issue with noisy neighbors which was resolved professionally. Now satisfied and continues to return. Appreciates proactive communication from staff.',
  'Prefers to pay all charges in cash. Requests itemized receipts for all services. Polite and organized guest.',
  'Freelance journalist covering travel and hospitality. May request information about property operations. Professional and discreet.',
  'Can be very particular about room cleanliness and temperature. Requires extra attention to detail. Best to assign experienced housekeeping staff.',
  'Long-time guest who stays biannually. Prefers corner rooms with balconies. Enjoys local recommendations for authentic restaurants. Always leaves generous reviews.',
  'Alitalia flight attendant with irregular schedule. Often requires late check-in after international flights. Prefers blackout curtains for daytime sleeping.',
  'Niece of the Head Chef. Works as intern in hospitality management. Observant and learns from guest service practices.',
  'Anniversary tradition to stay each September. Enjoys surprise room upgrades when available. Celebrates with partner room 308.',
  'US Air Force Colonel based in Germany. Stays during family visits. Prefers connecting rooms when traveling with adult children. Respectful of property rules.',
  'PhD researcher attending conferences. Requires quiet study environment. Often works late in room. Appreciates strong desk lighting.',
  'Concert pianist who stays during performance tours. Requires guarantee of quiet neighbors. Sometimes practices in room - has arranged keyboard setup.',
  'Gluten-free dietary requirements. Always confirms breakfast options in advance. Carries medical documentation. Appreciates staff awareness of allergen information.',
  'British Airways cabin crew member. Layover stays typically 24-48 hours. Prefers rooms away from street noise. Professional and low maintenance guest.',
  'Architecture student who sketches in hotel lobbies and gardens. Stays during study breaks. Respectful of communal spaces. Often requests local architecture recommendations.',
  'Fashion buyer who stays during seasonal buying trips. VIP treatment appreciated. Prefers modern, stylish rooms. Influential on social media - often posts about stay experiences.',
  'Travel blogger with 50K+ followers. Stays frequently during content creation trips. Values authenticity and unique experiences. Posts positive reviews when impressed.',
  'Former colleague of the General Manager from previous property. Enjoys catching up during stays. Prefers quiet corner rooms with workspace.',
  'Hearing impaired guest. Appreciates visual alerts for fire alarms and door knocks. Prefers written communication for check-in details. Very appreciative of accessibility accommodations.',
  'US Marine Corps veteran. Appreciates straightforward, efficient service. Prefers ground floor rooms for easier access. Often travels with service dog.',
  'Previous complaint about WiFi connectivity was addressed with upgraded router. Now satisfied and continues to book. Requires reliable internet for work.',
  'Regular guest who prefers cash transactions for business expense tracking. Always requests detailed invoices. Organized and efficient check-in process.',
  'Food critic for major Polish lifestyle magazine. Evaluates hotel restaurants and breakfast service. Professional and fair in assessments. Maintains anonymity when possible.',
  'TAP Air Portugal flight attendant. Regular layovers on European routes. Prefers early breakfast before 6 AM departures. Reliable and punctual guest.',
  "Award-winning novelist who writes in hotel rooms for inspiration. Stays for week-long writing retreats. Requests 'Do Not Disturb' for extended periods. Values privacy and quiet atmosphere.",
  'Medical student attending clinical rotations. Budget conscious but values cleanliness. Studies late into the night. Appreciates quiet environment and good lighting.',
  'Particular about towel quality and room temperature. Has specific requests but is consistent guest. Best to review his preferences before arrival to ensure smooth stay.',
  'Severe peanut allergy. Requires detailed allergen information for all meals. Carries EpiPen. Staff should be briefed on emergency procedures before arrival.',
  'Cousin of the Night Manager. Part-time hospitality consultant. Often provides helpful feedback on operations. Professional and supportive.',
  'Art gallery owner who attends regional exhibitions. Appreciates art in hotel decor. Books extended stays for major art fairs. Cultured and engaging guest.',
  'Air France long-haul pilot. Irregular schedules with 48-72 hour layovers. Prefers blackout rooms for jet lag recovery. Professional and understanding of service limitations.',
  'Language instructor attending summer teaching programs. Stays for 2-3 week periods. Enjoys practicing local language with staff. Friendly and culturally curious guest.',
  'Professional photographer who documents hotel architecture and design. May take photos in public areas. Respectful of other guests privacy. Creates beautiful property portfolios.',
  'Danish architect who stays for design conferences. Appreciates Scandinavian design elements. Often sketches in the lobby.',
  'Graduate student researching European tourism. Stays during academic conferences. Friendly and inquisitive. Vegetarian with preference for local organic produce.',
  'Japanese travel influencer with large social media following. Documents unique hotel experiences. Professional and respectful of privacy policies.',
  'Aer Lingus cabin crew member. Regular European layovers. Prefers rooms with good natural light. Always courteous and low-maintenance.',
  'Norwegian marine biologist attending environmental conferences. Vegan dietary requirements. Prefers eco-friendly hotel practices. Appreciates sustainability initiatives.',
  'Swiss watch industry executive. Values precision and punctuality. Expects Swiss standards of service. Loyal guest who recommends property to colleagues.',
  'Finnish design student on scholarship program. Minimalist preferences. Studies hotel interior design. Takes detailed notes on room layouts and aesthetics.',
  'Austrian conductor who stays during symphony tours. Requires absolute quiet for practice and rest. Books connecting rooms for instrument storage. Appreciates cultural recommendations.',
  'Royal Netherlands Army officer attending NATO meetings. Professional demeanor. Prefers early breakfast. Always punctual for check-out.',
  'British-Pakistani doctor with halal dietary requirements. Requests prayer facilities information. Professional and appreciative of cultural accommodation.',
  'Ukrainian artist with specific requests regarding room lighting for painting. Can be particular about temperature and window positioning. Needs advance notice for special accommodations.',
  'Indian medical researcher presenting at conferences. Vegetarian with preference for South Indian cuisine. Needs reliable WiFi for remote lab meetings. Professional and organized.',
  'Brazilian football coach who stays during European scouting trips. Friendly and sociable. Often uses hotel facilities for video analysis. Appreciates late check-out options.',
  'Emirates businesswoman attending European trade shows. Halal dietary requirements. Values privacy and discretion. Prefers female housekeeping staff when possible.',
  'Friend of the property owner from university days. Enjoys catching up with management team. Often stays for extended weekends. Appreciates local pub recommendations.',
  'Swedish travel vlogger creating European hotel content. Professional filming equipment. Always requests permission before recording. Generates positive social media exposure.',
  'Brussels Airlines crew member with regular European routes. Prefers early check-in for morning departures. Professional and punctual. Appreciates quiet rooms for rest between flights.',
  'Had issue with breakfast timing on previous stay which was resolved. Now books regularly. Early riser who appreciates 6 AM breakfast start. Loyal and understanding guest.',
  'Russian ballet dancer performing in European productions. Requires specific room temperature for muscle recovery. Often books extended stays for rehearsals. Cultural ambassador.',
  'Austrian guest with mobility challenges. Requires accessible room with wide doorways. Uses wheelchair occasionally. Very appreciative of staff assistance. Independent and positive attitude.',
];

export const businessNoteTemplates: string[] = [
  'C-level executive who books 10+ nights monthly. Prefers executive floor rooms with meeting space. Requires 24/7 business center access. Loyal corporate account.',
  'VP of Operations with frequent stays. Holds client meetings in hotel conference rooms. Prefers rooms near business facilities. Professional and courteous.',
  'Senior partner who brings high-value client meetings to property. Requires premium suites when entertaining. Excellent tipper and ambassador for the property.',
  'Banking executive with high standards. Expects prompt service and attention to detail. Can be demanding but fair. Best to assign senior staff for check-in.',
  'Design director who stays during trade shows. Books months in advance. Appreciates modern aesthetics. Sometimes extends stay last minute for project work.',
  'Tech sales manager who closes deals over property meals. Prefers to settle accounts in cash for expense reports. Brings valuable corporate clients to restaurant.',
  'Regional manager with weekly stays. Books same room number 405 when available. Needs reliable wake-up calls for early meetings. Punctual and organized.',
  'Board member who books executive suites for multi-day strategy sessions. Requires conference room access and catering services. High-value corporate account.',
  'Managing partner of major financial firm. Extremely discreet service required. Often accompanied by business associates. Premium service expectations.',
  'Startup founder attending investor meetings. Books last minute but stays frequently. Values fast WiFi above all else. Night owl who works until 2 AM.',
  'IT consultant with monthly visits. Previous complaint about slow internet was resolved with upgraded service. Now satisfied and loyal guest. Requires technical support occasionally.',
  'Investment banker featured in financial publications. Values privacy and discretion. Often works on confidential deals from room. Professional and low-key presence.',
  'Software developer who stays during training sessions. Prefers quiet floors for concentration. Early check-in requested when possible. Appreciates technical amenities.',
  'Danish logistics manager with monthly stays. Books same room 510 when available. Needs early breakfast for 7 AM meetings. Professional and efficient.',
  'Senior executive managing European operations. Requires executive suite and business center access. Often hosts client dinners. High-value corporate account.',
  'Financial analyst who stays during quarterly audits. Requires quiet workspace. Values reliable WiFi above all. Often extends stays for project completion.',
  'Irish consultant working on European projects. Books multiple times per quarter. Prefers rooms with work desks. Often takes conference calls from room.',
  'Chinese tech company representative establishing European partnerships. Professional and detail-oriented. Appreciates cultural sensitivity. Books extended stays for negotiations.',
  'Croatian business development manager. Previous complaint about conference room booking was resolved professionally. Now satisfied regular guest. Appreciates proactive communication.',
  'Greek strategy consultant working with European clients. Holds client meetings in hotel conference rooms. Professional and organized. Books multiple rooms for team visits.',
  'South Korean business executive attending trade shows. Books months in advance. Appreciates efficient service. Often requests late check-out for evening flights.',
];
