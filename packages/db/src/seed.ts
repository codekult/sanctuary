import { db } from "./client.js";
import {
  taxa,
  users,
  individuals,
  observations,
  phenologyEventTypes,
  properties,
} from "./schema/index.js";

// iNaturalist taxon IDs representing diverse species
const INAT_TAXA = [
  47126, // Quercus (oaks) — genus, Plantae
  12727, // Turdus merula (Common Blackbird) — species, Animalia
  47219, // Agaricus (mushrooms) — genus, Fungi
  47158, // Apis mellifera (Honey Bee) — species, Animalia
  55745, // Lavandula angustifolia (Lavender) — species, Plantae
  3454, // Passer domesticus (House Sparrow) — species, Animalia
  58523, // Olea europaea (Olive tree) — species, Plantae
  119014, // Coccinella septempunctata (7-spot Ladybird) — species, Animalia
  47125, // Rosmarinus officinalis (Rosemary) — species, Plantae
  48484, // Boletus edulis (Porcini) — species, Fungi
  4513, // Erithacus rubecula (European Robin) — species, Animalia
  53745, // Ficus carica (Common Fig) — species, Plantae
];

interface INatTaxon {
  id: number;
  name: string;
  rank: string;
  preferred_common_name?: string;
  names?: Array<{ name: string; locale: string }>;
  ancestors?: Array<{ rank: string; name: string }>;
  default_photo?: { medium_url?: string };
  conservation_status?: { status?: string };
  wikipedia_summary?: string;
}

async function fetchINatTaxon(id: number): Promise<INatTaxon | null> {
  try {
    const response = await fetch(`https://api.inaturalist.org/v1/taxa/${id}`);
    const data = (await response.json()) as { results: INatTaxon[] };
    return data.results[0] ?? null;
  } catch (error) {
    console.error(`Failed to fetch taxon ${id}:`, error);
    return null;
  }
}

function mapTaxon(result: INatTaxon) {
  const ancestors = result.ancestors ?? [];
  const findAncestor = (rank: string) => ancestors.find((a) => a.rank === rank)?.name ?? null;

  const spanishName = result.names?.find((n) => n.locale === "es")?.name ?? null;

  return {
    scientificName: result.name,
    commonNameEn: result.preferred_common_name ?? null,
    commonNameEs: spanishName,
    taxonRank: result.rank,
    kingdom: findAncestor("kingdom") ?? "Unknown",
    phylum: findAncestor("phylum"),
    class: findAncestor("class"),
    order: findAncestor("order"),
    family: findAncestor("family"),
    genus: findAncestor("genus"),
    specificEpithet: result.rank === "species" ? (result.name.split(" ")[1] ?? null) : null,
    externalId: String(result.id),
    externalSource: "inaturalist",
    descriptionEn: result.wikipedia_summary ?? null,
    descriptionEs: null,
    conservationStatus: result.conservation_status?.status ?? null,
    thumbnailUrl: result.default_photo?.medium_url ?? null,
  };
}

