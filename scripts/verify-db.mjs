import { PrismaClient } from '@prisma/client';
import fs from 'fs';

// Load .env
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...v] = trimmed.split('=');
      process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
}

const prisma = new PrismaClient();

async function main() {
  const [eventsCount, draftsCount, settingsCount, gradesCount] = await Promise.all([
    prisma.event.count(),
    prisma.draft.count(),
    prisma.settings.count(),
    prisma.validationGrade.count(),
  ]);

  console.log('--- PostgreSQL Status (localhost:5435/postpulse) ---');
  console.log('Events in DB:', eventsCount);
  console.log('Drafts in DB:', draftsCount);
  console.log('Settings in DB:', settingsCount);
  console.log('Validation Grades in DB:', gradesCount);

  const topEvent = await prisma.event.findFirst({
    orderBy: { worthinessScore: 'desc' },
  });
  if (topEvent) {
    console.log('\nTop Ranked Event in DB:');
    console.log(`- [Score ${topEvent.worthinessScore}] [${topEvent.category}] ${topEvent.title}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
