import { useState } from "react";
import { readSheet } from "read-excel-file/browser";
import { adminFetch } from "./adminApi";
import { parseHistoricalSalesSheet } from "./historicalSalesImport.mjs";

const cardStyle = {
  background: "#0f2419",
  border: "1px solid #1f4a34",
  borderRadius: "12px",
  padding: "18px",
  color: "#f7f8ff",
};

const actionStyle = {
  padding: "10px 14px",
  border: 0,
  borderRadius: "6px",
  background: "#0f9d58",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const hashFile = async (file) => {
  if (!globalThis.crypto?.subtle) {
    throw new Error("This browser cannot securely fingerprint the workbook");
  }
  const digest = await globalThis.crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export default function HistoricalSalesImporter({ apiUrl, onImported }) {
  const [preview, setPreview] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isReading, setIsReading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [possibleDuplicateRows, setPossibleDuplicateRows] = useState([]);
  const [allowPossibleDuplicates, setAllowPossibleDuplicates] = useState(false);

  const readWorkbook = async (event) => {
    const file = event.target.files?.[0];
    setPreview(null);
    setErrorMessage("");
    setStatusMessage("");
    setConfirmed(false);
    setPossibleDuplicateRows([]);
    setAllowPossibleDuplicates(false);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setErrorMessage("Choose the original .xlsx workbook.");
      return;
    }

    setIsReading(true);
    try {
      const rows = await readSheet(file);
      const parsed = parseHistoricalSalesSheet(rows);
      const batchHash = await hashFile(file);
      setPreview({ ...parsed, batchHash });
    } catch (error) {
      setErrorMessage(error.message || "The workbook could not be read.");
    } finally {
      setIsReading(false);
    }
  };

  const importSales = async () => {
    if (!preview || !confirmed) return;
    setIsImporting(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await adminFetch(`${apiUrl}/api/orders/admin/historical-sales/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchHash: preview.batchHash,
          sales: preview.sales,
          includePossibleDuplicates: allowPossibleDuplicates,
        }),
      });
      const result = await response.json();

      if (response.status === 409 && result.code === "POSSIBLE_DUPLICATES") {
        setPossibleDuplicateRows(result.rows || []);
        setStatusMessage(result.message);
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Historical sales could not be imported.");
      }

      setStatusMessage(
        `${result.message} ${result.alreadyImportedCount ? `${result.alreadyImportedCount} were already present.` : ""}`
      );
      await onImported?.();
    } catch (error) {
      setErrorMessage(error.message || "Historical sales could not be imported.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <section style={cardStyle}>
      <h3>Import October Sales &amp; Create Invoices</h3>
      <p>
        Upload the original October 2026 workbook. Dated rows will be added to
        order history as paid cash sales; existing inventory will not be changed.
      </p>
      <p>
        The import uses the named <b>ADDRESH</b> column. The unlabeled column is
        ignored. Missing phone, PIN, and email details are left blank, not invented.
      </p>
      <label style={{ display: "block", margin: "12px 0" }}>
        Sales workbook (.xlsx)
        <input
          type="file"
          accept=".xlsx"
          onChange={readWorkbook}
          disabled={isReading || isImporting}
          style={{ display: "block", marginTop: "6px" }}
        />
      </label>

      {isReading && <p role="status">Reading workbook…</p>}
      {preview && (
        <div>
          <p>
            <b>{preview.summary.rows} dated sales</b> |{" "}
            {preview.summary.oneKgPacks} × 1 kg |{" "}
            {preview.summary.halfKgPacks} × 500 g |{" "}
            <b>{preview.summary.quantityKg.toLocaleString("en-IN")} kg</b> |{" "}
            <b>₹{(preview.summary.totalAmountPaise / 100).toLocaleString("en-IN")}</b>
          </p>
          {preview.missingDateRows.length > 0 && (
            <p>
              Rows {preview.missingDateRows.join(", ")} are excluded because their
              invoice date is blank.
            </p>
          )}
          <label style={{ display: "block", margin: "12px 0" }}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />{" "}
            I confirm these are real October sales paid in cash, and I want each
            dated row saved as a separate order with a downloadable invoice.
          </label>
        </div>
      )}

      {possibleDuplicateRows.length > 0 && (
        <label style={{ display: "block", margin: "12px 0" }}>
          Possible matches were found for Excel rows {possibleDuplicateRows.join(", ")}.
          Confirm these are separate sales before including them.
          <input
            type="checkbox"
            checked={allowPossibleDuplicates}
            onChange={(event) => setAllowPossibleDuplicates(event.target.checked)}
          />
        </label>
      )}

      {errorMessage && <p role="alert">{errorMessage}</p>}
      {statusMessage && <p role="status">{statusMessage}</p>}
      {preview && (
        <button
          type="button"
          style={actionStyle}
          disabled={
            !confirmed ||
            isImporting ||
            (possibleDuplicateRows.length > 0 && !allowPossibleDuplicates)
          }
          onClick={importSales}
        >
          {isImporting ? "Importing…" : `Import ${preview.summary.rows} sales and create invoices`}
        </button>
      )}
    </section>
  );
}
