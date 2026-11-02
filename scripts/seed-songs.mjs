/**
 * Fills the local Firestore emulator with made-up songs for trying out the UI.
 *
 * Everything is invented: artists, titles and lyrics are put together from word lists, so the
 * data looks like a real songbook without copying any real song. The output is deterministic
 * and uses fixed document ids, so running it again overwrites the same songs instead of adding
 * more.
 *
 * Usage (emulators running): npm run firebase:seed
 *
 * Talks only to the emulators on localhost and writes as the emulator's admin, past the rules.
 */

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? 'my-pisnicka';
const FIRESTORE = 'http://127.0.0.1:8080';
const AUTH = 'http://127.0.0.1:9099';
const SONG_COUNT = 220;
const OWNER_EMAILS = ['admin@mypisnicka.com', 'test@mypisnicka.com'];

// Fixed seed so every run produces the same songs.
let seed = 20261102;
const random = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (items) => items[Math.floor(random() * items.length)];
const chance = (probability) => random() < probability;
const between = (min, max) => min + Math.floor(random() * (max - min + 1));
const capitalize = (text) => text.charAt(0).toLocaleUpperCase('cs') + text.slice(1);

// --- Artists ---------------------------------------------------------------------------------

// Weights shape the library: a few artists with many songs, a long tail with one or two.
const CZECH_ARTISTS = [
  ['Modrý Kapr', 14],
  ['Hrnčíři z Podolí', 11],
  ['Jarmila Vrbová', 9],
  ['Bratři Kotrbové', 8],
  ['Pražský Pražec', 7],
  ['Kapela U Splavu', 6],
  ['Ondřej Šťastný', 5],
  ['Zelená Lucerna', 5],
  ['Trempové z Údolí', 4],
  ['Šedivý Vlk', 4],
  ['Karel Lesák', 3],
  ['Dívčí Pěvecký Spolek Šárka', 3],
  ['Žabí Hráz', 3],
  ['Čtyři Pecky', 2],
  ['Anna Říhová & Přátelé', 2],
  ['Vítr v Lukách', 2],
  ['Dědeček Hřib', 2],
  ['Ústřední Topení', 2],
  ['Pavla Nováková', 1],
  ['Střepy', 1],
  ['Kvartet Bez Názvu', 1],
  ['Lesní Rohy Lhota', 1],
  ['Íčko a Ypsilon', 1],
  ['Zdeněk Mlynář', 1],
];

const ENGLISH_ARTISTS = [
  ['The Paper Lanterns', 9],
  ['Juniper Rail', 6],
  ['Old Harbour Choir', 5],
  ['Maggie Thornfield', 4],
  ['The Quiet Foxes', 3],
  ['Sam & The Copper Kettles', 3],
  ['Northbound Ferry', 2],
  ['Lucy Ashgrove', 2],
  ['The Very Long Name Orchestra of Saint Bartholomew Street', 2],
  ['Elm', 1],
  ['Westward Lantern Company', 1],
  ['1975 Polaroids', 1],
];

const weighted = (artists, language) =>
  artists.flatMap(([name, weight]) => Array.from({ length: weight }, () => ({ name, language })));

// --- Titles ----------------------------------------------------------------------------------

const CZ_ADJECTIVES = [
  'stříbrná',
  'poslední',
  'modrá',
  'tichá',
  'dlouhá',
  'stará',
  'zelená',
  'ztracená',
  'noční',
  'ranní',
  'divoká',
  'malá',
  'bílá',
  'zlatá',
  'podzimní',
  'jarní',
];
const CZ_NOUNS = [
  'řeka',
  'cesta',
  'louka',
  'hvězda',
  'píseň',
  'krajina',
  'zahrada',
  'stanice',
  'chalupa',
  'vesnice',
  'ozvěna',
  'lampa',
  'kytara',
  'loďka',
  'stezka',
  'pláň',
];
const CZ_TITLE_TEMPLATES = [
  () => `${capitalize(pick(CZ_ADJECTIVES))} ${pick(CZ_NOUNS)}`,
  () => `Poslední vlak do ${pick(['Brna', 'Kolína', 'Tábora', 'Jihlavy', 'Ústí', 'Písku'])}`,
  () => `Balada o ${pick(['starém mlýnu', 'kapitánovi', 'toulavém psovi', 'bílé lodi', 'hajném'])}`,
  () => `Až ${pick(['přijde jaro', 'zapadne slunce', 'odjedou vlaky', 'roztaje led'])}`,
  () => `Píseň pro ${pick(['Annu', 'Toníka', 'mámu', 'kamaráda', 'Marii', 'Jitku'])}`,
  () => `U ${pick(['potoka', 'ohně', 'splavu', 'lesa', 'nádraží', 'brodu'])}`,
  () => `${capitalize(pick(CZ_NOUNS))} ${pick(['v mlze', 'za humny', 'pod horou', 'u cesty'])}`,
  () => `Když ${pick(['prší', 'sněží', 'svítá', 'zpívají ptáci', 'hraje harmonika'])}`,
  () =>
    `${between(2, 12)} ${pick(['dní', 'mil', 'zim', 'let'])} ${pick(['do moře', 'na cestě', 'bez tebe'])}`,
  () => `Ó, ${pick(['Madlenko', 'Kateřino', 'Barbaro', 'Evičko'])}`,
];

