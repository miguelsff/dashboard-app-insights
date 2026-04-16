/**
 * Minimal RFC-4180 CSV parser.
 *
 * Handles:
 *  - Quoted fields (including fields whose content contains commas or newlines)
 *  - "" as escaped " inside a quoted field
 *
 * Returns an array of objects keyed by the header row.
 */
export function parseCSV(text: string): Record<string, string>[] {
  const rows = splitRows(text);
  if (rows.length === 0) return [];

  const headers = parseRow(rows[0]);
  const result: Record<string, string>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].trim();
    if (!row) continue;
    const fields = parseRow(row);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h.trim()] = fields[idx] ?? '';
    });
    result.push(obj);
  }

  return result;
}

/** Split CSV text into raw lines, keeping quoted newlines together. */
function splitRows(text: string): string[] {
  const rows: string[] = [];
  let current = '';
  let inQuote = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      current += ch;
      if (inQuote && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if ((ch === '\n' || ch === '\r') && !inQuote) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      rows.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current) rows.push(current);
  return rows;
}

/** Parse a single CSV row into an array of field strings. */
function parseRow(line: string): string[] {
  const fields: string[] = [];
  let i = 0;

  while (i <= line.length) {
    if (i === line.length) {
      // Trailing comma: push empty field
      fields.push('');
      break;
    }

    if (line[i] === '"') {
      // Quoted field
      let field = '';
      i++; // skip opening quote
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            field += '"';
            i += 2;
          } else {
            i++; // skip closing quote
            break;
          }
        } else {
          field += line[i++];
        }
      }
      fields.push(field);
      if (line[i] === ',') i++;
    } else {
      // Unquoted field — read until next comma or end
      const end = line.indexOf(',', i);
      if (end === -1) {
        fields.push(line.slice(i));
        break;
      } else {
        fields.push(line.slice(i, end));
        i = end + 1;
      }
    }
  }

  return fields;
}
