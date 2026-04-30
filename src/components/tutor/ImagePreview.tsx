import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface ImagePreviewProps {
  src: string;
  alt?: string;
  className?: string;
}

export const ImagePreview = ({ src, alt = "Image", className }: ImagePreviewProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={className}
        onClick={() => setIsOpen(true)}
        style={{ cursor: 'pointer' }}
      />
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
