import { BlogHeader } from "@/components/blog/BlogHeader";
import { CategoryCreateModal } from "@/components/blog/CategoryCreateModal";
import { FileImport } from "@/components/blog/FileImport";
import { RichTextEditor } from "@/components/blog/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeftIcon, EyeIcon, PlusIcon } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useBlog } from "@/contexts/BlogContext";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export default function Write() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { createPost, updatePost, getPost, categories, createCategory } =
    useBlog();
  const [isEditing, setIsEditing] = useState(!!id);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] =
    useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    notes: "",
    status: "published" as "published",
  });

  // Load post data if editing
  useEffect(() => {
    if (id && isEditing) {
      const post = getPost(id);
      if (post) {
        setFormData({
          title: post.title,
          content: post.content,
          category: post.category,
          tags: post.tags.join(", "),
          notes: post.updateLogs[0]?.note || "",
          _status: post.status,
          get status() {
            return this._status;
          },
          set status(value) {
            this._status = value;
          },
        });
      }
    }
  }, [id, isEditing, getPost]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} phút đọc`;
  };

  const generateExcerpt = (content: string) => {
    const plainText = content.replace(/[#*`\n]/g, " ").trim();
    return plainText.length > 150
      ? plainText.substring(0, 150) + "..."
      : plainText;
  };

  const handleCreateCategory = (name: string, description: string) => {
    try {
      createCategory(name, description);
      handleInputChange("category", name);
      toast({
        title: "Thành công",
        description: "Đã tạo danh mục mới",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description:
          error instanceof Error
            ? error.message
            : "Có lỗi xảy ra khi tạo danh mục",
        variant: "destructive",
      });
    }
  };

  const handleFileImport = (content: string, title?: string) => {
    console.log("handleFileImport called with:", {
      content: content.substring(0, 200),
      title,
      contentLength: content.length,
    });

    if (title && !formData.title) {
      handleInputChange("title", title);
    }
    handleInputChange("content", content);

    // Additional debug
    console.log(
      "Updated formData.content:",
      formData.content.substring(0, 200),
    );
  };

  const handleSave = async (status: "draft" | "published") => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tiêu đề và nội dung bài viết",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn danh mục",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt: generateExcerpt(formData.content),
        category: formData.category,
        readTime: calculateReadTime(formData.content),
        status,
      };

      if (isEditing && id) {
        // Add update log for existing post
        const existingPost = getPost(id);
        const updateLog = {
          id: Date.now().toString(),
          date: new Date().toLocaleDateString("vi-VN"),
          version: `1.${(existingPost?.updateLogs.length || 0) + 1}`,
          changes: ["Cập nhật nội dung bài viết"],
          note: formData.notes || undefined,
        };

        updatePost(id, {
          ...postData,
          updateLogs: [...(existingPost?.updateLogs || []), updateLog],
        });

        toast({
          title: "Thành công",
          description: "Đã cập nhật bài viết",
        });
      } else {
        createPost(postData);
        toast({
          title: "Thành công",
          description: "Đã xuất bản bài viết",
        });
      }

      // Navigate back to posts list
      setTimeout(() => {
        navigate("/posts");
      }, 1000);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi lưu bài viết",
        variant: "destructive",
      });
    }

    setIsSaving(false);
  };

  const handleAddNewCategory = () => {
    if (newCategoryName.trim()) {
      const categoryName = categoryName.trim();

      // Add to categories if not exists
      const categoryExists = categories.some(
        (cat) => cat.name.toLowerCase() === categoryName.toLowerCase(),
      );

      if (!categoryExists && categories) {
        const newCategory = {
          id: categoryName.toLowerCase().replace(/\s+/g, "-"),
          name: categoryName,
          description: `Danh mục ${categoryName}`,
          postCount: 0,
          recentPosts: [],
        };

        categories((prev) => [...prev, newCategory]);
      }

      setFormData((prev) => ({ ...prev, category: categoryName }));
      categoryName("");
      setShowNewCategoryInput(false);
      toast({
        title: "Thành công",
        description: `Đã thêm danh mục "${categoryName}"`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <BlogHeader />

      <main className="container mx-auto max-w-full px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm">
                <Link to="/posts" className="flex items-center space-x-2">
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span>Quay lại</span>
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">
                  {isEditing ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                size="sm"
                onClick={() => handleSave("published")}
                disabled={isSaving}
              >
                {isSaving ? "Đang xuất bản..." : "Xuất bản"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="xl:col-span-3 space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label htmlFor="title">Tiêu ��ề bài viết</Label>
                    <Input
                      id="title"
                      placeholder="Nhập tiêu đề bài viết..."
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">Nội dung</Label>
                    <div className="mt-2">
                      <RichTextEditor
                        content={formData.content}
                        onChange={(content) =>
                          handleInputChange("content", content)
                        }
                        placeholder="Viết nội dung bài viết tại đây..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* File Import Section */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Import từ file</h3>
                  <FileImport onContentImport={handleFileImport} />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="xl:col-span-1 space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label htmlFor="category">Danh mục</Label>
                    <div className="mt-2 space-y-2">
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          handleInputChange("category", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCreateCategoryModalOpen(true)}
                        className="w-full"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Tạo danh mục mới
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Ghi chú cập nhật</Label>
                    <Textarea
                      id="notes"
                      placeholder="Ghi chú về bài viết này..."
                      value={formData.notes}
                      onChange={(e) =>
                        handleInputChange("notes", e.target.value)
                      }
                      rows={4}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Category Create Modal */}
          <CategoryCreateModal
            isOpen={isCreateCategoryModalOpen}
            onClose={() => setIsCreateCategoryModalOpen(false)}
            onSave={handleCreateCategory}
          />
        </div>
      </main>
    </div>
  );
}
function setShowNewCategoryInput(arg0: boolean) {
  throw new Error("Function not implemented.");
}

