import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryTag } from "./CategoryTag";
import { CalendarIcon, ClockIcon, EditIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface PostCardProps {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readTime: string;
  updateCount?: number;
  lastUpdated?: string;
}

export function PostCard({
  id,
  title,
  excerpt,
  category,
  publishedAt,
  readTime,
  updateCount = 0,
  lastUpdated,
}: PostCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CategoryTag name={category} />
            <CardTitle className="mt-3 mb-2 group-hover:text-primary transition-colors">
              <Link to={`/post/${id}`} className="hover:underline">
                {title}
              </Link>
            </CardTitle>
          </div>
          {updateCount > 0 && (
            <div className="flex items-center text-xs text-muted-foreground bg-accent/50 px-2 py-1 rounded-full">
              <EditIcon className="h-3 w-3 mr-1" />
              {updateCount} cập nhật
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
          {excerpt.length > 150 ? excerpt.substring(0, 150) + "..." : excerpt}
        </p>
        <div className="flex items-center text-xs text-muted-foreground space-x-4">
          <div className="flex items-center">
            <CalendarIcon className="h-3 w-3 mr-1" />
            {publishedAt}
          </div>
          <div className="flex items-center">
            <ClockIcon className="h-3 w-3 mr-1" />
            {readTime}
          </div>
          {lastUpdated && (
            <div className="flex items-center text-primary/70">
              <EditIcon className="h-3 w-3 mr-1" />
              Cập nhật: {lastUpdated}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