const EN_ADJECTIVES = [
  'Silver',
  'Midnight',
  'Quiet',
  'Golden',
  'Lonesome',
  'Northern',
  'Paper',
  'Rusty',
];
const EN_NOUNS = [
  'River',
  'Ferry',
  'Harbour',
  'Lantern',
  'Highway',
  'Orchard',
  'Winter',
  'Morning',
];
const EN_TITLE_TEMPLATES = [
  () => `${pick(EN_ADJECTIVES)} ${pick(EN_NOUNS)}`,
  () => `The ${pick(EN_NOUNS)} Song`,
  () => `Down by the ${pick(EN_NOUNS)}`,
  () =>
    `${pick(['When', 'Before', 'After'])} the ${pick(EN_NOUNS)} ${pick(['Ends', 'Comes', 'Sleeps'])}`,
  () => `${pick(['Home', 'Gone', 'Waiting'])} ${pick(['Again', 'Tonight', 'for You'])}`,
  () => `Ballad of the ${pick(EN_ADJECTIVES)} ${pick(EN_NOUNS)}`,
];

// A few deliberately awkward titles: very long, numbers first, punctuation, one word.
const EDGE_TITLES = [
  'Velmi dlouhý název písně, který se na mobilu určitě nevejde na jeden řádek',
  '1. máj na Petříně',
  '„Já nevím“ (akustická verze)',
  'Ň',
  'A Song With A Ridiculously Long Title That Keeps Going Well Past The Edge Of The Screen',
  '(Nejsem) unavený',
  'Řeřicha, šťovík a čočka',
  '99 kapek deště',
];

// --- Lyrics ----------------------------------------------------------------------------------

const CZ_LINES = [
  'Ráno se budím a venku je mlha',
  'cesta je dlouhá a batoh je těžký',
  'u ohně sedíme, kytara hraje',
  'hvězdy nad lesem tiše se dívají',
  'vítr nám zpívá svou starou píseň',
  'řeka si plyne a nikam nespěchá',
  'zítra zas půjdem tam, kde jsme byli',
  'na staré stezce se potkáme zase',
  'v kapse mám dopis, co nikdy nepošlu',
  'za humny kvete žlutá řepka',
  'vlak odjel dávno a já tu stojím',
  'doma už svítí v okně lampa',
  'kamarádi zpívaj a noc je krátká',
  'po louce běží čerstvá rosa',
  'starý mlýn klape, voda se točí',
  'nad horou vychází bledý měsíc',
  'v hospodě U Lípy hrajou do rána',
  'šli jsme dál, i když pršelo',
  'tvoje jméno píšu do písku',
  'až jednou zestárnem, budem si pamatovat',
  'nebe je šedé a cesty jsou blátivé',
  'na mostě stojím a počítám vlny',
  'ptáci se vrací, je zase jaro',
  'u brodu čeká převozník starý',
];

const CZ_CHORUS_LINES = [
  'Hej, hola, cesta vede dál',
  'a my jdem, a my jdem, kam nás vítr zval',
  'zpívej se mnou, ať je nás slyšet',
  'až do rána, až do rána',
  'la la la, ať to zní',
  'tahle noc patří jen nám',
  'nikdy se nevzdáme, nikdy ne',
  'domů se vrátíme, až bude čas',
];

