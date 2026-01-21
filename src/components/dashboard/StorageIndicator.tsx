import { useAuth } from "@/contexts/AuthContext";
import { useStorageQuota, formatBytes } from "@/hooks/useStorageQuota";
import { Progress } from "@/components/ui/progress";
import { HardDrive } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const StorageIndicator = () => {
  const { user } = useAuth();
  const { data: quota, isLoading } = useStorageQuota(user?.id);
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  if (isLoading || !quota) {
    return null;
  }

  const getProgressColor = () => {
    if (quota.isAtLimit) return "bg-destructive";
    if (quota.isNearLimit) return "bg-warning";
    return "bg-primary";
  };

  const getTextColor = () => {
    if (quota.isAtLimit) return "text-destructive";
    if (quota.isNearLimit) return "text-warning";
    return "";
  };

  const usedFormatted = formatBytes(quota.used);
  const limitFormatted = formatBytes(quota.limit);

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex justify-center py-2">
              <div className={cn("p-2 rounded-md", getTextColor())}>
                <HardDrive className="w-5 h-5" />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{usedFormatted} / {limitFormatted}</p>
            <p className="text-xs text-muted-foreground">{quota.percentage}% used</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <HardDrive className="w-4 h-4" />
        <span>Storage</span>
      </div>
      <Progress 
        value={quota.percentage} 
        className="h-2"
        indicatorClassName={getProgressColor()}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{usedFormatted} / {limitFormatted}</span>
        <span>{quota.percentage}%</span>
      </div>
      {quota.isAtLimit && (
        <p className="text-xs text-destructive">Storage full</p>
      )}
      {quota.isNearLimit && !quota.isAtLimit && (
        <p className="text-xs text-warning">Running low on space</p>
      )}
    </div>
  );
};

export default StorageIndicator;
