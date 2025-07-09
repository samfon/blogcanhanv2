import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useBlog } from "../contexts/BlogContext";
import { BlogHeader } from "../components/blog/BlogHeader";
import { CategoryTag } from "../components/blog/CategoryTag";
import { UpdateLog } from "../components/blog/UpdateLog";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  CalendarIcon,
  ClockIcon,
  EditIcon,
  ArrowLeftIcon,
  EyeIcon,
  BookOpen,
  TrendingUp,
} from "lucide-react";

// =================================================================
// Component Mục lục (TableOfContents)
// =================================================================
interface Heading {
  id: string;
  level: number;
  text: string;
  element: Element;
}

interface TableOfContentsProps {
  headings: Heading[];
}

function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState("");
  const tocRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const styleId = 'custom-toc-scrollbar-style';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      .custom-toc-scrollbar::-webkit-scrollbar { width: 8px; }
      .custom-toc-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-toc-scrollbar::-webkit-scrollbar-thumb { background-color: hsl(var(--secondary)); border-radius: 4px; }
      .custom-toc-scrollbar::-webkit-scrollbar-thumb:hover { background-color: hsl(var(--primary)); }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -60% 0px", threshold: 0 }
    );

    headings.forEach((heading) => observer.observe(heading.element));
    return () => headings.forEach((heading) => observer.unobserve(heading.element));
  }, [headings]);

  useEffect(() => {
    if (activeId && tocRef.current) {
      const activeLink = tocRef.current.querySelector(`a[href="#${activeId}"]`);
      if (activeLink) {
        activeLink.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeId]);

  const handleLinkClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80; 
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      window.history.pushState(null, "", `#${id}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <BookOpen className="h-5 w-5 mr-2" />
          Mục lục
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* SỬA LỖI 1: GIẢM CHIỀU CAO TỐI ĐA CỦA MỤC LỤC */}
        <ul ref={tocRef} className="space-y-2 max-h-[45vh] overflow-y-auto custom-toc-scrollbar">
          {headings.map((heading) => (
            <li key={heading.id} style={{ paddingLeft: `${(heading.level - 1) * 1}rem` }}>
              <a
                href={`#${heading.id}`}
                onClick={(e) => handleLinkClick(e, heading.id)}
                className={`text-sm transition-colors duration-200 hover:text-primary ${
                  activeId === heading.id ? "font-bold text-primary" : "text-muted-foreground"
                }`}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// =================================================================
// Component chính: PostDetail
// =================================================================
export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { getPost, incrementViews } = useBlog();
  const post = id ? getPost(id) : null;
  const contentRef = useRef<HTMLDivElement>(null);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [readingProgress, setReadingProgress] = useState(0);

  const viewedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (id && viewedIdRef.current !== id) {
      incrementViews(id);
      viewedIdRef.current = id;
    }
  }, [id, incrementViews]);

  useEffect(() => {
    const handleScroll = () => {
      const contentEl = contentRef.current;
      if (!contentEl) return;

      const { top, height } = contentEl.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      if (top < 0) {
        const scrolled = Math.abs(top);
        const totalScrollable = height - viewportHeight;
        if (totalScrollable > 0) {
          let progress = (scrolled / totalScrollable) * 100;
          progress = Math.min(Math.max(progress, 0), 100);
          setReadingProgress(Math.round(progress));
        } else {
          setReadingProgress(100);
        }
      } else {
        setReadingProgress(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    if (post && contentRef.current) {
      const contentEl = contentRef.current;
      
      const textContent = contentEl.textContent || "";
      const words = textContent.trim().split(/\s+/).filter(Boolean);
      setWordCount(words.length);

      const linkify = (node: Node) => {
        const urlRegex = /(\bhttps?:\/\/[^\s<>"'()]+)/g;
        if (node.nodeType === Node.TEXT_NODE) {
          if (node.parentNode && node.parentNode.nodeName === 'A') return;
          const text = node.textContent;
          if (text && urlRegex.test(text)) {
            const fragment = document.createDocumentFragment();
            text.split(urlRegex).forEach((part, index) => {
              if (index % 2 === 1) {
                const link = document.createElement('a');
                link.href = part;
                link.textContent = part;
                link.className = 'text-primary underline hover:text-primary/80 break-all';
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                fragment.appendChild(link);
              } else if (part) {
                fragment.appendChild(document.createTextNode(part));
              }
            });
            node.parentNode?.replaceChild(fragment, node);
          }
        } else {
          Array.from(node.childNodes).forEach(linkify);
        }
      };
      linkify(contentEl);

      const headingElements = Array.from(contentEl.querySelectorAll("h1, h2, h3, h4, h5, h6"));
      const extractedHeadings: Heading[] = headingElements.map((heading, index) => {
        const level = parseInt(heading.tagName.substring(1), 10);
        const text = heading.textContent || "";
        const slug = text.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
        const uniqueId = `${slug}-${index}`;
        heading.id = uniqueId;
        return { id: uniqueId, level, text, element: heading };
      });
      setHeadings(extractedHeadings);
    }
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [post?.content]);

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <BlogHeader />
        <main className="container mx-auto max-w-7xl px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Bài viết không tồn tại</h1>
            <Button asChild><Link to="/">Về trang chủ</Link></Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BlogHeader />
      <main className="container mx-auto max-w-7xl px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/" className="flex items-center space-x-2">
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Quay lại trang chủ</span>
          </Link>
        </Button>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 order-2 lg:order-1">
            <article>
              <header className="mb-8">
                <CategoryTag name={post.category} className="mb-4" />
                <h1 className="text-4xl font-bold mb-4 leading-tight">{post.title}</h1>
                <div className="flex items-center space-x-6 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center"><CalendarIcon className="h-4 w-4 mr-2" />Xuất bản: {post.publishedAt}</div>
                  <div className="flex items-center"><ClockIcon className="h-4 w-4 mr-2" />{post.readTime}</div>
                  <div className="flex items-center text-primary"><EditIcon className="h-4 w-4 mr-2" />Cập nhật: {post.updatedAt}</div>
                  <div className="flex items-center"><EyeIcon className="h-4 w-4 mr-2" />{post.views} lượt xem</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Tác giả: <span className="font-medium text-foreground">samfon</span></div>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/edit/${id}`} className="flex items-center space-x-2"><EditIcon className="h-4 w-4" /><span>Chỉnh sửa</span></Link>
                  </Button>
                </div>
              </header>
              <Card className="mb-8">
                <CardContent className="p-8">
                  <div
                    ref={contentRef}
                    className="prose prose-neutral dark:prose-invert max-w-none rich-content text-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                </CardContent>
              </Card>
              {post.updateLogs && post.updateLogs.length > 0 && <UpdateLog updates={post.updateLogs} />}
            </article>
          </div>
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="lg:sticky top-24 space-y-6">
              {headings.length > 0 && <TableOfContents headings={headings} />}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Thống kê & Tiến độ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lượt xem</span>
                    <span className="font-medium">{post.views}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Thời gian đọc</span>
                    <span className="font-medium">{post.readTime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Số từ</span>
                    <span className="font-medium">{wordCount}</span>
                  </div>
                  <div className="pt-2">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Tiến độ đọc</span>
                        <span className="font-medium text-primary">{readingProgress}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${readingProgress}%` }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
