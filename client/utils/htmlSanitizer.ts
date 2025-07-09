/**
 * HTML Sanitization System - Bước 9 của Roadmap
 * Handles HTML cleaning, validation, and XSS prevention
 */

import DOMPurify from "dompurify";

export interface SanitizationOptions {
  allowImages?: boolean;
  allowTables?: boolean;
  allowLinks?: boolean;
  allowEmbeddedContent?: boolean;
  preserveFormatting?: boolean;
}

export class HtmlSanitizer {
  private static readonly DEFAULT_ALLOWED_TAGS = [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "s",
    "sub",
    "sup",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "blockquote",
    "pre",
    "code",
    "div",
    "span",
  ];

  private static readonly FORMATTING_TAGS = [
    "b",
    "i",
    "mark",
    "small",
    "del",
    "ins",
  ];

  private static readonly TABLE_TAGS = [
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "th",
    "td",
    "caption",
  ];

  private static readonly MEDIA_TAGS = ["img", "figure", "figcaption"];

  private static readonly LINK_TAGS = ["a"];

  private static readonly ALLOWED_ATTRIBUTES = {
    a: ["href", "title"],
    img: ["src", "alt", "title", "width", "height"],
    table: ["class"],
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
    p: ["style"],
    div: ["style"],
    span: ["style"],
    h1: ["style"],
    h2: ["style"],
    h3: ["style"],
    h4: ["style"],
    h5: ["style"],
    h6: ["style"],
  };

  private static readonly ALLOWED_STYLES = [
    "text-align",
    "margin-left",
    "padding-left",
    "font-weight",
    "font-style",
    "text-decoration",
    "color",
    "background-color",
  ];

  /**
   * Sanitize HTML content with security and formatting preservation
   */
  static sanitize(html: string, options: SanitizationOptions = {}): string {
    const config = this.buildSanitizationConfig(options);

    try {
      // Pre-process HTML
      let processedHtml = this.preProcessHtml(html);

      // Sanitize with DOMPurify
      let sanitized = DOMPurify.sanitize(processedHtml, config);

      // Post-process for better formatting
      sanitized = this.postProcessHtml(sanitized, options);

      return sanitized;
    } catch (error) {
      console.error("HTML sanitization error:", error);
      // Return safely escaped text as fallback
      return this.escapeHtml(this.stripHtml(html));
    }
  }

  /**
   * Build DOMPurify configuration based on options
   */
  private static buildSanitizationConfig(options: SanitizationOptions): any {
    let allowedTags = [...this.DEFAULT_ALLOWED_TAGS];
    let allowedAttributes = { ...this.ALLOWED_ATTRIBUTES };

    // Add formatting tags if requested
    if (options.preserveFormatting) {
      allowedTags.push(...this.FORMATTING_TAGS);
    }

    // Add table support
    if (options.allowTables) {
      allowedTags.push(...this.TABLE_TAGS);
    }

    // Add image support
    if (options.allowImages) {
      allowedTags.push(...this.MEDIA_TAGS);
    }

    // Add link support
    if (options.allowLinks) {
      allowedTags.push(...this.LINK_TAGS);
    }

    return {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: allowedAttributes,
      ALLOWED_URI_REGEXP:
        /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|#):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_TRUSTED_TYPE: false,
      SANITIZE_DOM: true,
      WHOLE_DOCUMENT: false,
      IN_PLACE: false,
      ALLOW_ARIA_ATTR: false,
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      SAFE_FOR_TEMPLATES: true,

      // Custom hook for style attribute filtering
      FORBID_ATTR: [],
      CUSTOM_ELEMENT_HANDLING: {
        tagNameCheck: null,
        attributeNameCheck: null,
        allowCustomizedBuiltInElements: false,
      },
    };
  }

