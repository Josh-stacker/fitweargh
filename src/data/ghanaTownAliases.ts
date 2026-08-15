// Neighbourhood / town → district aliases.
//
// The district boundaries in ghanaDistricts.ts are GADM level-2, so they only
// know coarse names like "Accra" or "Ga East". Customers type where they
// actually live — "Osu", "Madina", "Spintex" — none of which are districts.
// Without this map those addresses fall through to "contact us for a price"
// even though they are ordinary Accra deliveries.
//
// Keys are matched loosely (case and punctuation are ignored), so "East Legon"
// also catches "east-legon" and "EastLegon".
//
// This list is best-effort and deliberately incomplete — anything not listed
// still falls back to the district names themselves, then to contact-us. Add
// to it whenever a real order comes in from an area that was not recognised.

export const TOWN_ALIASES: Record<string, string> = {};

function alias(district: string, ...towns: string[]) {
  for (const town of towns) TOWN_ALIASES[town] = district;
}

// ── Greater Accra ────────────────────────────────────────────────────────────
alias(
  "Accra",
  "Osu", "Labone", "La", "Labadi", "Cantonments", "Airport Residential", "Airport City",
  "Airport", "Dzorwulu", "Abelemkpe", "Achimota", "Dansoman", "Mamprobi", "Korle Bu",
  "Korle Gonno", "Chorkor", "Jamestown", "James Town", "Ussher Town", "Usshertown",
  "Adabraka", "Asylum Down", "Kokomlemle", "Nima", "Mamobi", "Kanda", "Ridge",
  "Roman Ridge", "North Ridge", "Tesano", "Kaneshie", "Bubuashie", "Bubiashie",
  "Awudome", "Odorkor", "Darkuman", "Lartebiokorshie", "Abossey Okai", "Circle",
  "Kwame Nkrumah Circle", "Alajo", "Kotobabi", "Accra New Town", "New Town",
  "Ringway", "Ringway Estates", "Burma Camp", "Teshie", "Nungua", "East Legon",
  "Shiashie", "Okponglo", "Legon", "Lapaz", "Abeka", "Abeka Lapaz", "Tabora",
  "Sakaman", "Mataheko", "Makola", "Tudu", "Agbogbloshie", "Ako Adjei", "Ministries",
  "Osu Oxford Street", "Adenta Barrier", "Kwashieman",
);

alias(
  "Ga East",
  "Madina", "Adenta", "Adentan", "Haatso", "Agbogba", "Ashongman", "Ashaley Botwe",
  "Dome", "Kwabenya", "Taifa", "Atomic", "Abokobi", "Pantang", "Oyarifa", "Frafraha",
  "Ogbojo", "East Legon Hills", "Danfa", "Amrahia", "Teiman", "Kisseman", "Musuku",
);

alias(
  "Ga West",
  "Amasaman", "Pokuase", "Ofankor", "Sowutuom", "Anyaa", "Santa Maria", "Weija",
  "Gbawe", "McCarthy Hill", "Bortianor", "Kokrobite", "Tuba", "Mallam", "Ablekuma",
  "Oduman", "Nsakina", "Mile 7", "Awoshie", "Sakaman Junction",
);

alias(
  "Tema",
  "Tema", "Ashaiman", "Sakumono", "Lashibi", "Michel Camp", "Kpone", "Katamanso",
  "Afienya", "Dawhenya", "Adjei Kojo", "Zenu", "Gbetsile", "Spintex", "Baatsona",
  "Batsona", "Devtraco", "Manet", "Tema Community 1", "Tema Community 25",
);

alias("Dangbe West", "Prampram", "Ningo", "Old Ningo", "Dodowa", "Ayikuma", "Doryumu", "Osudoku", "Asutsuare", "Shai Hills");
alias("Dangbe East", "Ada", "Ada Foah", "Big Ada", "Sege", "Kasseh", "Anyamam");

// ── Ashanti ──────────────────────────────────────────────────────────────────
alias(
  "Kumasi",
  "Kumasi", "Adum", "Bantama", "Asokwa", "Suame", "Ahodwo", "Nhyiaeso", "Santasi",
  "Atonsu", "Oforikrom", "Ayeduase", "Bomso", "Kwadaso", "Patasi", "Dichemso",
  "Manhyia", "Asafo", "Amakom", "Ashtown", "Ash Town", "KNUST", "Ayigya", "Buokrom",
  "Sokoban", "Atasomanso", "Maakro", "Kumasi Tafo",
);
alias("Obuasi Municipal", "Obuasi");
alias("Ejisu-Juabeng", "Ejisu", "Juaben", "Emena");
alias("Atwima", "Abuakwa", "Tanoso", "Nkawie");
alias("Asante Akim North", "Konongo", "Agogo");
alias("Sekyere West", "Mampong");
alias("Offinso", "Offinso");
alias("Amansie East", "Bekwai");

