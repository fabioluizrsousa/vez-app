import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

// Prisma 7 exige um driver adapter mesmo pra scripts avulsos como este — não
// dá mais pra só fazer `new PrismaClient()`. Mesmo padrão de app/_lib/prisma.ts.
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL não está definida. Confira seu arquivo .env.")
}
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

/**
 * Seed de exemplo — um único profissional autônomo (Renato Cortes), coerente
 * com os mocks em telas-produto.html. Não usa NextAuth: é só pra ter algo
 * pra ver em /renato-cortes e no dashboard sem precisar logar com Google.
 */
async function main() {
  const professional = await prisma.user.upsert({
    where: { email: "renato@exemplo.com" },
    update: {},
    create: {
      email: "renato@exemplo.com",
      name: "Renato Cortes",
      businessName: "Renato Cortes",
      slug: "renato-cortes",
      phone: "(27) 99911-2233",
      address: "Rua Soturno, 210 — Centro",
      cancellationWindowHours: 2,
      onboarded: true,
    },
  })

  const serviceDefs = [
    { name: "Corte", durationMinutes: 35, price: 45, order: 0 },
    { name: "Barba", durationMinutes: 25, price: 35, order: 1 },
    { name: "Corte + Barba", durationMinutes: 55, price: 70, order: 2 },
    { name: "Sobrancelha", durationMinutes: 15, price: 20, order: 3 },
  ]

  // Apaga primeiro quem depende (Booking) antes de quem é referenciado
  // (Service) — na ordem inversa, o deleteMany de Service esbarra na FK
  // Booking_serviceId_fkey sempre que já existir agendamento de uma seed
  // anterior.
  await prisma.booking.deleteMany({ where: { professionalId: professional.id } })
  await prisma.service.deleteMany({ where: { professionalId: professional.id } })
  const services = await Promise.all(
    serviceDefs.map((s) =>
      prisma.service.create({ data: { ...s, professionalId: professional.id } }),
    ),
  )

  await prisma.availability.deleteMany({ where: { professionalId: professional.id } })
  // Segunda a sábado, 9h às 18h
  await prisma.availability.createMany({
    data: [1, 2, 3, 4, 5, 6].map((weekday) => ({
      professionalId: professional.id,
      weekday,
      startTime: "09:00",
      endTime: "18:00",
    })),
  })

  const corte = services.find((s) => s.name === "Corte")!
  const barba = services.find((s) => s.name === "Barba")!
  const corteBarba = services.find((s) => s.name === "Corte + Barba")!
  const sobrancelha = services.find((s) => s.name === "Sobrancelha")!

  const today = new Date()
  const at = (hours: number, minutes: number) =>
    new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes)

  await prisma.booking.deleteMany({ where: { professionalId: professional.id } })
  await prisma.booking.createMany({
    data: [
      {
        professionalId: professional.id,
        serviceId: corte.id,
        clientName: "Marcos Andrade",
        clientPhone: "(27) 99911-0001",
        scheduledAt: at(9, 0),
        status: "COMPLETED",
      },
      {
        professionalId: professional.id,
        serviceId: barba.id,
        clientName: "Diego Farias",
        clientPhone: "(27) 99911-0002",
        scheduledAt: at(11, 30),
        status: "CANCELED",
        canceledAt: today,
      },
      {
        professionalId: professional.id,
        serviceId: corteBarba.id,
        clientName: "Marcos Andrade",
        clientPhone: "(27) 99911-0001",
        scheduledAt: at(14, 30),
        status: "CONFIRMED",
      },
      {
        professionalId: professional.id,
        serviceId: sobrancelha.id,
        clientName: "Yago Ribeiro",
        clientPhone: "(27) 99911-0003",
        scheduledAt: at(16, 30),
        status: "CONFIRMED",
      },
    ],
  })

  console.log(`Seed concluído — acesse /${professional.slug}`)
}

main()
  .catch((error) => {
    console.error("Erro no seed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