const EN_LINES = [
  'Woke up early to the sound of rain',
  'packed my bag and caught the morning train',
  'there is a light down by the water',
  'the road is long but I keep walking',
  'old friends gather round the fire',
  'stars are falling over the harbour',
  'I wrote your name on a paper boat',
  'the wind keeps singing an old song',
  'we were young and the night was ours',
  'the river knows where we are going',
  'lanterns glowing in the window',
  'one more song before we leave',
];

const EN_CHORUS_LINES = [
  'Oh, carry me home',
  'sing it loud, sing it slow',
  'and the river keeps rolling on',
  'till the morning comes',
  'na na na, hey hey',
  'we will meet again some day',
];

// --- Chords ----------------------------------------------------------------------------------

// Czech notation (H for B), as the songbook expects.
const PROGRESSIONS = [
  { key: 'G', verse: ['G', 'D', 'Em', 'C'], chorus: ['C', 'G', 'D', 'G'] },
  { key: 'Am', verse: ['Am', 'F', 'C', 'G'], chorus: ['F', 'G', 'C', 'Am'] },
  { key: 'C', verse: ['C', 'Am', 'F', 'G'], chorus: ['F', 'C', 'G', 'C'] },
  { key: 'D', verse: ['D', 'A', 'Hm', 'G'], chorus: ['G', 'D', 'A', 'D'] },
  { key: 'E', verse: ['E', 'A', 'H7', 'E'], chorus: ['A', 'E', 'H7', 'E'] },
  { key: 'Dm', verse: ['Dm', 'B', 'F', 'C'], chorus: ['B', 'C', 'Dm', 'A7'] },
  { key: 'Em', verse: ['Em', 'C', 'G', 'D'], chorus: ['C', 'D', 'G', 'H7'] },
  { key: 'F', verse: ['F', 'Dm', 'B', 'C7'], chorus: ['B', 'F', 'C', 'F'] },
  { key: 'A', verse: ['A', 'F#m', 'D', 'E'], chorus: ['D', 'E', 'A', 'E7'] },
  { key: 'Hm', verse: ['Hm', 'G', 'D', 'A'], chorus: ['G', 'A', 'Hm', 'F#7'] },
];

/** Puts 1–3 chords before words of the line, the first always at its start. */
const withChords = (line, chords) => {
  const words = line.split(' ');
  const count = Math.min(words.length, between(1, 3));
  const slots = new Set([0]);
  while (slots.size < count) slots.add(between(1, words.length - 1));

  let chordIndex = 0;
  return words
    .map((word, index) =>
      slots.has(index) ? `[${chords[chordIndex++ % chords.length]}]${word}` : word
    )
    .join(' ');
};

const section = (type, lines, chords) => [
  `[${type}]`,
  ...lines.map((line, index) =>
    withChords(capitalize(line), chords.slice(index % chords.length).concat(chords))
  ),
];

/** `count` different lines from the pool. */
const pickLines = (pool, count) =>
  pool
    .map((line) => ({ line, order: random() }))
    .sort((a, b) => a.order - b.order)
    .slice(0, count)
    .map(({ line }) => line);

/** Song text in the editor's storage format: `[verse]` headings and inline `[Am]` chords. */
const songText = (language, progression, size) => {
  const verses = language === 'cs' ? CZ_LINES : EN_LINES;
  const choruses = language === 'cs' ? CZ_CHORUS_LINES : EN_CHORUS_LINES;
  const lines = [];

  if (chance(0.5)) {
    lines.push('[intro]', progression.verse.map((chord) => `[${chord}]`).join(''));
  }

  const chorus = section('chorus', pickLines(choruses, 4), progression.chorus);
  const verseCount = { short: 1, normal: between(2, 3), long: between(5, 7) }[size];
  const linesPerVerse = size === 'long' ? 6 : 4;

  for (let verse = 0; verse < verseCount; verse++) {
    lines.push(...section('verse', pickLines(verses, linesPerVerse), progression.verse));
    if (size !== 'short' || verse === 0) lines.push(...chorus);
  }

  if (size !== 'short' && chance(0.3)) {
    lines.push(
      '[bridge]',
      `[${progression.chorus[0]}][${progression.verse[1]}][${progression.chorus[2]}]`
    );
    lines.push(...chorus);
  }

  if (chance(0.35)) {
    lines.push(
      '[outro]',
      `[${progression.verse[0]}]${language === 'cs' ? 'Až do rána' : 'Till the morning'}`
    );
  }

  return lines.join('\n');
};

const songChords = (text) => [
  ...new Set([...text.matchAll(/\[([A-H][^\]\n]*)\]/g)].map((m) => m[1])),
];