// ── Central ──────────────────────────────────────────────────────────────────
alias("Awutu Efutu Senya", "Kasoa", "Winneba", "Bawjiase", "Awutu");
alias("Cape Coast", "Cape Coast");
alias("Komenda-Edina-Eguafo-Abirem", "Elmina", "Komenda");
alias("Agona", "Swedru", "Agona Swedru");
alias("Mfantsiman", "Saltpond", "Mankessim", "Anomabo");
alias("Upper Denkyira", "Dunkwa");
alias("Assin North", "Assin Foso");
alias("Gomoa", "Buduburam", "Budumburam", "Apam");

// ── Eastern ──────────────────────────────────────────────────────────────────
alias("New Juaben", "Koforidua");
alias("Akwapim South", "Nsawam", "Aburi");
alias("Akwapim North", "Akropong", "Mampong Akuapem", "Mamfe");
alias("Suhum Kraboa Coaltar", "Suhum");
alias("Kwahu West", "Nkawkaw");
alias("Kwahu South", "Mpraeso", "Obo", "Abetifi");
alias("Birim South", "Akim Oda", "Oda");
alias("Kwabibirem", "Kade", "Akwatia");
alias("East Akim", "Kibi", "Asiakwa");
alias("Yilo Krobo", "Somanya");
alias("Manya Krobo", "Odumase Krobo", "Kpong");
alias("Asuogyaman", "Akosombo", "Atimpoku");
alias("Fanteakwa", "Begoro");
alias("West Akim", "Asamankese");
alias("Afram Plains", "Donkorkrom");

// ── Volta ────────────────────────────────────────────────────────────────────
alias("Ho", "Ho");
alias("Hohoe", "Hohoe");
alias("Keta", "Keta", "Anloga");
alias("Ketu", "Aflao", "Denu", "Dzodze");
alias("South Tongu", "Sogakope");
alias("North Tongu", "Battor", "Adidome");
alias("Kpandu", "Kpando");
alias("Akatsi", "Akatsi");
alias("Krachi", "Kete Krachi");

// ── Northern ─────────────────────────────────────────────────────────────────
alias("Tamale", "Tamale");
alias("Yendi", "Yendi");
alias("Savelugu Nanton", "Savelugu");
alias("Nanumba North", "Bimbilla");
alias("East Gonja", "Salaga");
alias("West Gonja", "Damongo");
alias("Bole", "Bole");
alias("West Mamprusi", "Walewale");
alias("East Mamprusi", "Gambaga", "Nalerigu");
alias("Tolon-Kumbungu", "Tolon", "Kumbungu");
alias("Gushiegu", "Gushegu");
alias("Central Gonja", "Buipe");

// ── Upper East ───────────────────────────────────────────────────────────────
alias("Bolgatanga", "Bolgatanga", "Bolga");
alias("Bawku Municipal", "Bawku");
alias("Kassena Nankana", "Navrongo", "Paga");
alias("Bawku West", "Zebilla");
alias("Builsa", "Sandema");
alias("Bongo", "Bongo");
alias("Garu Tempane", "Garu");

// ── Upper West ───────────────────────────────────────────────────────────────
alias("Wa", "Wa");
alias("Lawra", "Lawra", "Nandom");
alias("Jirapa Lambussie", "Jirapa");
alias("Sissala East", "Tumu");
alias("Nadowli", "Nadowli");

// ── Western ──────────────────────────────────────────────────────────────────
alias("Shama Ahanta East", "Takoradi", "Sekondi", "Shama", "Sekondi-Takoradi", "Effia");
alias("Wassa West", "Tarkwa", "Prestea", "Bogoso");
alias("Nzema East", "Axim");
alias("Jomoro", "Half Assini", "Elubo");
alias("Ahanta West", "Agona Nkwanta", "Busua");
alias("Bibiani Anhwiaso Bekwai", "Bibiani");
alias("Sefwi Wiawso", "Sefwi Wiawso", "Wiawso");
alias("Aowin-Suaman", "Enchi");
alias("Wasa Amenfi West", "Asankragwa", "Asankragua");

// ── Brong Ahafo ──────────────────────────────────────────────────────────────
alias("Sunyani", "Sunyani");
alias("Techiman", "Techiman");
alias("Berekum", "Berekum");
alias("Dormaa", "Dormaa Ahenkro", "Dormaa");
alias("Kintampo North", "Kintampo");
alias("Atebubu-Amantin", "Atebubu");
alias("Nkoranza", "Nkoranza");
alias("Asunafo North", "Goaso");
alias("Tano North", "Bechem", "Duayaw Nkwanta");
alias("Jaman North", "Sampa");
alias("Jaman South", "Drobo");
alias("Pru", "Yeji");
