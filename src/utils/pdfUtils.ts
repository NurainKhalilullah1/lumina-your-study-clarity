import * as pdfjsLib from 'pdfjs-dist';

// Point to the worker file from a CDN (Critical for Vite builds)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    // Limit pages to prevent token overflow (Adjust as needed)
    const maxPages = Math.min(pdf.numPages, 20); 

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `[Page ${i}]: ${pageText}\n`;
    }

    return fullText;
  } catch (error) {
    console.error("PDF Extraction Error:", error);
    throw new Error("Could not read the PDF file.");
  }
};