// --- Firestore REST ----------------------------------------------------------------------------

const ADMIN_HEADERS = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' };
const DOCS = `projects/${PROJECT_ID}/databases/(default)/documents`;

const toValue = (value) => {
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toValue) } };
  if (typeof value === 'number') return { integerValue: String(value) };
  return { stringValue: value };
};

const toFields = (data) =>
  Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, toValue(value)])
  );

const commit = async (writes) => {
  const response = await fetch(`${FIRESTORE}/v1/${DOCS}:commit`, {
    method: 'POST',
    headers: ADMIN_HEADERS,
    body: JSON.stringify({ writes }),
  });
  if (!response.ok) throw new Error(`Commit failed: ${response.status} ${await response.text()}`);
};

const setDoc = (path, data) => ({ update: { name: `${DOCS}/${path}`, fields: toFields(data) } });

const findOwnerIds = async () => {
  const response = await fetch(
    `${AUTH}/identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:query`,
    { method: 'POST', headers: ADMIN_HEADERS, body: '{}' }
  );
  if (!response.ok) throw new Error(`Auth emulator not reachable: ${response.status}`);

  const { userInfo = [] } = await response.json();
  const ids = OWNER_EMAILS.map((email) => userInfo.find((user) => user.email === email)?.localId);
  if (!ids[0]) throw new Error(`No ${OWNER_EMAILS[0]} account in the auth emulator.`);
  return ids.filter(Boolean);
};

// --- Build and write -----------------------------------------------------------------------------

const TAGS = [
  'Táborák',
  'Folk',
  'Trampské',
  'Lidovky',
  'Rock',
  'Balady',
  'Vánoční',
  'Pro děti',
  'Pomalé',
  'Na rozjezd',
  'Country',
  'Ukulele',
];

const main = async () => {
  const [adminId, otherId = adminId] = await findOwnerIds();
  const tagIds = TAGS.map((_, index) => `seed-tag-${String(index + 1).padStart(2, '0')}`);
  const artistPool = [...weighted(CZECH_ARTISTS, 'cs'), ...weighted(ENGLISH_ARTISTS, 'en')];
  const writes = TAGS.map((value, index) => setDoc(`songCategories/${tagIds[index]}`, { value }));
  const usedTitles = new Set();

  for (let index = 0; index < SONG_COUNT; index++) {
    // Every artist gets their weight's worth of songs first, the rest is random.
    const artist = artistPool[index] ?? pick(artistPool);
    const templates = artist.language === 'cs' ? CZ_TITLE_TEMPLATES : EN_TITLE_TEMPLATES;

    let title = index < EDGE_TITLES.length ? EDGE_TITLES[index] : pick(templates)();
    while (usedTitles.has(`${artist.name}|${title}`)) title = `${pick(templates)()}`;
    usedTitles.add(`${artist.name}|${title}`);

    const progression = pick(PROGRESSIONS);
    const size = pick(['short', 'normal', 'normal', 'normal', 'long']);
    const text = songText(artist.language, progression, size);
    const id = `seed-song-${String(index + 1).padStart(3, '0')}`;
    const ownerId = chance(0.8) ? adminId : otherId;
    const createdAt = new Date(Date.UTC(2025, 0, 1) + Math.floor(random() * 600) * 86_400_000);
    const tags = tagIds.filter(() => chance(0.18)).slice(0, 3);

    writes.push(
      setDoc(`songs/${id}`, {
        text,
        createdAt,
        ownerId,
        capo: chance(0.3) ? between(1, 5) : undefined,
        instrument: chance(0.15) ? 'ukulele' : 'guitar',
      }),
      setDoc(`songCatalog/seed-catalog-${id.slice('seed-song-'.length)}`, {
        sourceSongId: id,
        title,
        artist: artist.name,
        ownerId,
        chords: songChords(text),
        categories: tags,
      })
    );
  }

  // The emulator, like Firestore, takes at most 500 writes per commit.
  for (let start = 0; start < writes.length; start += 500) {
    await commit(writes.slice(start, start + 500));
  }

  const artists = new Set(artistPool.map((artist) => artist.name));
  console.log(`Seeded ${SONG_COUNT} songs by ${artists.size} artists and ${TAGS.length} tags.`);
  console.log(
    'Clear the app’s IndexedDB cache (or site data) to see them: it only refetches when empty.'
  );
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