  /**
   * Pre-process HTML before sanitization
   */
  private static preProcessHtml(html: string): string {
    return (
      html
        // Normalize line breaks
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")

        // Clean up Microsoft Word artifacts
        .replace(/<o:p\s*\/?>|<\/o:p>/gi, "")
        .replace(/<w:[^>]*>|<\/w:[^>]*>/gi, "")
        .replace(/mso-[^;]+;?/gi, "")

        // Fix common HTML issues
        .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, "</p><p>")
        .replace(/&nbsp;/g, " ")

        // Normalize whitespace
        .replace(/\s+/g, " ")
        .trim()
    );
  }

  /**
   * Post-process HTML after sanitization
   */
  private static postProcessHtml(
    html: string,
    options: SanitizationOptions,
  ): string {
    let processed = html;

    // Clean up empty elements
    processed = processed.replace(/<p\s*>\s*<\/p>/gi, "");
    processed = processed.replace(/<div\s*>\s*<\/div>/gi, "");

    // Ensure proper paragraph structure
    if (
      !processed.includes("<p>") &&
      !processed.includes("<h1>") &&
      !processed.includes("<ul>")
    ) {
      // Convert plain text to paragraphs
      processed = processed
        .split("\n\n")
        .filter((para) => para.trim())
        .map((para) => `<p>${para.trim()}</p>`)
        .join("\n");
    }

    // Fix heading hierarchy
    processed = this.normalizeHeadings(processed);

    // Clean up excessive whitespace
    processed = processed
      .replace(/\n\s*\n\s*\n/g, "\n\n")
      .replace(/>\s+</g, "><")
      .trim();

    return processed;
  }

  /**
   * Normalize heading hierarchy
   */
  private static normalizeHeadings(html: string): string {
    // Ensure headings don't skip levels
    let normalized = html;

    // Find all headings and their levels
    const headingMatches = html.match(/<h([1-6])[^>]*>.*?<\/h\1>/gi) || [];
    const levels = headingMatches.map((match) => {
      const levelMatch = match.match(/<h([1-6])/);
      return levelMatch ? parseInt(levelMatch[1]) : 1;
    });

    // Normalize levels to not skip
    let currentLevel = 1;
    const levelMap = new Map<number, number>();

    levels.forEach((level) => {
      if (!levelMap.has(level)) {
        levelMap.set(level, currentLevel);
        currentLevel++;
      }
    });

    // Apply normalization
    levelMap.forEach((newLevel, oldLevel) => {
      if (newLevel !== oldLevel) {
        const regex = new RegExp(
          `<h${oldLevel}([^>]*)>(.*?)</h${oldLevel}>`,
          "gi",
        );
        normalized = normalized.replace(
          regex,
          `<h${newLevel}$1>$2</h${newLevel}>`,
        );
      }
    });

    return normalized;
  }

  /**
   * Strip all HTML tags (fallback for security)
   */
  private static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").trim();
  }

  /**
   * Escape HTML entities (fallback for security)
   */
  private static escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Validate HTML structure
   */
  static validateHtmlStructure(html: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check for balanced tags
      const openTags = html.match(/<[^\/][^>]*>/g) || [];
      const closeTags = html.match(/<\/[^>]*>/g) || [];

      if (openTags.length !== closeTags.length) {
        warnings.push("Unbalanced HTML tags detected");
      }

      // Check for dangerous patterns
      const dangerousPatterns = [
        { pattern: /<script/i, message: "Script tags detected" },
        { pattern: /javascript:/i, message: "JavaScript URLs detected" },
        { pattern: /on\w+\s*=/i, message: "Event handlers detected" },
        { pattern: /<iframe/i, message: "Iframe tags detected" },
        { pattern: /<object/i, message: "Object tags detected" },
        { pattern: /<embed/i, message: "Embed tags detected" },
      ];

      dangerousPatterns.forEach(({ pattern, message }) => {
        if (pattern.test(html)) {
          errors.push(message);
        }
      });

      // Check for proper structure
      if (html.includes("<table>") && !html.includes("<tr>")) {
        warnings.push("Table without rows detected");
      }

      if (html.includes("<ul>") && !html.includes("<li>")) {
        warnings.push("List without items detected");
      }
    } catch (error) {
      errors.push(
        `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get content statistics
   */
  static getContentStats(html: string): {
    characters: number;
    words: number;
    paragraphs: number;
    headings: number;
    links: number;
    images: number;
    lists: number;
    tables: number;
  } {
    const textContent = this.stripHtml(html);

    return {
      characters: textContent.length,
      words: textContent.split(/\s+/).filter((word) => word.length > 0).length,
      paragraphs: (html.match(/<p[^>]*>/gi) || []).length,
      headings: (html.match(/<h[1-6][^>]*>/gi) || []).length,
      links: (html.match(/<a[^>]*>/gi) || []).length,
      images: (html.match(/<img[^>]*>/gi) || []).length,
      lists: (html.match(/<[uo]l[^>]*>/gi) || []).length,
      tables: (html.match(/<table[^>]*>/gi) || []).length,
    };
  }
}
