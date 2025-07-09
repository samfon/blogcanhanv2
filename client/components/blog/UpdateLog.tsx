import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, EditIcon } from "lucide-react";

interface UpdateLogEntry {
  id: string;
  date: string;
  version: string;
  changes: string[];
  note?: string;
}

interface UpdateLogProps {
  updates: UpdateLogEntry[];
}

export function UpdateLog({ updates }: UpdateLogProps) {
  if (updates.length === 0) return null;

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-lg">
          <EditIcon className="h-5 w-5 text-primary" />
          <span>Lịch sử cập nhật</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {updates.map((update) => (
          <div
            key={update.id}
            className="border-l-2 border-primary/30 pl-4 relative"
          >
            <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-primary/20 border-2 border-primary/50" />

            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="text-xs">
                  v{update.version}
                </Badge>
                <div className="flex items-center text-xs text-muted-foreground">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {update.date}
                </div>
              </div>
            </div>

            <ul className="space-y-1 mb-3">
              {update.changes.map((change, index) => (
                <li
                  key={index}
                  className="text-sm text-muted-foreground flex items-start"
                >
                  <span className="text-primary mr-2">•</span>
                  {change}
                </li>
              ))}
            </ul>

            {update.note && (
              <div className="bg-accent/30 p-3 rounded-lg border border-border/50">
                <p className="text-sm font-medium text-accent-foreground mb-1">
                  Ghi chú:
                </p>
                <p className="text-sm text-muted-foreground">{update.note}</p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
