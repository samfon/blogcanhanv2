/**
 * Advanced DOCX Processor - Bước 3 & 4 của Roadmap
 * Handles Word document structure parsing and style conversion
 */

interface WordStyle {
  type: "heading" | "paragraph" | "list" | "table" | "code" | "quote";
  level?: number;
  alignment?: "left" | "center" | "right" | "justify";
  indentation?: number;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  listType?: "bullet" | "numbered";
}

interface ProcessedContent {
  html: string;
  stats: {
    paragraphs: number;
    headings: number;
    lists: number;
    tables: number;
    images: number;
    words: number;
  };
}

export class DocxProcessor {
  private static readonly STYLE_MAPPINGS = {
    // Heading styles
    Heading1: { type: "heading", level: 1 },
    Heading2: { type: "heading", level: 2 },
    Heading3: { type: "heading", level: 3 },
    Heading4: { type: "heading", level: 4 },
    Heading5: { type: "heading", level: 5 },
    Heading6: { type: "heading", level: 6 },
    Title: { type: "heading", level: 1 },
    Subtitle: { type: "heading", level: 2 },

    // List styles
    ListParagraph: { type: "list" },
    ListBullet: { type: "list", listType: "bullet" },
    ListNumber: { type: "list", listType: "numbered" },

    // Code styles
    Code: { type: "code" },
    HTMLCode: { type: "code" },
    Preformatted: { type: "code" },

    // Quote styles
    Quote: { type: "quote" },
    IntenseQuote: { type: "quote" },
    BlockQuote: { type: "quote" },

    // Table styles
    TableText: { type: "table" },
    TableHeader: { type: "table" },
  } as const;

