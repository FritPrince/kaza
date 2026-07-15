/**
 * Development seed: first admin account, credit packs and taste quiz images.
 * Run: pnpm --filter @kaza/api prisma:seed
 *
 * The admin password comes from SEED_ADMIN_PASSWORD (never hardcoded).
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@kaza.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('Set SEED_ADMIN_PASSWORD before seeding (min 12 chars)');
  }
  if (adminPassword.length < 12) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 12 characters');
  }

  const admin = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      displayName: 'Super Admin',
      role: 'super_admin',
    },
  });
  console.log(`Admin ready: ${admin.email} (${admin.role})`);

  await prisma.appSetting.upsert({
    where: { key: 'credit-packs' },
    update: {},
    create: {
      key: 'credit-packs',
      value: [
        { id: 'pack-10', credits: 10, priceXof: 2000 },
        { id: 'pack-30', credits: 30, priceXof: 5000 },
        { id: 'pack-100', credits: 100, priceXof: 15000 },
      ],
    },
  });
  console.log('Credit packs ready');

  // Taste quiz images (A2): placeholder entries — replace keys with real
  // curated images via the back-office CMS (G5).
  await prisma.appSetting.upsert({
    where: { key: 'taste-quiz-images' },
    update: {},
    create: {
      key: 'taste-quiz-images',
      value: [
        { id: 'quiz-modern-1', styles: ['modern', 'minimalist'], imageKey: 'quiz/modern-1.jpg' },
        { id: 'quiz-boheme-1', styles: ['bohemian'], imageKey: 'quiz/boheme-1.jpg' },
        { id: 'quiz-afro-1', styles: ['afro-contemporary'], imageKey: 'quiz/afro-1.jpg' },
        { id: 'quiz-scandinave-1', styles: ['scandinavian', 'minimalist'], imageKey: 'quiz/scandinave-1.jpg' },
        { id: 'quiz-industriel-1', styles: ['industrial'], imageKey: 'quiz/industriel-1.jpg' },
        { id: 'quiz-classique-1', styles: ['classic'], imageKey: 'quiz/classique-1.jpg' },
      ],
    },
  });
  console.log('Taste quiz images ready');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
