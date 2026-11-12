export function parseProductCsv(source: string): unknown[] { const rows: string[][] = [], row: string[] = []; let value = '', quoted = false; const text = source.replace(/^\ufeff/, ''); for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
        if (quoted && text[i + 1] === '"') {
            value += '"';
            i++;
        }
        else
            quoted = !quoted;
    }
    else if (c === ',' && !quoted) {
        row.push(value);
        value = '';
    }
    else if ((c === '\n' || c === '\r') && !quoted) {
        if (c === '\r' && text[i + 1] === '\n')
            i++;
        row.push(value);
        if (row.some(v => v.trim()))
            rows.push([...row]);
        row.length = 0;
        value = '';
    }
    else
        value += c;
} if (quoted)
    throw Error('Hay comillas sin cerrar'); row.push(value); if (row.some(v => v.trim()))
    rows.push(row); const headers = rows.shift()?.map(h => h.trim()); if (!headers || !['title', 'family', 'sku', 'price', 'stock'].every(h => headers.includes(h)))
    throw Error('Usa la plantilla con title, family, sku, price y stock'); if (rows.length > 200)
    throw Error('El archivo admite hasta 200 productos'); return rows.map(row => { const record: Record<string, unknown> = {}; headers.forEach((key, i) => { if (row[i] !== undefined && row[i].trim() !== '')
    record[key] = ['price', 'stock'].includes(key) ? Number(row[i]) : row[i].trim(); }); return record; }); }
