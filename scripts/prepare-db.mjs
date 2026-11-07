import fs from 'fs';
import path from 'path';

const SCHEMA_PATH = path.join(process.cwd(), 'prisma', 'schema.prisma');
const ENV_PATH = path.join(process.cwd(), '.env');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      env[key] = val;
    }
  }
  return env;
}

function determineTargetProvider() {
  const explicitArg = process.argv[2]?.toLowerCase();
  if (explicitArg === 'sqlite') return 'sqlite';
  if (['postgresql', 'postgres', 'neon'].includes(explicitArg)) return 'postgresql';

  // Check process.env first
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    const localEnv = loadEnvFile(ENV_PATH);
    dbUrl = localEnv.DATABASE_URL;
  }

  if (dbUrl && (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://'))) {
    return 'postgresql';
  }

  return 'sqlite';
}

function updateSchemaProvider(targetProvider) {
  if (!fs.existsSync(SCHEMA_PATH)) {
    console.error(`[Database Config] Error: schema.prisma not found at ${SCHEMA_PATH}`);
    process.exit(1);
  }

  let content = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  const providerRegex = /datasource\s+db\s*\{[^}]*provider\s*=\s*"([^"]+)"[^}]*\}/s;
  const match = content.match(providerRegex);

  if (!match) {
    console.error('[Database Config] Could not find datasource db block in schema.prisma');
    process.exit(1);
  }

  const currentProvider = match[1];

  if (currentProvider !== targetProvider) {
    const updatedBlock = match[0].replace(
      /provider\s*=\s*"[^"]+"/,
      `provider = "${targetProvider}"`
    );
    content = content.replace(match[0], updatedBlock);
    fs.writeFileSync(SCHEMA_PATH, content, 'utf-8');
    console.log(
      `[Database Config] Updated Prisma provider: ${currentProvider} -> ${targetProvider} (${
        targetProvider === 'postgresql' ? 'Neon / Production PostgreSQL' : 'Local SQLite'
      })`
    );
  } else {
    console.log(
      `[Database Config] Active provider is '${targetProvider}' (${
        targetProvider === 'postgresql' ? 'Neon / Production PostgreSQL' : 'Local SQLite'
      })`
    );
  }
}

const target = determineTargetProvider();
updateSchemaProvider(target);
