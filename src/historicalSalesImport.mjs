const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const cellText = (value) => String(value ?? "").trim();

const dateToIso = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return dateToIso(new Date(EXCEL_EPOCH_UTC + Math.round(value) * MS_PER_DAY));
  }

  const match = cellText(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return "";
  }

  return `${year}-${month}-${day}`;
};

const normalizeWeight = (value) =>
  cellText(value).replace(/\s+/g, "").toUpperCase();

const readPricePaise = (value) => {
  const price = typeof value === "number" ? value : Number(cellText(value).replace(/[₹,\s]/g, ""));
  if (!Number.isFinite(price) || price <= 0 || Math.round(price * 100) !== price * 100) {
    return null;
  }
  return Math.round(price * 100);
};

export const parseHistoricalSalesSheet = (rows) => {
  if (!Array.isArray(rows) || rows.length < 2) {
    throw new Error("The workbook has no sales rows");
  }

  const headers = rows[0].map((value) => cellText(value).toUpperCase());
  const requiredHeaders = [
    "NAME",
    "ADDRESH",
    "CITY",
    "STATE",
    "PIN",
    "MOBILE NO",
    "QNTY",
    "PRICE",
    "INVOICE DATE",
  ];
  const columnIndexes = Object.fromEntries(
    requiredHeaders.map((header) => [header, headers.indexOf(header)])
  );
  const missingHeaders = requiredHeaders.filter((header) => columnIndexes[header] < 0);
  if (missingHeaders.length) {
    throw new Error(`The workbook is missing required columns: ${missingHeaders.join(", ")}`);
  }

  const sales = [];
  const missingDateRows = [];
  const errors = [];

  rows.slice(1).forEach((row, index) => {
    if (!Array.isArray(row) || row.every((value) => value === null || cellText(value) === "")) {
      return;
    }

    const rowNumber = index + 2;
    const get = (header) => row[columnIndexes[header]];
    const invoiceDate = dateToIso(get("INVOICE DATE"));
    if (!invoiceDate) {
      missingDateRows.push(rowNumber);
      return;
    }

    const weight = normalizeWeight(get("QNTY"));
    const pricePaise = readPricePaise(get("PRICE"));
    const customerName = cellText(get("NAME"));
    const address = cellText(get("ADDRESH"));
    const city = cellText(get("CITY"));
    const state = cellText(get("STATE"));

    if (!customerName) errors.push(`row ${rowNumber}: NAME is missing`);
    if (!address) errors.push(`row ${rowNumber}: ADDRESH is missing`);
    if (!city) errors.push(`row ${rowNumber}: CITY is missing`);
    if (!state) errors.push(`row ${rowNumber}: STATE is missing`);
    if (!["1KG", "500G"].includes(weight)) {
      errors.push(`row ${rowNumber}: unsupported QNTY value`);
    }
    if (pricePaise === null) errors.push(`row ${rowNumber}: PRICE is invalid`);

    sales.push({
      rowNumber,
      customerName,
      address,
      city,
      state,
      pincode: cellText(get("PIN")),
      mobile: cellText(get("MOBILE NO")),
      weight,
      pricePaise,
      invoiceDate,
    });
  });

  if (errors.length) {
    throw new Error(`Please fix the workbook before importing: ${errors.join("; ")}`);
  }
  if (!sales.length) {
    throw new Error("No dated sales were found to import");
  }

  const quantityKg = sales.reduce(
    (total, sale) => total + (sale.weight === "1KG" ? 1 : 0.5),
    0
  );
  const totalAmountPaise = sales.reduce((total, sale) => total + sale.pricePaise, 0);

  return {
    sales,
    missingDateRows,
    summary: {
      rows: sales.length,
      quantityKg,
      totalAmountPaise,
      oneKgPacks: sales.filter((sale) => sale.weight === "1KG").length,
      halfKgPacks: sales.filter((sale) => sale.weight === "500G").length,
    },
  };
};
