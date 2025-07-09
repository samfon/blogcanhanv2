/**
 * File Detection System - Bước 1 của Roadmap
 * Handles file type detection, validation, and security checks
 */

export interface FileDetectionResult {
  isValid: boolean;
  fileType: string;
  mimeType: string;
  encoding?: string;
  size: number;
  error?: string;
}

export class FileDetectionSystem {
  private static readonly SUPPORTED_TYPES = {
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "docx",
    "application/msword": "doc",
    "text/plain": "txt",
    "text/markdown": "md",
  };

  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  private static readonly ALLOWED_EXTENSIONS = [".docx", ".doc", ".txt", ".md"];

  /**
   * Detect file type from MIME type and extension
   */
  static async detectFileType(file: File): Promise<FileDetectionResult> {
    try {
      // Basic validation
      if (!file) {
        return {
          isValid: false,
          fileType: "unknown",
          mimeType: "",
          size: 0,
          error: "File không tồn tại",
        };
      }

      // Size validation
      if (file.size > this.MAX_FILE_SIZE) {
        return {
          isValid: false,
          fileType: "unknown",
          mimeType: file.type,
          size: file.size,
          error: `File quá lớn. Tối đa ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
        };
      }

      // Extension validation
      const extension = this.getFileExtension(file.name);
      if (!this.ALLOWED_EXTENSIONS.includes(extension)) {
        return {
          isValid: false,
          fileType: "unknown",
          mimeType: file.type,
          size: file.size,
          error: `Định dạng không hỗ trợ. Chỉ hỗ trợ: ${this.ALLOWED_EXTENSIONS.join(", ")}`,
        };
      }

      // MIME type validation
      const fileType =
        this.SUPPORTED_TYPES[file.type as keyof typeof this.SUPPORTED_TYPES] ||
        extension.slice(1);

      // File signature verification for binary files
      if (extension === ".docx" || extension === ".doc") {
        const isValidWordFile = await this.verifyWordFileSignature(file);
        if (!isValidWordFile) {
          return {
            isValid: false,
            fileType,
            mimeType: file.type,
            size: file.size,
            error: "File Word bị hỏng hoặc không hợp lệ",
          };
        }
      }

      // Character encoding detection for text files
      let encoding: string | undefined;
      if (extension === ".txt" || extension === ".md") {
        encoding = await this.detectTextEncoding(file);
      }

      return {
        isValid: true,
        fileType,
        mimeType: file.type,
        encoding,
        size: file.size,
      };
    } catch (error) {
      return {
        isValid: false,
        fileType: "unknown",
        mimeType: file.type || "",
        size: file.size || 0,
        error: `Lỗi phân tích file: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Get file extension from filename
   */
  private static getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf(".");
    return lastDot > 0 ? filename.slice(lastDot).toLowerCase() : "";
  }

  /**
   * Verify Word file signature (ZIP header for .docx)
   */
  private static async verifyWordFileSignature(file: File): Promise<boolean> {
    try {
      const buffer = await file.slice(0, 4).arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // Check for ZIP signature (PK\x03\x04) for .docx files
      if (file.name.toLowerCase().endsWith(".docx")) {
        return (
          bytes[0] === 0x50 &&
          bytes[1] === 0x4b &&
          (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07)
        );
      }

      // Check for OLE signature for .doc files
      if (file.name.toLowerCase().endsWith(".doc")) {
        return (
          bytes[0] === 0xd0 &&
          bytes[1] === 0xcf &&
          bytes[2] === 0x11 &&
          bytes[3] === 0xe0
        );
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Detect text encoding for text files
   */
  /**
 * Detect text encoding for text files using jschardet
 */
private static async detectTextEncoding(file: File): Promise<string> {
    try {
    const jschardet = await import("jschardet");

    const buffer = await file.slice(0, 4096).arrayBuffer();
    const uint8Buffer = new Uint8Array(buffer);
    const detected = jschardet.detect(Buffer.from(uint8Buffer));

    if (detected && detected.encoding && detected.confidence > 0.9) {
        console.log(
        `Encoding detected: ${detected.encoding} with confidence ${detected.confidence}`,
        );
        return detected.encoding;
    }

    return "UTF-8"; // Fallback to UTF-8
    } catch (error) {
    console.error("Error detecting encoding, falling back to UTF-8:", error);
    return "UTF-8";
    }
}

  /**
   * Detect encoding by character patterns
   */
  private static detectByCharacterPatterns(bytes: Uint8Array): string {
    let hasHighBytes = false;
    let validUtf8Sequences = 0;
    let totalBytes = bytes.length;

    for (let i = 0; i < totalBytes; i++) {
      if (bytes[i] > 127) {
        hasHighBytes = true;
        // Check for valid UTF-8 sequences
        if (bytes[i] >= 0xc0 && bytes[i] <= 0xdf && i + 1 < totalBytes) {
          if (bytes[i + 1] >= 0x80 && bytes[i + 1] <= 0xbf) {
            validUtf8Sequences++;
            i++; // Skip next byte
          }
        }
      }
    }

    if (!hasHighBytes) return "ASCII";
    if (validUtf8Sequences > 0) return "UTF-8";

    return "UTF-8"; // Default fallback
  }

  /**
   * Validate file content for security
   */
  static validateFileContent(content: string): boolean {
    // Check for malicious patterns
    const maliciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /data:.*?base64.*?script/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi,
    ];

    return !maliciousPatterns.some((pattern) => pattern.test(content));
  }

  /**
   * Get file info summary
   */
  static getFileInfo(file: File, detectionResult: FileDetectionResult): string {
    const sizeInMB = (file.size / 1024 / 1024).toFixed(2);
    return `${detectionResult.fileType.toUpperCase()} • ${sizeInMB}MB${detectionResult.encoding ? ` • ${detectionResult.encoding}` : ""}`;
  }
}
