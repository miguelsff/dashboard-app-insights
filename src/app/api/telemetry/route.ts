import { DefaultAzureCredential } from '@azure/identity';
import { NextResponse } from 'next/server';
import type { TelemetryRecord } from '@/types/telemetry';

// Module-scope credential — token is cached internally by the SDK.
const credential = new DefaultAzureCredential();

const KQL = `
dependencies
| order by timestamp desc
| take 100
| project timestamp, id, target, type, name, success, resultCode, duration,
    performanceBucket, itemType, customDimensions,
    operation_Name, operation_Id, operation_ParentId,
    client_Type, client_Model, client_OS, client_IP, client_City, client_StateOrProvince
`.trim();

export async function GET() {
  const appId = process.env.APPLICATIONINSIGHTS_APP_ID;
  if (!appId) {
    return NextResponse.json(
      { error: 'APPLICATIONINSIGHTS_APP_ID is not set' },
      { status: 500 },
    );
  }

  let token: string;
  try {
    const result = await credential.getToken('https://api.applicationinsights.io/.default');
    token = result.token;
  } catch {
    return NextResponse.json(
      { error: 'Azure AD authentication failed — run `az login` locally or enable Managed Identity on the Web App' },
      { status: 401 },
    );
  }

  const url = `https://api.applicationinsights.io/v1/apps/${appId}/query?query=${encodeURIComponent(KQL)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

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
    timestamp: row[idx.timestamp] as string,
    id: row[idx.id] as string,
    target: row[idx.target] as string,
    type: row[idx.type] as string,
    name: row[idx.name] as string,
    success: row[idx.success] as boolean,
    resultCode: String(row[idx.resultCode] ?? ''),
    duration: row[idx.duration] as number,
    performanceBucket: row[idx.performanceBucket] as string,
    itemType: row[idx.itemType] as string,
    customDimensions: (row[idx.customDimensions] ?? {}) as Record<string, string>,
    operation_Name: row[idx.operation_Name] as string,
    operation_Id: row[idx.operation_Id] as string,
    operation_ParentId: row[idx.operation_ParentId] as string,
    client_Type: row[idx.client_Type] as string,
    client_Model: row[idx.client_Model] as string,
    client_OS: row[idx.client_OS] as string,
    client_IP: row[idx.client_IP] as string,
    client_City: row[idx.client_City] as string,
    client_StateOrProvince: row[idx.client_StateOrProvince] as string,
  }));

  return NextResponse.json(records);
}
