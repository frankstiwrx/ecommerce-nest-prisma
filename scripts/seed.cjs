// scripts/seed.cjs
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const products = [
  // --- Camisas de Clubes Europeus ---
  { name: "Camisa Barcelona 23/24 Home Nike", slug: "camisa-barcelona-2324-home-nike", priceCents: 34990, stock: 10 },
  { name: "Camisa Real Madrid 23/24 Home Adidas", slug: "camisa-real-madrid-2324-home-adidas", priceCents: 34990, stock: 12 },
  { name: "Camisa PSG 23/24 Away Nike", slug: "camisa-psg-2324-away-nike", priceCents: 35990, stock: 8 },
  { name: "Camisa Manchester City 23/24 Puma", slug: "camisa-manchester-city-2324-puma", priceCents: 33990, stock: 9 },
  { name: "Camisa Manchester United 23/24 Adidas", slug: "camisa-manchester-united-2324-adidas", priceCents: 34990, stock: 11 },
  { name: "Camisa Chelsea 23/24 Home Nike", slug: "camisa-chelsea-2324-home-nike", priceCents: 33990, stock: 8 },
  { name: "Camisa Juventus 23/24 Adidas", slug: "camisa-juventus-2324-adidas", priceCents: 34990, stock: 10 },
  { name: "Camisa Milan 23/24 Puma", slug: "camisa-milan-2324-puma", priceCents: 34990, stock: 9 },
  { name: "Camisa Bayern de Munique 23/24 Adidas", slug: "camisa-bayern-2324-adidas", priceCents: 34990, stock: 12 },
  { name: "Camisa Borussia Dortmund 23/24 Puma", slug: "camisa-dortmund-2324-puma", priceCents: 33990, stock: 10 },

  // --- Camisas de Clubes Brasileiros ---
  { name: "Camisa Flamengo 23/24 Adidas", slug: "camisa-flamengo-2324-adidas", priceCents: 29990, stock: 15 },
  { name: "Camisa Palmeiras 23/24 Puma", slug: "camisa-palmeiras-2324-puma", priceCents: 29990, stock: 14 },
  { name: "Camisa Corinthians 23/24 Nike", slug: "camisa-corinthians-2324-nike", priceCents: 29990, stock: 11 },
  { name: "Camisa São Paulo 23/24 Adidas", slug: "camisa-sao-paulo-2324-adidas", priceCents: 29990, stock: 10 },
  { name: "Camisa Santos 23/24 Umbro", slug: "camisa-santos-2324-umbro", priceCents: 27990, stock: 12 },
  { name: "Camisa Grêmio 23/24 Umbro", slug: "camisa-gremio-2324-umbro", priceCents: 27990, stock: 13 },
  { name: "Camisa Internacional 23/24 Adidas", slug: "camisa-internacional-2324-adidas", priceCents: 28990, stock: 12 },
  { name: "Camisa Atlético Mineiro 23/24 Adidas", slug: "camisa-atletico-mg-2324-adidas", priceCents: 28990, stock: 11 },
  { name: "Camisa Cruzeiro 23/24 Adidas", slug: "camisa-cruzeiro-2324-adidas", priceCents: 28990, stock: 11 },
  { name: "Camisa Botafogo 23/24 Reebok", slug: "camisa-botafogo-2324-reebok", priceCents: 27990, stock: 10 },

  // --- Camisas de Seleções ---
  { name: "Camisa Brasil Home 2024 Nike", slug: "camisa-brasil-home-2024-nike", priceCents: 34990, stock: 20 },
  { name: "Camisa Argentina Home 2024 Adidas", slug: "camisa-argentina-home-2024-adidas", priceCents: 34990, stock: 18 },
  { name: "Camisa Alemanha Home 2024 Adidas", slug: "camisa-alemanha-home-2024-adidas", priceCents: 34990, stock: 12 },
  { name: "Camisa Portugal Home 2024 Nike", slug: "camisa-portugal-home-2024-nike", priceCents: 34990, stock: 10 },
  { name: "Camisa França Home 2024 Nike", slug: "camisa-franca-home-2024-nike", priceCents: 34990, stock: 14 },
  { name: "Camisa Inglaterra Home 2024 Nike", slug: "camisa-inglaterra-home-2024-nike", priceCents: 34990, stock: 13 },
  { name: "Camisa Itália Home 2024 Adidas", slug: "camisa-italia-home-2024-adidas", priceCents: 34990, stock: 12 },
  { name: "Camisa Holanda Home 2024 Nike", slug: "camisa-holanda-home-2024-nike", priceCents: 34990, stock: 11 },

  // --- Artigos Esportivos ---
  { name: "Chuteira Nike Mercurial Vapor", slug: "chuteira-nike-mercurial-vapor", priceCents: 59990, stock: 6 },
  { name: "Chuteira Adidas Predator Accuracy", slug: "chuteira-adidas-predator-accuracy", priceCents: 57990, stock: 7 },
  { name: "Chuteira Puma Future Ultimate", slug: "chuteira-puma-future-ultimate", priceCents: 54990, stock: 5 },
  { name: "Bola Oficial Copa do Mundo Adidas", slug: "bola-oficial-copa-mundo-adidas", priceCents: 39990, stock: 20 },
  { name: "Bola Champions League Oficial Adidas", slug: "bola-champions-league-adidas", priceCents: 41990, stock: 18 },
  { name: "Luva de Goleiro Nike Grip3", slug: "luva-goleiro-nike-grip3", priceCents: 29990, stock: 8 },
  { name: "Luva de Goleiro Adidas Predator Pro", slug: "luva-goleiro-adidas-predator-pro", priceCents: 28990, stock: 7 },
  { name: "Mochila Esportiva Nike Academy", slug: "mochila-esportiva-nike-academy", priceCents: 17990, stock: 15 },
  { name: "Mochila Adidas Tiro", slug: "mochila-adidas-tiro", priceCents: 16990, stock: 14 },
  { name: "Garrafa Esportiva Adidas 750ml", slug: "garrafa-esportiva-adidas-750ml", priceCents: 5990, stock: 25 },
  { name: "Garrafa Esportiva Nike 700ml", slug: "garrafa-esportiva-nike-700ml", priceCents: 6490, stock: 28 },
];

async function main() {
  let created = 0, updated = 0;

  for (const p of products) {
    const existing = await prisma.product.findUnique({
      where: { slug: p.slug },
      select: { id: true },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { name: p.name, priceCents: p.priceCents, stock: p.stock },
      });
      updated++;
    } else {
      await prisma.product.create({ data: p });
      created++;
    }
  }

  console.log(`Seed OK ✅  Criados: ${created} | Atualizados: ${updated}`);
}

main()
  .catch((e) => { console.error("Erro no seed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
