const fs = require("fs/promises");
const pdfParse = require("pdf-parse");

/**
 * Extract raw text from a PDF file at the given filesystem path.
 * Returns empty string on any error (non-PDF resumes, missing file, etc.)
 */
const extractResumeText = async (filePath) => {
  try {
    const buffer = await fs.readFile(filePath);
    const parsed = await pdfParse(buffer);
    return (parsed.text || "").trim();
  } catch (err) {
    console.error("[resumeExtractor] Failed to parse PDF:", err.message);
    return "";
  }
};

module.exports = { extractResumeText };
