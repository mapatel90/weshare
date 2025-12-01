import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { insertLocationData } from "../server/utils/location-data-package.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create default roles
  const roles = [
    { id: 1, name: 'superadmin', status: 1 },
    { id: 2, name: 'staffadmin', status: 1 },
    { id: 3, name: 'offtaker', status: 1 },
    { id: 4, name: 'investor', status: 1 },
  ];

  console.log("📝 Creating roles...");
  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData,
    });
    console.log(`✅ Role created: ${roleData.name}`);
  }

  // Insert comprehensive location data using the package
  console.log("🌍 Inserting comprehensive location data...");
  const locationStats = await insertLocationData();
  // Get some location data for user creation
  const indiaCountry = await prisma.country.findFirst({
    where: { name: "India" },
  });
  const usaCountry = await prisma.country.findFirst({
    where: { name: "United States" },
  });
  const vietnamCountry = await prisma.country.findFirst({
    where: { name: "Vietnam" },
  });

  // Create default admin user
  const adminPassword = await bcrypt.hash("admin123", 12);

  console.log("👤 Creating admin user...");
  const ahmedabadCity = await prisma.city.findFirst({
    where: { name: "Ahmedabad" },
    include: { state: true },
  });

  // Create sample users with location data
  const mumbaiCity = await prisma.city.findFirst({
    where: { name: "Mumbai" },
    include: { state: true },
  });

  const losAngelesCity = await prisma.city.findFirst({
    where: { name: "Los Angeles" },
    include: { state: true },
  });

  const hoChiMinhCity = await prisma.city.findFirst({
    where: { name: "Ho Chi Minh City" },
    include: { state: true },
  });

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      fullName: 'System Administrator',
      username: 'admin',
      email: 'admin@sunshare.com',
      password: adminPassword,
      userRole: 1,
      phoneNumber: "+1234567890",
      countryId: vietnamCountry?.id,
      stateId: hoChiMinhCity?.stateId,
      cityId: hoChiMinhCity?.id,
      address1: "123 Admin Street",
      zipcode: "700000",
      status: 1, // Active
    },
  });
  console.log('✅ Admin user created: admin (password: admin123)');



  const sampleUsers = [
    {
      fullName: 'John Manager',
      username: 'johnmanager',
      email: 'manager@sunshare.com',
      userRole: 2,
      phoneNumber: "+1234567891",
      countryId: indiaCountry?.id,
      stateId: mumbaiCity?.stateId,
      cityId: mumbaiCity?.id,
      address1: "456 Manager Avenue",
      zipcode: "400001",
    },
    {
      fullName: 'Test User',
      username: 'testuser',
      email: 'wrapcode.info@gmail.com',
      userRole: 3,
      phoneNumber: "+1234567892",
      countryId: usaCountry?.id,
      stateId: losAngelesCity?.stateId,
      cityId: losAngelesCity?.id,
      address1: "789 Test Boulevard",
      zipcode: "90210",
    },
    {
      fullName: 'Nguyen Van Minh',
      username: 'vietnamuser',
      email: 'vietnam.user@sunshare.com',
      userRole: 3,
      phoneNumber: "+84901234567",
      countryId: vietnamCountry?.id,
      stateId: hoChiMinhCity?.stateId,
      cityId: hoChiMinhCity?.id,
      address1: "123 Nguyen Hue Street",
      zipcode: "700000",
    },
  ];

  console.log("👥 Creating sample users...");
  const defaultPassword = await bcrypt.hash("password123", 12);
  const testPassword = await bcrypt.hash("123456", 12);

  for (const userData of sampleUsers) {
    const password =
      userData.email === "wrapcode.info@gmail.com"
        ? testPassword
        : defaultPassword;
    await prisma.user.upsert({
      // Prisma schema requires a unique field in `where`. Use `username` which is unique.
      where: { username: userData.username },
      update: {},
      create: {
        ...userData,
        password: password,
        status: 1, // Active
      },
    });
    const passwordText =
      userData.email === "wrapcode.info@gmail.com" ? "123456" : "password123";
    console.log(
      `✅ User created: ${userData.email} (password: ${passwordText})`
    );
  }

  // -----------------------------
  // 🌞 Create Inverter Types
  // -----------------------------
  console.log("⚙️ Creating inverter types...");

  const inverterTypes = [
    { type: "Grid Tied", status: 1 },
    { type: "Hybrid", status: 1 },
    { type: "Off Grid", status: 1 },
    { type: "Single Phase", status: 1 },
    { type: "Three Phase", status: 1 },
  ];

  for (const inverterType of inverterTypes) {
    await prisma.inverterType.upsert({
      where: { type: inverterType.type },
      update: {},
      create: inverterType,
    });
    console.log(`✅ Inverter type added: ${inverterType.type}`);
  }

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
