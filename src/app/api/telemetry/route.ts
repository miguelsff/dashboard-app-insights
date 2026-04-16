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

/** Load records from src/data/data.csv, filtered to [startDate, endDate]. */
function loadOfflineRecords(startDate: string, endDate: string): TelemetryRecord[] {
  const csvPath = path.join(process.cwd(), 'src', 'data', 'data.csv');

  if (!fs.existsSync(csvPath)) {
    throw new Error(`Offline mode enabled but CSV not found at ${csvPath}`);
  }

  const text = fs.readFileSync(csvPath, 'utf-8');
  const rows  = parseCSV(text);

  const start = Date.parse(startDate);
  const end   = Date.parse(endDate);

  return rows
    .filter((row) => {
      const ts = Date.parse(row.timestamp);
      return !isNaN(ts) && ts >= start && ts <= end;
    })
    .map((row): TelemetryRecord => {
      let customDimensions: Record<string, string> = {};
      try {
        if (row.customDimensions) {
          customDimensions = JSON.parse(row.customDimensions) as Record<string, string>;
        }
      } catch {
        // malformed JSON in the field — keep empty object
      }

      return {
        timestamp:            row.timestamp            ?? '',
        id:                   row.id                   ?? '',
        target:               row.target               ?? '',
        type:                 row.type                 ?? '',
        name:                 row.name                 ?? '',
        success:              row.success?.toLowerCase() === 'true',
        resultCode:           row.resultCode           ?? '',
        duration:             parseFloat(row.duration) || 0,
        performanceBucket:    row.performanceBucket    ?? '',
        itemType:             row.itemType             ?? '',
        customDimensions,
        operation_Name:       row.operation_Name       ?? '',
        operation_Id:         row.operation_Id         ?? '',
        operation_ParentId:   row.operation_ParentId   ?? '',
        client_Type:          row.client_Type          ?? '',
        client_Model:         row.client_Model         ?? '',
        client_OS:            row.client_OS            ?? '',
        client_IP:            row.client_IP            ?? '',
        client_City:          row.client_City          ?? '',
        client_StateOrProvince: row.client_StateOrProvince ?? '',
      };
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
      return NextResponse.json(
        { error: String(err) },
        { status: 500 },
      );
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
dependencies
| where timestamp between (datetime(${startDate}) .. datetime(${endDate}))
| order by timestamp asc
| take 5000
| project timestamp, id, target, type, name, success, resultCode, duration,
    performanceBucket, itemType, customDimensions,
    operation_Name, operation_Id, operation_ParentId,
    client_Type, client_Model, client_OS, client_IP, client_City, client_StateOrProvince
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

  const records: TelemetryRecord[] = rows.map((row) => ({
    timestamp:            row[idx.timestamp] as string,
    id:                   row[idx.id] as string,
    target:               row[idx.target] as string,
    type:                 row[idx.type] as string,
    name:                 row[idx.name] as string,
    success:              row[idx.success] as boolean,
    resultCode:           String(row[idx.resultCode] ?? ''),
    duration:             row[idx.duration] as number,
    performanceBucket:    row[idx.performanceBucket] as string,
    itemType:             row[idx.itemType] as string,
    customDimensions:     (row[idx.customDimensions] ?? {}) as Record<string, string>,
    operation_Name:       row[idx.operation_Name] as string,
    operation_Id:         row[idx.operation_Id] as string,
    operation_ParentId:   row[idx.operation_ParentId] as string,
    client_Type:          row[idx.client_Type] as string,
    client_Model:         row[idx.client_Model] as string,
    client_OS:            row[idx.client_OS] as string,
    client_IP:            row[idx.client_IP] as string,
    client_City:          row[idx.client_City] as string,
    client_StateOrProvince: row[idx.client_StateOrProvince] as string,
  }));

  return NextResponse.json({
    records,
    truncated: records.length >= 5000,
    totalReturned: records.length,
    dateRange: { startDate, endDate },
  } satisfies TelemetryApiResponse);
}
