/**
 * utils/pdfExtract.js
 * Extracts plain text from a PDF file stored in the upload directory.
 *
 * Uses pdf-parse v2 which exports a PDFParse class (ESM).
 * API: new PDFParse({ data: buffer }) → instance.getText() → result.text
 *
 * Exports:
 *   extractTextFromFile(storedName) → Promise<string>
 *   extractTextFromBuffer(buffer)   → Promise<string>
 */

import { PDFParse } from 'pdf-parse'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { uploadDir } from './storage.js'

/**
 * Read a stored PDF file and return its plain text content.
 * @param {string} storedName — UUID-based filename in the upload directory
 * @returns {Promise<string>}
 */
export async function extractTextFromFile(storedName) {
  const filePath = resolve(uploadDir, storedName)
  const buffer   = await readFile(filePath)
  return extractTextFromBuffer(buffer)
}

/**
 * Parse a PDF from an in-memory Buffer and return its plain text.
 * Uses the pdf-parse v2 PDFParse class.
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
export async function extractTextFromBuffer(buffer) {
  const parser = new PDFParse({ data: buffer })
  const result = await parser.getText()
  await parser.destroy()
  return (result.text ?? '').trim()
}
