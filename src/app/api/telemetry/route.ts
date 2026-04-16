import {
  AzureCliCredential,
  ChainedTokenCredential,
  EnvironmentCredential,
  ManagedIdentityCredential,
} from '@azure/identity';
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import type { TelemetryRecord, TelemetryApiResponse } from '@/types/telemetry';
import { parseCSV } from '@/lib/parse-csv';

// IDENTITY_ENDPOINT is set automatically by Azure App Service when Managed Identity is enabled.
// Locally it is never present, so we skip straight to the local credential chain —
// avoiding the slow IMDS probe (169.254.169.254) that DefaultAzureCredential triggers.
const credential = process.env.IDENTITY_ENDPOINT
  ? new ManagedIdentityCredential()
  : new ChainedTokenCredential(
      new EnvironmentCredential(), // Docker + Service Principal (AZURE_CLIENT_ID/TENANT_ID/CLIENT_SECRET)
      new AzureCliCredential(),    // local npm run dev with `az login`
    );

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,7})?Z$/;

function parseDateRange(searchParams: URLSearchParams): { startDate: string; endDate: string } {
  let startDate = searchParams.get('startDate');
  let endDate   = searchParams.get('endDate');
  if (!startDate || !endDate) {
    const now = new Date();
    endDate   = now.toISOString();
    startDate = new Date(now.getTime() - 7 * 24 * 3600_000).toISOString();
  }
  return { startDate, endDate };
}

/**
 * Parse the App Insights portal timestamp format:
 * "M/D/YYYY, H:MM:SS.mmm AM/PM" → ISO 8601 UTC
 */
function parsePortalTimestamp(str: string): string {
  const m = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2}):(\d{2})\.(\d+)\s*(AM|PM)/i);
  if (!m) return str;
  const [, mo, day, year, rawH, min, sec, ms, ampm] = m;
  let h = parseInt(rawH, 10);
  if (ampm.toUpperCase() === 'PM' && h !== 12) h += 12;
  if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
  return (
    `${year}-${mo.padStart(2, '0')}-${day.padStart(2, '0')}` +
    `T${String(h).padStart(2, '0')}:${min}:${sec}.${ms.slice(0, 3).padEnd(3, '0')}Z`
  );
}

function rowToRecord(row: Record<string, string>): TelemetryRecord {
  // CSV header uses "timestamp [UTC]"; App Insights REST API uses "timestamp"
  const rawTs = row['timestamp [UTC]'] ?? row['timestamp'] ?? '';
  const timestamp = ISO_RE.test(rawTs) ? rawTs : parsePortalTimestamp(rawTs);

  let customDimensions: Record<string, string> = {};
  try {
    if (row.customDimensions) {
      customDimensions = JSON.parse(row.customDimensions) as Record<string, string>;
    }
  } catch {
    // malformed JSON — keep empty object
  }

  return {
    timestamp,
    id:                row.id               ?? '',
    target:            row.target           ?? '',
    itemType:          row.itemType         ?? '',
    customDimensions,
    operation_Name:    row.operation_Name   ?? '',
    operation_Id:      row.operation_Id     ?? '',
    operation_ParentId: row.operation_ParentId ?? '',
    duration:          parseFloat(row.duration) || 0,
  };
}

/** Load records from src/data/data.csv, filtered to [startDate, endDate]. */
function loadOfflineRecords(startDate: string, endDate: string): TelemetryRecord[] {
  const csvPath = path.join(process.cwd(), 'src', 'data', 'data.csv');

  if (!fs.existsSync(csvPath)) {
    throw new Error(`Offline mode enabled but CSV not found at ${csvPath}`);
  }

  // Strip BOM if present
  let text = fs.readFileSync(csvPath, 'utf-8');
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

  const rows  = parseCSV(text);
  const start = Date.parse(startDate);
  const end   = Date.parse(endDate);

  return rows
    .map(rowToRecord)
    .filter((r) => {
      const ts = Date.parse(r.timestamp);
      return !isNaN(ts) && ts >= start && ts <= end;
    });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const { startDate, endDate } = parseDateRange(searchParams);

  if (!ISO_RE.test(startDate) || !ISO_RE.test(endDate)) {
    return NextResponse.json({ error: 'Invalid date format. Expected ISO 8601 UTC.' }, { status: 400 });
  }

  // ── Offline mode ────────────────────────────────────────────────────────────
  if (process.env.OFFLINE === '1') {
    try {
      const records = loadOfflineRecords(startDate, endDate);
      return NextResponse.json({
        records,
        truncated: records.length >= 5000,
        totalReturned: records.length,
        dateRange: { startDate, endDate },
      } satisfies TelemetryApiResponse);
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  // ── Online mode (App Insights) ───────────────────────────────────────────────
  const appId = process.env.APPLICATIONINSIGHTS_APP_ID;
  if (!appId) {
    return NextResponse.json(
      { error: 'APPLICATIONINSIGHTS_APP_ID is not set' },
      { status: 500 },
    );
  }

  const kql = `
let operationIds = dependencies
| where name == "genai.http POST /api/chat"
| where timestamp between (datetime(${startDate}) .. datetime(${endDate}))
| project operation_Id;
union dependencies, requests, traces, exceptions
| where operation_Id in (operationIds)
| where timestamp between (datetime(${startDate}) .. datetime(${endDate}))
| order by timestamp asc
| take 5000
| project
    timestamp,
    itemType,
    customDimensions,
    operation_Name,
    operation_Id,
    operation_ParentId,
    id,
    target,
    duration
`.trim();

  let token: string;
  try {
    const result = await credential.getToken('https://api.applicationinsights.io/.default');
    token = result.token;
  } catch {
    return NextResponse.json(
      { error: 'Azure AD authentication failed. Locally: run `az login` or set AZURE_CLIENT_ID/TENANT_ID/CLIENT_SECRET in .env. On Azure: enable Managed Identity and assign Monitoring Reader role.' },
      { status: 401 },
    );
  }

  const url = `https://api.applicationinsights.io/v1/apps/${appId}/query?query=${encodeURIComponent(kql)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'No se pudo conectar con App Insights', detail: String(err) },
      { status: 503 },
    );
  }

  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json(
      { error: `App Insights query failed: ${res.status}`, detail: body },
      { status: res.status },
    );
  }

  const json = await res.json();
  const { columns, rows } = json.tables[0] as {
    columns: { name: string }[];
    rows: unknown[][];
  };

  const idx = Object.fromEntries(columns.map((c, i) => [c.name, i]));

  const records: TelemetryRecord[] = rows.map((row) => {
    let customDimensions: Record<string, string> = {};
    try {
      const raw = row[idx.customDimensions];
      if (raw && typeof raw === 'object') {
        customDimensions = raw as Record<string, string>;
      }
    } catch { /* empty */ }

    return {
      timestamp:          row[idx.timestamp] as string,
      id:                 row[idx.id] as string,
      target:             (row[idx.target] as string) ?? '',
      itemType:           row[idx.itemType] as string,
      customDimensions,
      operation_Name:     (row[idx.operation_Name] as string) ?? '',
      operation_Id:       row[idx.operation_Id] as string,
      operation_ParentId: (row[idx.operation_ParentId] as string) ?? '',
      duration:           (row[idx.duration] as number) ?? 0,
    };
  });

  return NextResponse.json({
    records,
    truncated: records.length >= 5000,
    totalReturned: records.length,
    dateRange: { startDate, endDate },
  } satisfies TelemetryApiResponse);
}