async function seed() {
  console.log("Seeding database...\n");

  // 1. Create property
  console.log("Creating property...");
  const [property] = await db
    .insert(properties)
    .values({
      name: "Sanctuary Estate",
      descriptionEn: "A biodiverse property for tracking local flora and fauna.",
      descriptionEs: "Una propiedad biodiversa para rastrear flora y fauna local.",
      latitude: "37.3891",
      longitude: "-5.9845",
      timezone: "Europe/Madrid",
    })
    .returning();
  console.log(`  Created property: ${property!.name}`);

  // 2. Import taxa from iNaturalist
  console.log("\nImporting taxa from iNaturalist...");
  const insertedTaxa = [];
  for (const inatId of INAT_TAXA) {
    const result = await fetchINatTaxon(inatId);
    if (!result) continue;

    const mapped = mapTaxon(result);
    const [taxon] = await db.insert(taxa).values(mapped).returning();
    insertedTaxa.push(taxon!);
    console.log(
      `  Imported: ${taxon!.scientificName} (${taxon!.commonNameEn ?? "no common name"})`,
    );

    // Rate limit: be nice to iNaturalist API
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // 3. Create sample admin user
  console.log("\nCreating sample admin user...");
  const [adminUser] = await db
    .insert(users)
    .values({
      id: "00000000-0000-0000-0000-000000000001",
      email: "admin@sanctuary.local",
      name: "Admin User",
      role: "admin",
    })
    .returning();
  console.log(`  Created user: ${adminUser!.name}`);

  // 4. Create sample individuals (use the first few imported taxa)
  console.log("\nCreating sample individuals...");
  const sampleIndividuals = [];

  const individualDefs = [
    {
      nickname: "The Old One",
      descEn: "Notable specimen, first observed near the entrance.",
      descEs: "Espécimen notable, observado por primera vez cerca de la entrada.",
      lat: "37.3895",
      lon: "-5.9840",
      date: "2024-01-15",
    },
    {
      nickname: "Garden Visitor",
      descEn: "Regular visitor to the garden area.",
      descEs: "Visitante habitual del área del jardín.",
      lat: "37.3890",
      lon: "-5.9848",
      date: "2024-03-10",
    },
    {
      nickname: "Terrace Resident",
      descEn: "Resident near the main terrace.",
      descEs: "Residente cerca de la terraza principal.",
      lat: "37.3893",
      lon: "-5.9843",
      date: "2024-02-01",
    },
  ];

  for (let i = 0; i < Math.min(individualDefs.length, insertedTaxa.length); i++) {
    const def = individualDefs[i]!;
    const taxon = insertedTaxa[i]!;
    const [ind] = await db
      .insert(individuals)
      .values({
        taxonId: taxon.id,
        nickname: def.nickname,
        descriptionEn: def.descEn,
        descriptionEs: def.descEs,
        latitude: def.lat,
        longitude: def.lon,
        firstObservedDate: def.date,
        status: "alive",
      })
      .returning();
    sampleIndividuals.push(ind!);
    console.log(
      `  Created individual: ${ind!.nickname} (${taxon.commonNameEn ?? taxon.scientificName})`,
    );
  }

  // 5. Create sample observations
  console.log("\nCreating sample observations...");
  const observationData = [];

  for (let i = 0; i < insertedTaxa.length && observationData.length < 10; i++) {
    const taxon = insertedTaxa[i]!;
    const individual = sampleIndividuals.find((ind) => ind.taxonId === taxon.id);
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    observationData.push({
      taxonId: taxon.id,
      individualId: individual?.id ?? null,
      observerId: adminUser!.id,
      observedAt: date,
      latitude: `37.${3888 + Math.floor(Math.random() * 10)}`,
      longitude: `-5.${9840 + Math.floor(Math.random() * 10)}`,
      description: `Observed ${taxon.commonNameEn ?? taxon.scientificName} in the property.`,
      status: "published",
    });
  }

  const insertedObs = await db.insert(observations).values(observationData).returning();
  console.log(`  Created ${insertedObs.length} observations`);

  // 6. Create phenology event types
  console.log("\nCreating phenology event types...");
  const eventTypeData = [
    {
      nameEn: "Flowering",
      nameEs: "Floración",
      appliesTo: "plantae" as const,
      color: "#E91E63",
      icon: "flower",
    },
    {
      nameEn: "Fruiting",
      nameEs: "Fructificación",
      appliesTo: "plantae" as const,
      color: "#FF9800",
      icon: "apple",
    },
    {
      nameEn: "Leaf Out",
      nameEs: "Brotación",
      appliesTo: "plantae" as const,
      color: "#4CAF50",
      icon: "leaf",
    },
    {
      nameEn: "Leaf Fall",
      nameEs: "Caída de hojas",
      appliesTo: "plantae" as const,
      color: "#795548",
      icon: "fallen-leaf",
    },
    {
      nameEn: "Nesting",
      nameEs: "Anidación",
      appliesTo: "animalia" as const,
      color: "#2196F3",
      icon: "nest",
    },
    {
      nameEn: "Dormancy",
      nameEs: "Dormancia",
      appliesTo: "all" as const,
      color: "#9E9E9E",
      icon: "sleep",
    },
  ];

  const insertedEventTypes = await db.insert(phenologyEventTypes).values(eventTypeData).returning();
  console.log(`  Created ${insertedEventTypes.length} phenology event types`);

  console.log("\nSeed complete!");
  console.log(`  Taxa: ${insertedTaxa.length}`);
  console.log(`  Users: 1`);
  console.log(`  Individuals: ${sampleIndividuals.length}`);
  console.log(`  Observations: ${insertedObs.length}`);
  console.log(`  Phenology Event Types: ${insertedEventTypes.length}`);

  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
