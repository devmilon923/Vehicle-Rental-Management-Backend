import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/util/prisma";
import { RentalStatus } from "../src/generated/prisma/client";
import { calculateRentalDays, toUTCMidnight } from "../src/util/date";

async function main() {
  console.log("Starting database seeding...");

  // 1. Seed Staff Account
  const staffEmail = "staff@example.com";
  let staff = await prisma.staff.findUnique({
    where: { email: staffEmail },
  });

  if (!staff) {
    const password_hash = await bcrypt.hash("password", 10);
    staff = await prisma.staff.create({
      data: {
        name: "Test Staff",
        email: staffEmail,
        password_hash,
        role: "STAFF",
      },
    });
    console.log("Seeded staff account:", staff.email);
  } else {
    console.log("Staff account already exists:", staff.email);
  }

  // 2. Seed Vehicles
  const vehicle1Data = {
    name: "Toyota Camry",
    plate_number: "ABC-1234",
    category: "Sedan",
    daily_rate: 2500,
  };

  const vehicle2Data = {
    name: "Honda CR-V",
    plate_number: "XYZ-5678",
    category: "SUV",
    daily_rate: 3500,
  };

  let vehicle1 = await prisma.vehicle.findUnique({
    where: { plate_number: vehicle1Data.plate_number },
  });

  if (!vehicle1) {
    vehicle1 = await prisma.vehicle.create({
      data: vehicle1Data,
    });
    console.log("Seeded vehicle 1:", vehicle1.name);
  } else {
    console.log("Vehicle 1 already exists:", vehicle1.name);
  }

  let vehicle2 = await prisma.vehicle.findUnique({
    where: { plate_number: vehicle2Data.plate_number },
  });

  if (!vehicle2) {
    vehicle2 = await prisma.vehicle.create({
      data: vehicle2Data,
    });
    console.log("Seeded vehicle 2:", vehicle2.name);
  } else {
    console.log("Vehicle 2 already exists:", vehicle2.name);
  }

  // 3. Seed Rentals (including a cross-month rental)
  // Rental 1: Cross-month rental (July 29, 2026 -> August 3, 2026)
  const crossMonthStart = toUTCMidnight("2026-07-29");
  const crossMonthEnd = toUTCMidnight("2026-08-03");
  const crossMonthDays = calculateRentalDays(crossMonthStart, crossMonthEnd);
  const crossMonthTotalAmount = Number(vehicle1.daily_rate) * crossMonthDays;

  const existingCrossMonthRental = await prisma.rental.findFirst({
    where: {
      vehicle_id: vehicle1.id,
      start_date: crossMonthStart,
      end_date: crossMonthEnd,
    },
  });

  if (!existingCrossMonthRental) {
    const rental1 = await prisma.rental.create({
      data: {
        vehicle_id: vehicle1.id,
        customer_name: "John Doe",
        customer_phone: "+1234567890",
        start_date: crossMonthStart,
        end_date: crossMonthEnd,
        total_amount: crossMonthTotalAmount,
        status: RentalStatus.BOOKED,
      },
    });
    console.log(
      `Seeded cross-month rental (ID: ${rental1.id}) for ${vehicle1.name}: July 29 -> August 3`
    );
  } else {
    console.log("Cross-month rental already exists");
  }

  // Rental 2: In-month rental (August 10, 2026 -> August 15, 2026)
  const inMonthStart = toUTCMidnight("2026-08-10");
  const inMonthEnd = toUTCMidnight("2026-08-15");
  const inMonthDays = calculateRentalDays(inMonthStart, inMonthEnd);
  const inMonthTotalAmount = Number(vehicle2.daily_rate) * inMonthDays;

  const existingInMonthRental = await prisma.rental.findFirst({
    where: {
      vehicle_id: vehicle2.id,
      start_date: inMonthStart,
      end_date: inMonthEnd,
    },
  });

  if (!existingInMonthRental) {
    const rental2 = await prisma.rental.create({
      data: {
        vehicle_id: vehicle2.id,
        customer_name: "Jane Smith",
        customer_phone: "+1987654321",
        start_date: inMonthStart,
        end_date: inMonthEnd,
        total_amount: inMonthTotalAmount,
        status: RentalStatus.COMPLETED,
      },
    });
    console.log(
      `Seeded in-month rental (ID: ${rental2.id}) for ${vehicle2.name}: August 10 -> August 15`
    );
  } else {
    console.log("In-month rental already exists");
  }

  console.log("Database seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
