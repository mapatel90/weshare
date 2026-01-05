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
    await prisma.roles.upsert({
      where: { id: roleData.id },
      update: {},
      create: roleData,
    });
    console.log(`✅ Role created: ${roleData.name}`);
  }

  // Insert comprehensive location data using the package
  console.log("🌍 Inserting comprehensive location data...");
  const locationStats = await insertLocationData();
  // Get some location data for user creation
  const indiaCountry = await prisma.countries.findFirst({
    where: { name: "India" },
  });
  const usaCountry = await prisma.countries.findFirst({
    where: { name: "United States" },
  });
  const vietnamCountry = await prisma.countries.findFirst({
    where: { name: "Vietnam" },
  });

  // Create default admin user
  const adminPassword = await bcrypt.hash("admin123", 12);

  console.log("👤 Creating admin user...");
  const ahmedabadCity = await prisma.cities.findFirst({
    where: { name: "Ahmedabad" },
  });

  // Create sample users with location data
  const mumbaiCity = await prisma.cities.findFirst({
    where: { name: "Mumbai" },
  });

  const losAngelesCity = await prisma.cities.findFirst({
    where: { name: "Los Angeles" },
  });

  const hoChiMinhCity = await prisma.cities.findFirst({
    where: { name: "Ho Chi Minh City" },
  });

  const existingAdmin = await prisma.users.findFirst({
    where: { username: 'admin' },
  });

  if (!existingAdmin) {
    await prisma.users.create({
      data: {
        full_name: 'System Administrator',
        username: 'admin',
        email: 'admin@sunshare.com',
        password: adminPassword,
        role_id: 1,
        phone_number: "+1234567890",
        country_id: vietnamCountry?.id,
        state_id: hoChiMinhCity?.state_id,
        city_id: hoChiMinhCity?.id,
        address_1: "123 Admin Street",
        zipcode: "700000",
        status: 1, // Active
      },
    });
    console.log('✅ Admin user created: admin (password: admin123)');
  } else {
    console.log('ℹ️ Admin user already exists, skipping...');
  }



  const sampleUsers = [
    {
      full_name: 'John Manager',
      username: 'johnmanager',
      email: 'manager@sunshare.com',
      role_id: 2,
      phone_number: "+1234567891",
      country_id: indiaCountry?.id,
      state_id: mumbaiCity?.state_id,
      city_id: mumbaiCity?.id,
      address_1: "456 Manager Avenue",
      zipcode: "400001",
    },
    {
      full_name: 'Test User',
      username: 'testuser',
      email: 'wrapcode.info@gmail.com',
      role_id: 3,
      phone_number: "+1234567892",
      country_id: usaCountry?.id,
      state_id: losAngelesCity?.state_id,
      city_id: losAngelesCity?.id,
      address_1: "789 Test Boulevard",
      zipcode: "90210",
    },
    {
      full_name: 'Nguyen Van Minh',
      username: 'vietnamuser',
      email: 'vietnam.user@sunshare.com',
      role_id: 3,
      phone_number: "+84901234567",
      country_id: vietnamCountry?.id,
      state_id: hoChiMinhCity?.state_id,
      city_id: hoChiMinhCity?.id,
      address_1: "123 Nguyen Hue Street",
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

    const existingUser = await prisma.users.findFirst({
      where: { username: userData.username },
    });

    if (!existingUser) {
      await prisma.users.create({
        data: {
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
    } else {
      console.log(`ℹ️ User ${userData.username} already exists, skipping...`);
    }
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
    const existingType = await prisma.inverter_type.findFirst({
      where: { type: inverterType.type },
    });

    if (!existingType) {
      await prisma.inverter_type.create({
        data: inverterType,
      });
      console.log(`✅ Inverter type added: ${inverterType.type}`);
    } else {
      console.log(`ℹ️ Inverter type ${inverterType.type} already exists, skipping...`);
    }
  }

  // -----------------------------
  // 💰 Create Taxes
  // -----------------------------
  console.log("💰 Creating taxes...");

  const taxes = [
    { name: "VAT", value: 8 },
    { name: "VAT", value: 10 },
  ];

  for (const tax of taxes) {
    const existingTax = await prisma.taxes.findFirst({
      where: { value: tax.value },
    });

    if (!existingTax) {
      await prisma.taxes.create({
        data: tax,
      });
      console.log(`✅ Tax added: ${tax.name}`);
    } else {
      console.log(`ℹ️ Tax ${tax.name} already exists, skipping...`);
    }
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
