import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBlog } from "@/contexts/BlogContext";
import { BlogHeader } from "@/components/blog/BlogHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  SearchIcon,
  CalendarIcon,
  EyeIcon,
  EditIcon,
  Trash2Icon, // Import icon xóa
} from "lucide-react";
import { Post } from "@/contexts/BlogContext"; // Import kiểu Post

export default function Posts() {
  const { posts, incrementViews, deletePost } = useBlog(); // Lấy hàm deletePost
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "views">("newest");
  const [postToDelete, setPostToDelete] = useState<Post | null>(null); // State cho dialog xác nhận xóa

  // Sort posts based on selected criteria
  const sortedPosts = [...posts].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (
          new Date(b.updatedAt.split("/").reverse().join("-")).getTime() -
          new Date(a.updatedAt.split("/").reverse().join("-")).getTime()
        );
      case "oldest":
        return (
          new Date(a.publishedAt.split("/").reverse().join("-")).getTime() -
          new Date(b.publishedAt.split("/").reverse().join("-")).getTime()
        );
      case "views":
        return b.views - a.views;
      default:
        return 0;
    }
  });

  // Filter posts based on search query
  const filteredPosts = sortedPosts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDelete = () => {
    if (postToDelete) {
      deletePost(postToDelete.id);
      setPostToDelete(null); // Đóng dialog sau khi xóa
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <BlogHeader />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tất cả bài viết</h1>
          <p className="text-muted-foreground">
            Khám phá toàn bộ thư viện kiến thức với các bài viết được phân loại
            và tìm kiếm bài viết phù hợp với bạn
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm bài viết..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="secondary" size="sm">
                  Tất cả
                </Button>
                <div className="text-sm text-muted-foreground">
                  Hiển thị {filteredPosts.length} / {posts.length} bài viết
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "newest" | "oldest" | "views")
                  }
                  className="text-sm bg-background border border-border rounded px-3 py-1"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="views">Lượt xem</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts List */}
        <Card>
          <CardContent className="p-0">
            {/* Table Header */}
            <div className="grid grid-cols-10 gap-4 p-4 border-b bg-muted/20 text-sm font-medium text-muted-foreground">
              <div className="col-span-5">Tiêu đề</div>
              <div className="col-span-2">Danh mục</div>
              <div className="col-span-2">Ngày tạo</div>
              <div className="col-span-1">Đọc</div>
              <div className="col-span-2">Thao tác</div>
            </div>

            {/* Posts */}
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="grid grid-cols-10 gap-4 p-4 border-b hover:bg-muted/10 transition-colors"
              >
                <div className="col-span-5">
                  <div
                    className="font-medium hover:text-primary cursor-pointer transition-colors hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      incrementViews(post.id);
                      navigate(`/post/${post.id}`);
                    }}
                  >
                    {post.title}
                  </div>
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {post.category}
                </div>
                <div className="col-span-2">
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <CalendarIcon className="h-3 w-3" />
                    <span>{post.publishedAt}</span>
                  </div>
                </div>
                <div className="col-span-1">
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <span>{post.views}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        incrementViews(post.id);
                        navigate(`/post/${post.id}`);
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/edit/${post.id}`)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                    {/* NÚT XÓA MỚI */}
                    <button
                      onClick={() => setPostToDelete(post)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Empty States */}
        {filteredPosts.length === 0 && posts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              Chưa có bài viết nào
            </div>
            <Button onClick={() => navigate("/write")}>
              Tạo bài viết đầu tiên
            </Button>
          </div>
        )}

        {filteredPosts.length === 0 && posts.length > 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              Không tìm thấy bài viết nào với từ khóa "{searchQuery}"
            </div>
          </div>
        )}
      </main>

      {/* DIALOG XÁC NHẬN XÓA */}
      <AlertDialog
        open={!!postToDelete}
        onOpenChange={() => setPostToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Bài viết "
              <b>{postToDelete?.title}</b>" sẽ bị xóa vĩnh viễn khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
