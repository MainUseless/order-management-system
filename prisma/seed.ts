import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.user.createMany({
    data: [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        address: '123 Main St',
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password456',
        address: '456 Elm St',
      },
    ],
  });

  await prisma.product.createMany({
    data: [
      {
        name: 'Product 1',
        description: 'Description 1',
        price: 9.99,
        stock: 10,
      },
      {
        name: 'Product 2',
        description: 'Description 2',
        price: 19.99,
        stock: 5,
      },
    ],
  });

  await prisma.coupon.createMany({
    data: [
      {
        code: 'SAVE10',
        discount: 0.1,
        isActive: true,
      },
      {
        code: 'SAVE20',
        discount: 0.2,
        isActive: true,
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
