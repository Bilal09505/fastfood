// apps/api/prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminExists = await prisma.user.findUnique({
    where: { email: 'admin@fastfood.com' },
  });

  if (!adminExists) {
    const passwordHash = await bcrypt.hash('admin123', 12);
    await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@fastfood.com',
        passwordHash,
        role: Role.ADMIN,
        isActive: true,
      },
    });
    console.log('✅ Admin user created: admin@fastfood.com / admin123');
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  // Seed sample categories
  const categories = ['Burgers', 'Drinks', 'Fries', 'Sandwiches', 'Desserts'];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✅ Categories seeded');

  // Seed sample materials
  const materials = [
    { name: 'Burger Buns', unit: 'pcs', currentStock: 100, minStockLevel: 20, costPerUnit: 0.5 },
    { name: 'Beef Patty', unit: 'pcs', currentStock: 80, minStockLevel: 15, costPerUnit: 2.5 },
    { name: 'Lettuce', unit: 'kg', currentStock: 5, minStockLevel: 2, costPerUnit: 1.2 },
    { name: 'Tomato', unit: 'kg', currentStock: 4, minStockLevel: 2, costPerUnit: 1.5 },
    { name: 'Cheese Slices', unit: 'pcs', currentStock: 60, minStockLevel: 20, costPerUnit: 0.3 },
    { name: 'Frying Oil', unit: 'liters', currentStock: 10, minStockLevel: 5, costPerUnit: 3.0 },
    { name: 'Cola Syrup', unit: 'liters', currentStock: 8, minStockLevel: 3, costPerUnit: 4.0 },
    { name: 'Potato', unit: 'kg', currentStock: 30, minStockLevel: 10, costPerUnit: 0.8 },
  ];

  for (const m of materials) {
    await prisma.material.upsert({
      where: { name: m.name },
      update: {},
      create: m,
    });
  }
  console.log('✅ Materials seeded');

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
