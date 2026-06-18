import { extractTextFromPDF } from "@/utils/pdfUtils";

/**
 * Extracts the XML text content from a named file inside a ZIP-based
 * Office Open XML package (.docx / .pptx).
 */
async function getXMLFromZip(
  file: File,
  xmlPath: string
): Promise<string | null> {
  try {
    // Dynamically import to keep bundle lazy-loaded
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const entry = zip.file(xmlPath);
    if (!entry) return null;
    return await entry.async("string");
  } catch {
    return null;
  }
}

/**
 * Extract readable text from all slide XMLs in a .pptx file.
 * Slide files live at ppt/slides/slide1.xml, slide2.xml, …
 */
async function extractTextFromPPTX(file: File): Promise<string> {
  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const parser = new DOMParser();

    const slideFiles = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => {
        // Sort slides numerically: slide1.xml < slide2.xml …
        const numA = parseInt(a.match(/\d+/)?.[0] ?? "0", 10);
        const numB = parseInt(b.match(/\d+/)?.[0] ?? "0", 10);
        return numA - numB;
      });

    const texts: string[] = [];
    const MAX_SLIDES = 60;

    for (const slideName of slideFiles.slice(0, MAX_SLIDES)) {
      const xml = await zip.file(slideName)!.async("string");
      const doc = parser.parseFromString(xml, "application/xml");
      // Paragraph nodes: <a:p> within the DrawingML namespace
      const paragraphs = Array.from(doc.getElementsByTagNameNS("*", "p"));
      for (const para of paragraphs) {
        // Text run nodes: <a:t>
        const runs = Array.from(para.getElementsByTagNameNS("*", "t"));
        const line = runs
          .map((t) => t.textContent ?? "")
          .join("")
          .trim();
        if (line) texts.push(line);
      }
      texts.push(""); // blank line between slides
    }

    const result = texts.join("\n").trim();
    if (!result) throw new Error("No text found in presentation");
    return result;
  } catch (err) {
    console.error("PPTX extraction error:", err);
    throw new Error("Could not read the PowerPoint file.");
  }
}

/**
 * Extract readable text from a .docx file.
 * Body paragraphs live in word/document.xml as <w:p> / <w:t> nodes.
 */
async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    const xml = await getXMLFromZip(file, "word/document.xml");
    if (!xml) throw new Error("No document.xml found");

    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "application/xml");

    // Each <w:p> is a paragraph; <w:t> nodes inside it hold the text
    const paragraphs = Array.from(doc.getElementsByTagNameNS("*", "p"));
    const lines: string[] = [];

    for (const para of paragraphs) {
      const runs = Array.from(para.getElementsByTagNameNS("*", "t"));
      const line = runs
        .map((t) => t.textContent ?? "")
        .join("")
        .trim();
      if (line) lines.push(line);
    }

    const result = lines.join("\n").trim();
    if (!result) throw new Error("No text found in document");
    return result;
  } catch (err) {
    console.error("DOCX extraction error:", err);
    throw new Error("Could not read the Word document.");
  }
}

/**
 * Legacy binary Office format fallback (.doc / .ppt).
 * These are OLE Compound Document files. We cannot fully parse them
 * in the browser, but we can extract sequences of printable ASCII/Latin-1
 * characters (similar to the Unix `strings` command) which gives the AI
 * enough context to work with typical lecture slides and text-heavy documents.
 */
async function extractStringsFromBinaryOffice(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const MIN_RUN = 5; // minimum printable char sequence length to include
    const sequences: string[] = [];
    let current = "";

    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      // Printable ASCII (32-126) or common Latin-1 superset chars
      if ((b >= 32 && b <= 126) || b === 9 || b === 10 || b === 13) {
        current += String.fromCharCode(b);
      } else {
        if (current.length >= MIN_RUN) {
          const trimmed = current.trim();
          // Skip sequences that are purely non-word chars or very short after trim
          if (trimmed.length >= MIN_RUN && /[a-zA-Z]{3,}/.test(trimmed)) {
            sequences.push(trimmed);
          }
        }
        current = "";
      }
    }
    // Flush final run
    if (current.length >= MIN_RUN) {
      const trimmed = current.trim();
      if (trimmed.length >= MIN_RUN && /[a-zA-Z]{3,}/.test(trimmed)) {
        sequences.push(trimmed);
      }
    }

    const result = sequences.join("\n").slice(0, 50000); // cap at 50K chars
    if (!result) throw new Error("No readable text found");
    return `[Note: Legacy binary file format — text extraction may be partial]\n\n${result}`;
  } catch (err) {
    console.error("Binary Office extraction error:", err);
    throw new Error(
      "Could not extract text from this legacy Office file. Please save it as .docx or .pptx and try again."
    );
  }
}

/**
 * Unified text extractor. Handles PDF, Word, PowerPoint, and plain-text files.
 * Returns the extracted string content.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const type = file.type;

  // ── PDF ────────────────────────────────────────────────────────────────────
  if (type === "application/pdf" || name.endsWith(".pdf")) {
    return extractTextFromPDF(file);
  }

  // ── Modern Word (.docx) ────────────────────────────────────────────────────
  if (
    type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    return extractTextFromDOCX(file);
  }

  // ── Modern PowerPoint (.pptx) ──────────────────────────────────────────────
  if (
    type ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    name.endsWith(".pptx")
  ) {
    return extractTextFromPPTX(file);
  }

  // ── Legacy Word (.doc) ─────────────────────────────────────────────────────
  if (type === "application/msword" || name.endsWith(".doc")) {
    return extractStringsFromBinaryOffice(file);
  }

  // ── Legacy PowerPoint (.ppt) ───────────────────────────────────────────────
  if (
    type === "application/vnd.ms-powerpoint" ||
    name.endsWith(".ppt")
  ) {
    return extractStringsFromBinaryOffice(file);
  }

  // ── Plain text / Markdown ─────────────────────────────────────────────────
  if (
    type.startsWith("text/") ||
    name.endsWith(".txt") ||
    name.endsWith(".md")
  ) {
    return file.text();
  }

  // ── Unknown: attempt generic text read ────────────────────────────────────
  try {
    return await file.text();
  } catch {
    throw new Error(`Unsupported file type: ${file.name}`);
  }
}

/**
 * Returns true if the given file name or MIME type is a supported document
 * format (used for validation in upload zones).
 */
export function isSupportedDocumentType(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type;

  const supportedTypes = [
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/msword",
    "application/vnd.ms-powerpoint",
  ];

  const supportedExtensions = [
    ".pdf",
    ".txt",
    ".md",
    ".doc",
    ".docx",
    ".ppt",
    ".pptx",
  ];

  return (
    supportedTypes.includes(type) ||
    supportedExtensions.some((ext) => name.endsWith(ext))
  );
}
