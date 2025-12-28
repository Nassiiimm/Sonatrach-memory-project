// backend/scripts/seed-hotels.js

require("dotenv").config();
const mongoose = require("mongoose");
const Hotel = require("../src/models/Hotel");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/sonatrach_reservations";

const HOTELS = [
  // -------------------- ALGER --------------------
  {
    name: "Hilton Alger",
    city: "Alger",
    country: "Algérie",
    code: "HIL-ALG",
    prices: {
      simple: 18000,
      demi_pension: 25000,
      pension_complete: 32000,
      formule_repas: 5000
    },
    roomTypes: [
      { label: "Single", code: "SGL", basePrice: 18000 },
      { label: "Double", code: "DBL", basePrice: 25000 },
      { label: "Suite", code: "STE", basePrice: 40000 }
    ],
    provider: "Hilton Worldwide",
    notes: "Hôtel 5★ — standard international."
  },
  {
    name: "Sofitel Alger Hamma Garden",
    city: "Alger",
    country: "Algérie",
    code: "SOF-ALG",
    prices: {
      simple: 20000,
      demi_pension: 28000,
      pension_complete: 35000,
      formule_repas: 6000
    },
    roomTypes: [
      { label: "Single", code: "SGL", basePrice: 20000 },
      { label: "Double", code: "DBL", basePrice: 28000 },
      { label: "Suite", code: "STE", basePrice: 45000 }
    ],
    provider: "Accor Hotels",
    notes: "Hôtel 5★ — zone Hamma."
  },

  // -------------------- ORAN --------------------
  {
    name: "Le Méridien Oran",
    city: "Oran",
    country: "Algérie",
    code: "MER-ORN",
    prices: {
      simple: 15000,
      demi_pension: 22000,
      pension_complete: 28000,
      formule_repas: 4500
    },
    roomTypes: [
      { label: "Single", code: "SGL", basePrice: 15000 },
      { label: "Double", code: "DBL", basePrice: 23000 },
      { label: "Suite", code: "STE", basePrice: 35000 }
    ],
    provider: "Marriott",
    notes: "Vue sur mer."
  },
  {
    name: "Four Points by Sheraton Oran",
    city: "Oran",
    country: "Algérie",
    code: "FPT-ORN",
    prices: {
      simple: 14000,
      demi_pension: 21000,
      pension_complete: 26000,
      formule_repas: 4000
    },
    roomTypes: [
      { label: "Single", code: "SGL", basePrice: 14000 },
      { label: "Double", code: "DBL", basePrice: 21000 }
    ],
    provider: "Marriott",
    notes: "Accès autoroute pratique."
  },

  // -------------------- ANNABA --------------------
  {
    name: "Sheraton Annaba",
    city: "Annaba",
    country: "Algérie",
    code: "SHE-ANB",
    prices: {
      simple: 16000,
      demi_pension: 23000,
      pension_complete: 29000,
      formule_repas: 4300
    },
    roomTypes: [
      { label: "Single", code: "SGL", basePrice: 16000 },
      { label: "Double", code: "DBL", basePrice: 23000 },
      { label: "Suite", code: "STE", basePrice: 36000 }
    ],
    provider: "Marriott",
    notes: "Hôtel 5★ moderne."
  },
  {
    name: "Hôtel Sabri Resort",
    city: "Annaba",
    country: "Algérie",
    code: "SBR-ANB",
    prices: {
      simple: 9000,
      demi_pension: 14000,
      pension_complete: 18000,
      formule_repas: 3500
    },
    roomTypes: [
      { label: "Single", code: "SGL", basePrice: 9000 },
      { label: "Double", code: "DBL", basePrice: 14000 }
    ],
    provider: "Privé",
    notes: "Idéal pour missions courtes."
  }
];

async function run() {
  try {
    console.log("Connexion à MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✔️ Connecté.");

    console.log("Suppression des hôtels existants...");
    await Hotel.deleteMany({});

    console.log("Insertion des hôtels...");
    await Hotel.insertMany(HOTELS);

    console.log(`✔️ ${HOTELS.length} hôtels insérés avec succès.`);
  } catch (err) {
    console.error("❌ Erreur seed hotels :", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();