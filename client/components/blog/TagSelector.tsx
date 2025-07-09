import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus, ChevronDown } from "lucide-react";
import { useBlog } from "@/contexts/BlogContext";

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagSelector({ selectedTags, onTagsChange }: TagSelectorProps) {
  const { posts } = useBlog();
  const [inputValue, setInputValue] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get all unique tags from existing posts
  const allTags = Array.from(
    new Set(
      posts.flatMap((post) => post.tags).filter((tag) => tag.trim() !== ""),
    ),
  ).sort();

  // Filter available tags based on input and exclude already selected
  const availableTags = allTags.filter(
    (tag) =>
      !selectedTags.includes(tag) &&
      tag.toLowerCase().includes(inputValue.toLowerCase()),
  );

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      onTagsChange([...selectedTags, trimmedTag]);
    }
    setInputValue("");
    setIsDropdownOpen(false);
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (
      e.key === "Backspace" &&
      !inputValue &&
      selectedTags.length > 0
    ) {
      removeTag(selectedTags[selectedTags.length - 1]);
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
    }
  };

  const handleInputFocus = () => {
    setIsDropdownOpen(true);
  };

  const handleInputBlur = () => {
    // Delay to allow click on dropdown items
    setTimeout(() => setIsDropdownOpen(false), 150);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-2">
      <Label>Thẻ tag</Label>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input with Dropdown */}
      <div className="relative" ref={inputRef}>
        <div className="flex">
          <Input
            placeholder="Nhập thẻ tag hoặc chọn từ danh sách..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Dropdown */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {/* Add current input as new tag option */}
            {inputValue.trim() &&
              !availableTags.includes(inputValue.trim()) && (
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 border-b border-border"
                  onClick={() => addTag(inputValue)}
                >
                  <Plus className="h-4 w-4 text-primary" />
                  <span>Tạo thẻ mới: "{inputValue.trim()}"</span>
                </button>
              )}

            {/* Existing tags */}
            {availableTags.length > 0 ? (
              <>
                {inputValue.trim() && (
                  <div className="px-3 py-1 text-xs text-muted-foreground border-b border-border">
                    Thẻ đã có:
                  </div>
                )}
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-muted"
                    onClick={() => addTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </>
            ) : inputValue.trim() === "" ? (
              <div className="px-3 py-2 text-muted-foreground text-sm">
                {allTags.length === 0
                  ? "Chưa có thẻ nào được tạo"
                  : "Tất cả thẻ đã được chọn"}
              </div>
            ) : null}

            {/* No results */}
            {availableTags.length === 0 &&
              inputValue.trim() !== "" &&
              !allTags.some((tag) =>
                tag.toLowerCase().includes(inputValue.toLowerCase()),
              ) && (
                <div className="px-3 py-2 text-muted-foreground text-sm">
                  Không tìm thấy thẻ nào
                </div>
              )}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Nhấn Enter hoặc dấu phẩy để thêm thẻ. Backspace để xóa thẻ cuối.
      </p>
    </div>
  );
}
