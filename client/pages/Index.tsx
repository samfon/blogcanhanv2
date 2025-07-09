import { BlogHeader } from "@/components/blog/BlogHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useBlog } from "@/contexts/BlogContext";
import {
  FolderIcon,
  SearchIcon,
  EyeIcon,
  EditIcon,
  CalendarIcon
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const { posts, categories, searchPosts, incrementViews } = useBlog();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const recentlyViewedPosts = [...posts]
  .filter(post => post.lastViewedAt) // Chỉ lấy những bài đã được xem
  .sort((a, b) => b.lastViewedAt! - a.lastViewedAt!) // Sắp xếp theo lần xem cuối cùng
  .slice(0, 5); // Lấy 5 bài gần nhất

  const filteredPosts = searchQuery ? searchPosts(searchQuery) : [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(value.length > 0);
  };

  const handlePostSelect = (post: (typeof posts)[0]) => {
    setSearchQuery("");
    setShowDropdown(false);
    incrementViews(post.id);
    navigate(`/post/${post.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <BlogHeader />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        {/* Search Section */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-6">Bạn cần đọc gì hôm nay?</h1>
            <div className="max-w-2xl mx-auto relative">
              <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài viết theo tiêu đề..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() =>
                    searchQuery.length > 0 && setShowDropdown(true)
                  }
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  className="w-full pl-12 pr-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
                {showDropdown && filteredPosts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                    {filteredPosts.slice(0, 8).map((post, index) => (
                      <div
                        key={`search-${post.id}-${index}`}
                        onClick={() => handlePostSelect(post)}
                        className="p-3 hover:bg-accent cursor-pointer border-b border-border/50 last:border-b-0 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0 mr-4">
                            <h4 className="font-medium text-foreground text-sm truncate text-left">
                              {post.title}
                            </h4>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground shrink-0 mt-0.5">
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary/20 text-primary">
                              {post.category}
                            </span>
                            <span>{post.publishedAt}</span>
                            <span className="flex items-center">
                              <EyeIcon className="h-3 w-3 mr-1" />
                              {post.views}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredPosts.length > 8 && (
                      <div className="p-3 text-center text-sm text-muted-foreground border-t border-border/50">
                        Và {filteredPosts.length - 8} bài viết khác...
                      </div>
                    )}
                  </div>
                )}
                {showDropdown &&
                  searchQuery.length > 0 &&
                  filteredPosts.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 p-4 text-center">
                      <p className="text-muted-foreground">
                        Không tìm thấy bài viết nào
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Khám phá theo danh mục
          </h2>
          {/* SỬA LỖI Ở ĐÂY: Thêm class `grid` để các item trong grid có chiều cao bằng nhau */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => {
              return (
                // Thêm `flex flex-col` để sử dụng flexbox cho layout bên trong card
                <Card
                  key={`category-${category.id}-${index}`}
                  className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card/50 cursor-pointer flex flex-col"
                  onClick={() => navigate(`/category/${category.id}`)}
                >
                  {/* Thêm `flex-grow` để phần content tự dãn ra, đẩy button xuống dưới */}
                  <CardContent className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <FolderIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        <div className="text-sm text-muted-foreground">
                          {
                            posts.filter(
                              (p) =>
                                p.category.toLowerCase() ===
                                category.name.toLowerCase(),
                            ).length
                          }{" "}
                          bài viết
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {category.description}
                    </p>
                    
                    {/* Thêm `flex-grow` để đẩy button xuống dưới cùng */}
                    <div className="mb-4 flex-grow">
                      <h4 className="text-sm font-medium mb-2">
                        Bài viết gần đây:
                      </h4>
                      <div className="space-y-1">
                        {posts
                          .filter(
                            (p) =>
                              p.category.toLowerCase() ===
                              category.name.toLowerCase(),
                          )
                          .slice(0, 3)
                          .map((post, index) => (
                            <div
                              key={`recent-${post.id}-${index}`}
                              className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                incrementViews(post.id);
                                navigate(`/post/${post.id}`);
                              }}
                            >
                              • {post.title}
                            </div>
                          ))}
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/category/${category.id}`)}
                      className="w-full text-sm text-primary hover:text-primary/80 font-medium transition-colors text-left mt-auto"
                    >
                      Xem tất cả bài viết
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* All Posts Section */}
        <section>
          <Card className="bg-card/50">
            <CardContent className="p-0">
              <div className="p-6 border-b border-border/50">
                <h2 className="text-xl font-bold">Đã đọc gần đây</h2>
              </div>
              <div className="grid grid-cols-12 gap-4 p-4 bg-muted/20 text-sm font-medium text-muted-foreground border-b border-border/30">
                <div className="col-span-3">Tiêu đề</div>
                <div className="col-span-2">Danh mục</div>
                <div className="col-span-2">Tags</div>
                <div className="col-span-2">Ngày tạo</div>
                <div className="col-span-1">Đọc</div>
                <div className="col-span-2">Thao tác</div>
              </div>
              <div className="divide-y divide-border/30">
                {recentlyViewedPosts.map((post, index) => (
                  <div
                    key={`home-post-${post.id}-${index}`}
                    className="grid grid-cols-12 gap-4 p-4 hover:bg-muted/10 transition-colors"
                  >
                    <div className="col-span-3">
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
