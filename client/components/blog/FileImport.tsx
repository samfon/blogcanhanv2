/**
 * Advanced File Import System
 * Following complete roadmap: Detection → Processing → Sanitization → Editor Integration
 */

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Upload,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Shield,
  Zap,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { FileDetectionSystem } from "@/utils/fileDetection";
import { DocxProcessor } from "@/utils/docxProcessor";
import { HtmlSanitizer } from "@/utils/htmlSanitizer";

interface FileImportProps {
  onContentImport: (content: string, title?: string) => void;
}

interface ProcessingState {
  phase:
    | "idle"
    | "detecting"
    | "processing"
    | "sanitizing"
    | "complete"
    | "error";
  progress: number;
  message: string;
}

export function FileImport({ onContentImport }: FileImportProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState<ProcessingState>({
    phase: "idle",
    progress: 0,
    message: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Main file processing pipeline
   */
  const processFile = async (file: File) => {
    try {
      // Phase 1: File Detection & Validation
      setProcessing({
        phase: "detecting",
        progress: 10,
        message: "Phân tích file và kiểm tra bảo mật...",
      });

      const detection = await FileDetectionSystem.detectFileType(file);
      if (!detection.isValid) {
        throw new Error(detection.error || "File không hợp lệ");
      }

      // Phase 2: Content Processing
      setProcessing({
        phase: "processing",
        progress: 30,
        message: `Xử lý ${detection.fileType.toUpperCase()} với định dạng đầy đủ...`,
      });

      let content = "";
      let title = file.name.replace(/\.[^/.]+$/, "");

      switch (detection.fileType) {
        case "docx":
        case "doc":
          const docxResult = await DocxProcessor.processDocx(file);
          content = docxResult.html;

          // Show processing stats
          toast({
            title: "📊 Phân tích DOCX hoàn tất",
            description: `${docxResult.stats.words} từ • ${docxResult.stats.headings} headings • ${docxResult.stats.tables} tables`,
          });
          break;

        case "txt":
          content = await processTextFile(file, detection.encoding || "UTF-8");
          break;

        case "md":
          content = await processMarkdownFile(
            file,
            detection.encoding || "UTF-8",
          );
          break;

        default:
          throw new Error(`Định dạng ${detection.fileType} chưa được hỗ trợ`);
      }

      // Phase 3: HTML Sanitization & Security
      setProcessing({
        phase: "sanitizing",
        progress: 70,
        message: "Làm sạch HTML và kiểm tra bảo mật...",
      });

      const sanitizedContent = HtmlSanitizer.sanitize(content, {
        allowImages: true,
        allowTables: true,
        allowLinks: true,
        preserveFormatting: true,
      });

      // Validate HTML structure
      const validation = HtmlSanitizer.validateHtmlStructure(sanitizedContent);
      if (!validation.isValid) {
        console.warn("HTML validation warnings:", validation.errors);
      }

      // Phase 4: Editor Integration
      setProcessing({
        phase: "complete",
        progress: 100,
        message: "Import hoàn tất!",
      });

      // Get final stats
      const stats = HtmlSanitizer.getContentStats(sanitizedContent);

      // Import content
      onContentImport(sanitizedContent, title);

      // Success notification with detailed stats
      toast({
        title: "✅ Import thành công!",
        description: `${stats.words} từ • ${stats.headings} headings • ${stats.tables} tables • ${stats.links} links`,
      });

      // Reset state after delay
      setTimeout(() => {
        setProcessing({ phase: "idle", progress: 0, message: "" });
      }, 2000);
    } catch (error) {
      console.error("File processing error:", error);

      setProcessing({
        phase: "error",
        progress: 0,
        message: error instanceof Error ? error.message : "Lỗi không xác định",
      });

      toast({
        title: "❌ Lỗi import file",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra",
        variant: "destructive",
      });

      setTimeout(() => {
        setProcessing({ phase: "idle", progress: 0, message: "" });
      }, 3000);
    }
  };

  /**
   * Process text files with encoding detection
   */
  const processTextFile = async (
    file: File,
    encoding: string,
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          let content = e.target?.result as string;

          // Convert plain text to HTML paragraphs
          const htmlContent = content
            .split("\n\n")
            .filter((para) => para.trim())
            .map((para) => {
              // Preserve line breaks within paragraphs
              const processedPara = para.trim().replace(/\n/g, "<br>");
              return `<p>${processedPara}</p>`;
            })
            .join("\n");

          resolve(htmlContent);
        } catch (error) {
          reject(
            new Error(
              `Lỗi xử lý text file: ${error instanceof Error ? error.message : "Unknown error"}`,
            ),
          );
        }
      };

      reader.onerror = () => reject(new Error("Không thể đọc file text"));

      // Use detected encoding
      reader.readAsText(file, encoding);
    });
  };

  /**
   * Process Markdown files with full feature support
   */
  const processMarkdownFile = async (
    file: File,
    encoding: string,
  ): Promise<string> => {
    try {
      // Import marked library dynamically
      const { marked } = await import("marked");

      const textContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error("Cannot read markdown file"));
        reader.readAsText(file, encoding);
      });

      // Configure marked for better HTML output
      marked.setOptions({
        breaks: true,
        gfm: true,
        tables: true,
        sanitize: false, // We'll sanitize later
      });

      // Convert markdown to HTML
      const htmlContent = await marked.parse(textContent);

      return htmlContent;
    } catch (error) {
      // Fallback to simple conversion
      return processTextFile(file, encoding);
    }
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    await processFile(file);
  };

  /**
   * Drag and drop handlers
   */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  /**
   * Get processing icon
   */
  const getProcessingIcon = () => {
    switch (processing.phase) {
      case "detecting":
        return <Shield className="h-6 w-6 text-blue-500 animate-pulse" />;
      case "processing":
        return <Zap className="h-6 w-6 text-yellow-500 animate-pulse" />;
      case "sanitizing":
        return <Shield className="h-6 w-6 text-green-500 animate-pulse" />;
      case "complete":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "error":
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
      default:
        return <FileText className="h-8 w-8 text-primary" />;
    }
  };

  const isProcessing = processing.phase !== "idle";

  return (
    <Card
      className={`border-2 border-dashed transition-all duration-300 ${
        isDragging
          ? "border-primary bg-primary/10 scale-105"
          : processing.phase === "error"
            ? "border-red-500 bg-red-50"
            : processing.phase === "complete"
              ? "border-green-500 bg-green-50"
              : "border-muted-foreground/25 hover:border-primary/50 hover:shadow-lg"
      }`}
    >
      <CardContent
        className="p-8"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="text-center space-y-6">
          {/* Processing Icon */}
          <div className="flex flex-col items-center space-y-3">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center relative">
              {isProcessing &&
                processing.phase !== "complete" &&
                processing.phase !== "error" && (
                  <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                )}
              {getProcessingIcon()}
            </div>

            {/* Progress Bar */}
            {isProcessing && processing.progress > 0 && (
              <div className="w-80 bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    processing.phase === "error"
                      ? "bg-red-500"
                      : processing.phase === "complete"
                        ? "bg-green-500"
                        : "bg-primary"
                  }`}
                  style={{ width: `${processing.progress}%` }}
                />
              </div>
            )}

            {/* Status Message */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {processing.phase === "idle"
                  ? "Import tài liệu chuyên nghiệp"
                  : processing.phase === "complete"
                    ? "🎉 Import hoàn tất!"
                    : processing.phase === "error"
                      ? "❌ Có lỗi xảy ra"
                      : "⚡ Đang xử lý..."}
              </h3>

              {processing.message && (
                <p className="text-sm text-muted-foreground">
                  {processing.message}
                </p>
              )}

              {processing.phase === "idle" && (
                <p className="text-sm text-muted-foreground">
                  Kéo thả file hoặc click để chọn
                </p>
              )}
            </div>
          </div>

          {/* Feature Highlights */}
          {processing.phase === "idle" && (
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>Bảo mật tối ưu</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span>Giữ nguyên định dạng</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span>Hỗ trợ đa định dạng</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Xử lý thông minh</span>
                </div>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <Button
            variant="outline"
            size="lg"
            onClick={openFileDialog}
            disabled={isProcessing}
            className="min-w-[200px]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 mr-2" />
                Chọn file
              </>
            )}
          </Button>

          {/* Supported Formats */}
          <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
            {[".docx", ".doc", ".txt", ".md"].map((ext) => (
              <span key={ext} className="px-3 py-1 bg-muted rounded-full">
                {ext}
              </span>
            ))}
          </div>
        </div>

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.doc,.txt,.md"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
