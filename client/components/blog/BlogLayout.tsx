import { BlogHeader } from "./BlogHeader";

interface BlogLayoutProps {
  children: React.ReactNode;
}

export function BlogLayout({ children }: BlogLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <BlogHeader />
      {children}
    </div>
  );
}
