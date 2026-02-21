import { useUserGroup } from "@/hooks/useCommunity";
import { Users, GraduationCap } from "lucide-react";

const GroupInfo = () => {
  const { data: group, isLoading } = useUserGroup();

  if (isLoading) return null;

  if (!group) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 text-center">
        <GraduationCap className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Set your university and course in{" "}
          <a href="/settings" className="text-primary underline">Settings</a>{" "}
          to join a study group.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <GraduationCap className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">My Study Group</h3>
      </div>
      <p className="text-sm text-foreground">{group.university}</p>
      <p className="text-xs text-muted-foreground">{group.course_of_study}</p>
      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
        <Users className="w-3 h-3" />
        {group.member_count} member{group.member_count !== 1 ? "s" : ""}
      </div>
    </div>
  );
};

export default GroupInfo;
