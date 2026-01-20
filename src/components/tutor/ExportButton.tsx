import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, File } from "lucide-react";
import { exportAsText, exportAsPDF } from "@/utils/exportUtils";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachment_name?: string;
}

interface ExportButtonProps {
  messages: Message[];
  title?: string;
}

export const ExportButton = ({ messages, title = 'StudyFlow Chat' }: ExportButtonProps) => {
  if (messages.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Download className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportAsPDF(messages, title)}>
          <File className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportAsText(messages, title)}>
          <FileText className="mr-2 h-4 w-4" />
          Export as Text
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