  /**
   * Process DOCX file and convert to clean HTML
   */
  static async processDocx(file: File): Promise<ProcessedContent> {
    try {
      const { ZipReader, BlobReader, TextWriter } = await import(
        "@zip.js/zip.js"
      );

      const zipReader = new ZipReader(new BlobReader(file));
      const entries = await zipReader.getEntries();

      // Extract main document
      const documentEntry = entries.find(
        (entry) => entry.filename === "word/document.xml",
      );
      if (!documentEntry || !documentEntry.getData) {
        throw new Error("Invalid DOCX structure: missing document.xml");
      }

      const documentXml = await documentEntry.getData(new TextWriter());

      // Extract styles
      const stylesEntry = entries.find(
        (entry) => entry.filename === "word/styles.xml",
      );
      const stylesXml = stylesEntry
        ? await stylesEntry.getData(new TextWriter())
        : "";

      // Extract relationships for links
      const relsEntry = entries.find(
        (entry) => entry.filename === "word/_rels/document.xml.rels",
      );
      const relsXml = relsEntry
        ? await relsEntry.getData(new TextWriter())
        : "";

      await zipReader.close();

      // Parse XML documents
      const parser = new DOMParser();
      const doc = parser.parseFromString(documentXml, "text/xml");
      const stylesDoc = stylesXml
        ? parser.parseFromString(stylesXml, "text/xml")
        : null;
      const relsDoc = relsXml
        ? parser.parseFromString(relsXml, "text/xml")
        : null;

      // Build relationships map for hyperlinks
      const relationships = this.buildRelationshipsMap(relsDoc);

      // Process document content
      const result = this.processDocumentContent(doc, stylesDoc, relationships);

      return result;
    } catch (error) {
      console.error("DOCX processing error:", error);
      throw new Error(
        `Không thể xử lý file DOCX: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Build relationships map for hyperlinks
   */
  private static buildRelationshipsMap(
    relsDoc: Document | null,
  ): Map<string, string> {
    const relationships = new Map<string, string>();

    if (relsDoc) {
      const relElements = relsDoc.getElementsByTagName("Relationship");
      for (let i = 0; i < relElements.length; i++) {
        const rel = relElements[i];
        const id = rel.getAttribute("Id");
        const target = rel.getAttribute("Target");
        const type = rel.getAttribute("Type");

        if (id && target && type?.includes("hyperlink")) {
          relationships.set(id, target);
        }
      }
    }

    return relationships;
  }

  /**
   * Process main document content
   */
  private static processDocumentContent(
    doc: Document,
    stylesDoc: Document | null,
    relationships: Map<string, string>,
  ): ProcessedContent {
    let html = "";
    const stats = {
      paragraphs: 0,
      headings: 0,
      lists: 0,
      tables: 0,
      images: 0,
      words: 0,
    };

    const body = doc.getElementsByTagName("w:body")[0];
    if (!body) {
      throw new Error("Document body not found");
    }

    const elements = body.children;
    let currentListType: "ul" | "ol" | null = null;

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];

      if (element.tagName === "w:p") {
        const result = this.processParagraph(element, stylesDoc, relationships);

        if (result.isListItem) {
          if (!currentListType || currentListType !== result.listType) {
            if (currentListType) {
              html += `</${currentListType}>\n`;
            }
            currentListType = result.listType!;
            html += `<${currentListType}>\n`;
          }
          html += result.html;
          stats.lists++;
        } else {
          if (currentListType) {
            html += `</${currentListType}>\n`;
            currentListType = null;
          }
          html += result.html;

          if (result.isHeading) {
            stats.headings++;
          } else {
            stats.paragraphs++;
          }
        }

        stats.words += result.wordCount;
      } else if (element.tagName === "w:tbl") {
        if (currentListType) {
          html += `</${currentListType}>\n`;
          currentListType = null;
        }
        html += this.processTable(element);
        stats.tables++;
      }
    }

    // Close any open list
    if (currentListType) {
      html += `</${currentListType}>\n`;
    }

    return {
      html: this.cleanupHtml(html),
      stats,
    };
  }

  /**
   * Process individual paragraph
   */
  private static processParagraph(
    paragraph: Element,
    stylesDoc: Document | null,
    relationships: Map<string, string>,
  ): {
    html: string;
    isHeading: boolean;
    isListItem: boolean;
    listType?: "ul" | "ol";
    wordCount: number;
  } {
    const style = this.getParagraphStyle(paragraph, stylesDoc);
    let content = "";
    let wordCount = 0;

    // Process runs (text with formatting)
    const runs = paragraph.getElementsByTagName("w:r");
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      const runResult = this.processRun(run, relationships);
      content += runResult.html;
      wordCount += runResult.wordCount;
    }

    // Handle hyperlinks
    const hyperlinks = paragraph.getElementsByTagName("w:hyperlink");
    for (let i = 0; i < hyperlinks.length; i++) {
      const link = hyperlinks[i];
      const linkResult = this.processHyperlink(link, relationships);
      content += linkResult.html;
      wordCount += linkResult.wordCount;
    }

    if (!content.trim()) {
      return { html: "", isHeading: false, isListItem: false, wordCount: 0 };
    }

    // Apply paragraph formatting
    return this.formatParagraph(content, style, wordCount);
  }

  /**
   * Get paragraph style information
   */
  private static getParagraphStyle(
    paragraph: Element,
    stylesDoc: Document | null,
  ): WordStyle {
    const pPr = paragraph.getElementsByTagName("w:pPr")[0];
    let style: WordStyle = { type: "paragraph" };

    if (pPr) {
      // Style reference
      const pStyle = pPr.getElementsByTagName("w:pStyle")[0];
      if (pStyle) {
        const styleVal = pStyle.getAttribute("w:val");
        if (
          styleVal &&
          this.STYLE_MAPPINGS[styleVal as keyof typeof this.STYLE_MAPPINGS]
        ) {
          style = {
            ...this.STYLE_MAPPINGS[
              styleVal as keyof typeof this.STYLE_MAPPINGS
            ],
          };
        }
      }

      // Numbering (lists)
      const numPr = pPr.getElementsByTagName("w:numPr")[0];
      if (numPr) {
        style.type = "list";
        const numId = numPr
          .getElementsByTagName("w:numId")[0]
          ?.getAttribute("w:val");
        // Simplified list type detection
        style.listType = numId === "1" ? "numbered" : "bullet";
      }

      // Indentation
      const ind = pPr.getElementsByTagName("w:ind")[0];
      if (ind) {
        const leftIndent = parseInt(ind.getAttribute("w:left") || "0");
        style.indentation = Math.floor(leftIndent / 720); // Convert twips to indent levels
      }

      // Alignment
      const jc = pPr.getElementsByTagName("w:jc")[0];
      if (jc) {
        const alignVal = jc.getAttribute("w:val");
        if (alignVal) {
          style.alignment = alignVal as "left" | "center" | "right" | "justify";
        }
      }
    }

    return style;
  }

  /**
   * Process text run with formatting
   */
  private static processRun(
    run: Element,
    relationships: Map<string, string>,
  ): {
    html: string;
    wordCount: number;
  } {
    let html = "";
    let isBold = false;
    let isItalic = false;
    let isUnderline = false;

    // Check run properties - only if they exist and are explicitly set
    const rPr = run.getElementsByTagName("w:rPr")[0];
    if (rPr) {
      // Check for bold - only if <w:b> exists AND doesn't have w:val="0"
      const boldElement = rPr.getElementsByTagName("w:b")[0];
      if (boldElement) {
        const boldVal = boldElement.getAttribute("w:val");
        isBold = boldVal !== "0" && boldVal !== "false";
      }

      // Check for italic - only if <w:i> exists AND doesn't have w:val="0"
      const italicElement = rPr.getElementsByTagName("w:i")[0];
      if (italicElement) {
        const italicVal = italicElement.getAttribute("w:val");
        isItalic = italicVal !== "0" && italicVal !== "false";
      }

      // Check for underline
      const underlineElement = rPr.getElementsByTagName("w:u")[0];
      if (underlineElement) {
        const underlineVal = underlineElement.getAttribute("w:val");
        isUnderline =
          underlineVal !== "none" &&
          underlineVal !== "0" &&
          underlineVal !== "false";
      }
    }

    // Get text content
    const texts = run.getElementsByTagName("w:t");
    for (let i = 0; i < texts.length; i++) {
      let text = texts[i].textContent || "";

      // Apply formatting
      if (isBold && isItalic) {
        text = `<strong><em>${text}</em></strong>`;
      } else if (isBold) {
        text = `<strong>${text}</strong>`;
      } else if (isItalic) {
        text = `<em>${text}</em>`;
      }

      if (isUnderline) {
        text = `<u>${text}</u>`;
      }

      html += text;
    }

    const wordCount = html
      .replace(/<[^>]*>/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 0).length;

    return { html, wordCount };
  }

  /**
   * Process hyperlink
   */
  private static processHyperlink(
    hyperlink: Element,
    relationships: Map<string, string>,
  ): {
    html: string;
    wordCount: number;
  } {
    const rId = hyperlink.getAttribute("r:id");
    const anchor = hyperlink.getAttribute("w:anchor");

    let href = "";
    if (rId && relationships.has(rId)) {
      href = relationships.get(rId)!;
    } else if (anchor) {
      href = `#${anchor}`;
    }

    let text = "";
    const runs = hyperlink.getElementsByTagName("w:r");
    for (let i = 0; i < runs.length; i++) {
      const texts = runs[i].getElementsByTagName("w:t");
      for (let j = 0; j < texts.length; j++) {
        text += texts[j].textContent || "";
      }
    }

    if (!text.trim()) {
      text = href;
    }

    const html = href ? `<a href="${href}">${text}</a>` : text;
    const wordCount = text
      .split(/\s+/)
      .filter((word) => word.length > 0).length;

    return { html, wordCount };
  }

  /**
   * Format paragraph based on style
   */
  private static formatParagraph(
    content: string,
    style: WordStyle,
    wordCount: number,
  ): {
    html: string;
    isHeading: boolean;
    isListItem: boolean;
    listType?: "ul" | "ol";
    wordCount: number;
  } {
    let html = "";
    const indent = "  ".repeat(style.indentation || 0);

    switch (style.type) {
      case "heading":
        const level = Math.min(style.level || 1, 6);
        html = `${indent}<h${level}>${content}</h${level}>\n`;
        return { html, isHeading: true, isListItem: false, wordCount };

      case "list":
        const listType = style.listType === "numbered" ? "ol" : "ul";
        html = `${indent}<li>${content}</li>\n`;
        return {
          html,
          isHeading: false,
          isListItem: true,
          listType,
          wordCount,
        };

      case "code":
        html = `${indent}<pre><code>${content}</code></pre>\n`;
        return { html, isHeading: false, isListItem: false, wordCount };

      case "quote":
        html = `${indent}<blockquote>${content}</blockquote>\n`;
        return { html, isHeading: false, isListItem: false, wordCount };

      default:
        const alignClass =
          style.alignment && style.alignment !== "left"
            ? ` style="text-align: ${style.alignment}"`
            : "";
        html = `${indent}<p${alignClass}>${content}</p>\n`;
        return { html, isHeading: false, isListItem: false, wordCount };
    }
  }

  /**
   * Process table
   */
  private static processTable(table: Element): string {
    let html = "<table>\n";

    const rows = table.getElementsByTagName("w:tr");
    for (let i = 0; i < rows.length; i++) {
      html += "  <tr>\n";

      const cells = rows[i].getElementsByTagName("w:tc");
      for (let j = 0; j < cells.length; j++) {
        const cellContent = this.processTableCell(cells[j]);
        const isHeader = i === 0; // First row as header
        const tag = isHeader ? "th" : "td";
        html += `    <${tag}>${cellContent}</${tag}>\n`;
      }

      html += "  </tr>\n";
    }

    html += "</table>\n";
    return html;
  }

  /**
   * Process table cell content
   */
  private static processTableCell(cell: Element): string {
    let content = "";

    const paragraphs = cell.getElementsByTagName("w:p");
    for (let i = 0; i < paragraphs.length; i++) {
      const runs = paragraphs[i].getElementsByTagName("w:r");
      for (let j = 0; j < runs.length; j++) {
        // Process run with formatting like in processRun method
        let runText = "";
        let isBold = false;
        let isItalic = false;

        // Check run properties - only if they exist and are explicitly set
        const rPr = runs[j].getElementsByTagName("w:rPr")[0];
        if (rPr) {
          // Check for bold - only if <w:b> exists AND doesn't have w:val="0"
          const boldElement = rPr.getElementsByTagName("w:b")[0];
          if (boldElement) {
            const boldVal = boldElement.getAttribute("w:val");
            isBold = boldVal !== "0" && boldVal !== "false";
          }

          // Check for italic - only if <w:i> exists AND doesn't have w:val="0"
          const italicElement = rPr.getElementsByTagName("w:i")[0];
          if (italicElement) {
            const italicVal = italicElement.getAttribute("w:val");
            isItalic = italicVal !== "0" && italicVal !== "false";
          }
        }

        // Get text content
        const texts = runs[j].getElementsByTagName("w:t");
        for (let k = 0; k < texts.length; k++) {
          runText += texts[k].textContent || "";
        }

        // Apply formatting only if explicitly set and enabled
        if (isBold && isItalic) {
          runText = `<strong><em>${runText}</em></strong>`;
        } else if (isBold) {
          runText = `<strong>${runText}</strong>`;
        } else if (isItalic) {
          runText = `<em>${runText}</em>`;
        }

        content += runText;
      }
      if (i < paragraphs.length - 1) {
        content += "<br>";
      }
    }

    return content;
  }

  /**
   * Clean up HTML output
   */
  private static cleanupHtml(html: string): string {
    return (
      html
        // Remove excessive line breaks
        .replace(/\n{3,}/g, "\n\n")
        // Remove empty paragraphs
        .replace(/<p\s*[^>]*>\s*<\/p>/g, "")
        // Remove empty headings
        .replace(/<h[1-6]\s*[^>]*>\s*<\/h[1-6]>/g, "")
        // Fix spacing around block elements
        .replace(/>\s+</g, "><")
        .trim()
    );
  }
}
