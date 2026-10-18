import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("TourFlow123!", 10);

  await prisma.user.upsert({
    where: { email: "admin@tourflow.test" },
    update: {},
    create: {
      name: "TourFlow Admin",
      email: "admin@tourflow.test",
      passwordHash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "traveler@tourflow.test" },
    update: {},
    create: {
      name: "Demo Traveler",
      email: "traveler@tourflow.test",
      passwordHash,
    },
  });

  const tours = [
    {
      title: "Cox's Bazar Beach Escape",
      description: "Relax by the sea, explore the shoreline, and enjoy fresh local seafood.",
      location: "Cox's Bazar",
      durationDays: 3,
      price: 8500,
      category: "Beach",
    },
    {
      title: "Sundarbans Mangrove Adventure",
      description: "Cruise the waterways and discover the world's largest mangrove forest.",
      location: "Khulna",
      durationDays: 4,
      price: 14500,
      category: "Nature",
    },
    {
      title: "Sylhet Tea Garden Retreat",
      description: "Visit rolling tea estates, waterfalls, and scenic countryside.",
      location: "Sylhet",
      durationDays: 3,
      price: 9200,
      category: "Nature",
    },
    {
      title: "Old Dhaka Food & Heritage Walk",
      description: "Explore historic streets, landmarks, and beloved local food spots.",
      location: "Dhaka",
      durationDays: 1,
      price: 2500,
      category: "Culture",
    },
  ];

  for (const tour of tours) {
    await prisma.tour.upsert({
      where: { title: tour.title },
      update: tour,
      create: tour,
    });
  }

  console.log("Seeded demo users and tours.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
