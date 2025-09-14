#!/usr/bin/env node
/**
 * Simple SQL runner for Neon / Postgres when psql client is unavailable.
 * Usage:
 *   node one-time-scripts/run-sql.js --file one-time-scripts/migration-consolidated-goods-receipt-cleanup.sql
 *   node one-time-scripts/run-sql.js --sql "SELECT now();"
 *
 * Requires: DATABASE_URL env var.
 */
import fs from 'fs';
import pg from 'pg';
const { Client } = pg;

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { file: null, sql: null, quiet: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--file') opts.file = args[++i];
    else if (a === '--sql') opts.sql = args[++i];
    else if (a === '--quiet') opts.quiet = true;
    else if (a === '--help') {
      console.log(`Usage:\n  --file <path.sql>   Execute SQL file\n  --sql  <statement>  Execute inline SQL\n  --quiet             Suppress result row output\n  --help              Show help`);
      process.exit(0);
    }
  }
  return opts;
}

async function main() {
  const { file, sql, quiet } = parseArgs();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL env var is required');
    process.exit(1);
  }
  if (!file && !sql) {
    console.error('ERROR: Provide --file or --sql');
    process.exit(1);
  }

  let text;
  if (file) {
    if (!fs.existsSync(file)) {
      console.error(`ERROR: File not found: ${file}`);
      process.exit(1);
    }
    text = fs.readFileSync(file, 'utf8');
  } else {
    text = sql;
  }

  // Split on un-commented semicolons while keeping DO $$ ... $$ blocks intact.
  // Simple heuristic: DO blocks may contain semicolons; we won't split inside $$ pairs.
  const statements = [];
  let buffer = '';
  let inDollar = false;
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^DO\s+\$\$/.test(trimmed)) inDollar = true;
    if (inDollar && trimmed.endsWith('$$;')) {
      buffer += line + '\n';
      statements.push(buffer.trim());
      buffer = '';
      inDollar = false;
      continue;
    }
    if (!inDollar && trimmed.endsWith(';')) {
      buffer += line + '\n';
      statements.push(buffer.trim());
      buffer = '';
    } else {
      buffer += line + '\n';
    }
  }
  if (buffer.trim()) statements.push(buffer.trim());

  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

  const started = Date.now();
  await client.connect();
  console.log(`Connected. Executing ${statements.length} statement(s)...`);

  let ok = 0;
  for (const stmt of statements) {
    const label = stmt.split(/\n/)[0].slice(0, 80);
    try {
      const res = await client.query(stmt);
      ok++;
      if (!quiet && res.rows && res.rows.length) {
        console.log(`-- Result (${res.rows.length} rows)`);
        console.log(JSON.stringify(res.rows.slice(0, 5), null, 2));
        if (res.rows.length > 5) console.log(`-- (${res.rows.length - 5}) more rows not shown`);
      }
      console.log(`✔ Success: ${label}`);
    } catch (err) {
      console.error(`✖ Error in statement starting: ${label}`);
      console.error(err.message);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log(`Done. ${ok}/${statements.length} succeeded in ${(Date.now() - started)} ms.`);
}

main().catch(e => { console.error(e); process.exit(1); });
