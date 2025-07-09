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
import { ArrowLeftIcon, PlusIcon, Loader2 } from "lucide-react"; // Thêm Loader2
import { Link, useNavigate, useParams } from "react-router-dom";
import { useBlog } from "@/contexts/BlogContext";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export default function Write() {
  const { id } = useParams();
  const navigate = useNavigate();
  // Sửa: Thêm isLoading và user từ context
  const { createPost, updatePost, getPost, categories, createCategory, isLoading, user } = useBlog();
  
  const [isEditing, setIsEditing] = useState(!!id);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true); // State để quản lý việc tải trang

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    notes: "",
    status: "published" as "published" | "draft",
  });

  // Sửa: Logic tải dữ liệu được làm chặt chẽ hơn
  useEffect(() => {
    // Chỉ chạy logic này khi context đã tải xong (isLoading = false)
    if (!isLoading) {
      if (id && isEditing) {
        const post = getPost(id);
        if (post) {
          setFormData({
            title: post.title,
            content: post.content,
            category: post.category,
            notes: post.updateLogs?.[0]?.note || "",
            status: post.status,
          });
        } else {
          // Nếu không tìm thấy bài viết, có thể chuyển hướng về trang 404
          toast({ title: "Lỗi", description: "Không tìm thấy bài viết.", variant: "destructive" });
          navigate("/posts");
        }
      }
      // Dù là tạo mới hay chỉnh sửa, sau khi context tải xong thì trang cũng sẵn sàng
      setIsPageLoading(false);
    }
  }, [id, isEditing, getPost, isLoading, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const plainText = content.replace(/<[^>]+>/g, "");
    const wordCount = plainText.trim().split(/\s+/).length;
    return `${Math.ceil(wordCount / wordsPerMinute)} phút đọc`;
  };

  const generateExcerpt = (content: string) => {
    const plainText = content.replace(/<[^>]+>/g, " ").trim();
    return plainText.length > 150 ? plainText.substring(0, 150) + "..." : plainText;
  };

  const handleCreateCategory = (name: string, description: string) => {
    try {
      createCategory(name, description);
      handleInputChange("category", name);
      toast({ title: "Thành công", description: "Đã tạo danh mục mới" });
    } catch (error) {
      toast({ title: "Lỗi", description: error instanceof Error ? error.message : "Có lỗi xảy ra", variant: "destructive" });
    }
  };

  const handleFileImport = (content: string, title?: string) => {
    if (title && !formData.title) {
      handleInputChange("title", title);
    }
    handleInputChange("content", content);
  };

  const handleSave = async (status: "draft" | "published") => {
    if (!formData.title.trim() || !formData.content.trim() || !formData.category) {
      toast({ title: "Lỗi", description: "Vui lòng nhập tiêu đề, nội dung và chọn danh mục.", variant: "destructive" });
      return;
    }
    if (!user) {
        toast({ title: "Lỗi", description: "Bạn phải đăng nhập để thực hiện hành động này.", variant: "destructive" });
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
        authorId: user.uid, // Thêm authorId
      };

      if (isEditing && id) {
        const existingPost = getPost(id);
        const newUpdateLog = {
          id: Date.now().toString(),
          date: new Date().toLocaleDateString("vi-VN"),
          version: `1.${(existingPost?.updateLogs?.length || 0) + 1}`,
          changes: ["Cập nhật nội dung bài viết"],
          note: formData.notes || undefined,
        };
        const updatedLogs = [...(existingPost?.updateLogs || []), newUpdateLog];
        await updatePost(id, { ...postData, updateLogs: updatedLogs });
        toast({ title: "Thành công", description: "Đã cập nhật bài viết" });
      } else {
        await createPost(postData);
        toast({ title: "Thành công", description: "Đã tạo bài viết mới" });
      }
      navigate("/posts");
    } catch (error) {
      toast({ title: "Lỗi", description: "Có lỗi xảy ra khi lưu bài viết.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Sửa: Thêm màn hình loading
  if (isPageLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BlogHeader />
      <main className="container mx-auto max-w-full px-4 py-8">
        <div className="max-w-7xl mx-auto">
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
              <Button size="sm" onClick={() => handleSave("published")} disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Xuất bản"}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            <div className="xl:col-span-3 space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label htmlFor="title">Tiêu đề bài viết</Label>
                    <Input id="title" placeholder="Nhập tiêu đề..." value={formData.title} onChange={(e) => handleInputChange("title", e.target.value)} className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="content">Nội dung</Label>
                    <div className="mt-2">
                      <RichTextEditor content={formData.content} onChange={(content) => handleInputChange("content", content)} placeholder="Viết nội dung tại đây..." />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Import từ file</h3>
                  <FileImport onContentImport={handleFileImport} />
                </CardContent>
              </Card>
            </div>
            <div className="xl:col-span-1 space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label htmlFor="category">Danh mục</Label>
                    <div className="mt-2 space-y-2">
                      <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                        <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateCategoryModalOpen(true)} className="w-full">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Tạo danh mục mới
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Ghi chú cập nhật</Label>
                    <Textarea id="notes" placeholder="Ghi chú về phiên bản này..." value={formData.notes} onChange={(e) => handleInputChange("notes", e.target.value)} rows={4} className="mt-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <CategoryCreateModal isOpen={isCreateCategoryModalOpen} onClose={() => setIsCreateCategoryModalOpen(false)} onSave={handleCreateCategory} />
        </div>
      </main>
    </div>
  );
}
