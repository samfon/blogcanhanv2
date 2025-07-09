import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBlog } from "@/contexts/BlogContext";
import { BlogHeader } from "@/components/blog/BlogHeader";
import { CategoryCreateModal } from "@/components/blog/CategoryCreateModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FolderIcon,
  FileTextIcon,
  TrendingUpIcon,
  PlusIcon,
} from "lucide-react";

export default function Categories() {
  const { categories, posts, createCategory, incrementViews } = useBlog();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const totalPosts = posts.length;
  const mostPopular =
    categories.length > 0
      ? [...categories].sort((a, b) => b.postCount - a.postCount)[0]
      : null;

  const handleCreateCategory = (name: string, description: string) => {
    try {
      createCategory(name, description);
      const categoryId = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      navigate(`/category/${categoryId}`);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi tạo danh mục",
      );
    }
  };

  const handleRecentPostClick = (postTitle: string) => {
    const postToNavigate = posts.find((p) => p.title === postTitle);
    if (postToNavigate) {
      incrementViews(postToNavigate.id);
      navigate(`/post/${postToNavigate.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <BlogHeader />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-4 flex items-center space-x-3">
                <FolderIcon className="h-8 w-8 text-primary" />
                <span>Danh mục bài viết</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Khám phá kiến thức được tổ chức theo từng chủ đề cụ thể
              </p>
            </div>
            <Button asChild>
              <Link to="/write" className="flex items-center space-x-2">
                <PlusIcon className="h-4 w-4" />
                <span>Thêm bài viết</span>
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <FileTextIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalPosts}</p>
                    <p className="text-sm text-muted-foreground">
                      Tổng bài viết
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <FolderIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{categories.length}</p>
                    <p className="text-sm text-muted-foreground">Danh mục</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <TrendingUpIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {mostPopular?.name || "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Phổ biến nhất
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Categories Grid */}
        {/* SỬA LỖI Ở ĐÂY: Thêm class `grid` để các item trong grid có chiều cao bằng nhau */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const categoryPosts = posts.filter(
              (post) =>
                post.category.toLowerCase() === category.name.toLowerCase(),
            );
            const recentPosts = categoryPosts
              .sort(
                (a, b) =>
                  new Date(b.publishedAt).getTime() -
                  new Date(a.publishedAt).getTime(),
              )
              .slice(0, 3);

            return (
              // Thêm `flex flex-col` để sử dụng flexbox cho layout bên trong card
              <Card
                key={category.id}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <FolderIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          <Link to={`/category/${category.id}`}>
                            {category.name}
                          </Link>
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-muted-foreground">
                            {categoryPosts.length} bài viết
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Thêm `flex-grow` để phần content tự dãn ra, đẩy button xuống dưới */}
                <CardContent className="pt-0 flex flex-col flex-grow">
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                    {category.description}
                  </p>

                  {/* Thêm `flex-grow` để đẩy button xuống dưới cùng */}
                  <div className="space-y-2 flex-grow">
                    <h4 className="text-sm font-medium text-foreground">
                      Bài viết gần đây:
                    </h4>
                    <ul className="space-y-1">
                      {recentPosts.length > 0 ? (
                        recentPosts.map((post, index) => (
                          <li
                            key={index}
                            className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            onClick={() => handleRecentPostClick(post.title)}
                          >
                            • {post.title}
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-muted-foreground">
                          Chưa có bài viết nào
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/50">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="w-full"
                    >
                      <Link to={`/category/${category.id}`}>
                        Xem tất cả bài viết
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card
          className="mt-12 border-dashed border-2 border-primary/30 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/30 transition-colors">
              <PlusIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Tạo danh mục mới</h3>
            <p className="text-muted-foreground">
              Thêm danh mục mới để tổ chức kiến thức của bạn tốt hơn
            </p>
          </CardContent>
        </Card>

        <CategoryCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateCategory}
        />
      </main>
    </div>
  );
}
