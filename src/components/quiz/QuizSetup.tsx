import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { FileText, Upload, Loader2, Clock, HelpCircle, Sparkles, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { extractTextFromPDF } from "@/utils/pdfUtils";
import { useToast } from "@/hooks/use-toast";

interface UploadedDocument {
  name: string;
  content: string;
  size: number;
}

interface QuizSetupProps {
  initialDocumentName?: string;
  initialDocumentContent?: string;
  onStartQuiz: (settings: {
    documentName: string;
    documentContent: string;
    numQuestions: number;
    timeLimitMinutes: number;
  }) => void;
  isLoading: boolean;
}

const MAX_DOCUMENTS = 3;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const QuizSetup = ({
  initialDocumentName,
  initialDocumentContent,
  onStartQuiz,
  isLoading
}: QuizSetupProps) => {
  const [documents, setDocuments] = useState<UploadedDocument[]>(() => {
    if (initialDocumentName && initialDocumentContent) {
      return [{ name: initialDocumentName, content: initialDocumentContent, size: initialDocumentContent.length }];
    }
    return [];
  });
  const [numQuestions, setNumQuestions] = useState(35);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(25);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const totalContent = documents.reduce((acc, doc) => acc + doc.content, "");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if adding these files would exceed the max
    const remainingSlots = MAX_DOCUMENTS - documents.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Maximum documents reached",
        description: `You can only upload up to ${MAX_DOCUMENTS} documents.`,
        variant: "destructive",
      });
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    
    setIsProcessingFile(true);
    try {
      const newDocuments: UploadedDocument[] = [];

      for (const file of filesToProcess) {
        // Check file size
        if (file.size > MAX_FILE_SIZE_BYTES) {
          toast({
            title: "File too large",
            description: `"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit.`,
            variant: "destructive",
          });
          continue;
        }

        // Check for duplicate file names
        if (documents.some(doc => doc.name === file.name) || newDocuments.some(doc => doc.name === file.name)) {
          toast({
            title: "Duplicate file",
            description: `"${file.name}" has already been added.`,
            variant: "destructive",
          });
          continue;
        }

        let content = "";
        
        if (file.type === "application/pdf") {
          content = await extractTextFromPDF(file);
        } else if (file.type.startsWith("text/") || file.name.endsWith(".txt")) {
          content = await file.text();
        } else if (file.type.startsWith("image/")) {
          content = `[Image file: ${file.name}]`;
        } else {
          content = await file.text();
        }

        newDocuments.push({
          name: file.name,
          content,
          size: file.size,
        });
      }

      if (newDocuments.length > 0) {
        setDocuments(prev => [...prev, ...newDocuments]);
        toast({
          title: "Documents added",
          description: `Added ${newDocuments.length} document${newDocuments.length > 1 ? 's' : ''}.`,
        });
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Error processing file",
        description: "There was an error reading the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingFile(false);
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        Array.from(files).forEach(file => dataTransfer.items.add(file));
        input.files = dataTransfer.files;
        handleFileUpload({ target: input } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const canStartQuiz = totalContent.length > 50 && !isLoading && !isProcessingFile;

  const handleStartQuiz = () => {
    const combinedName = documents.map(d => d.name).join(", ");
    const combinedContent = documents.map(d => `--- Document: ${d.name} ---\n${d.content}`).join("\n\n");
    
    onStartQuiz({
      documentName: combinedName,
      documentContent: combinedContent,
      numQuestions,
      timeLimitMinutes
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
          <HelpCircle className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Create Your Quiz</h1>
        <p className="text-muted-foreground">
          Upload up to {MAX_DOCUMENTS} documents and customize your quiz settings
        </p>
      </div>

      {/* Document Upload */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Study Materials
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            {documents.length}/{MAX_DOCUMENTS} documents
          </span>
        </h3>

        {/* Uploaded Documents List */}
        {documents.length > 0 && (
          <div className="space-y-2 mb-4">
            {documents.map((doc, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(doc.size)} • {doc.content.length.toLocaleString()} characters
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveDocument(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Area */}
        {documents.length < MAX_DOCUMENTS && (
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer",
              "border-border hover:border-primary/40"
            )}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <Input
              type="file"
              accept=".pdf,.txt,.md,.doc,.docx"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
            />
            
            {isProcessingFile ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-muted-foreground">Processing document...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {documents.length === 0 ? "Drop files here or click to browse" : "Add more documents"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PDF, TXT, text files • Max {MAX_FILE_SIZE_MB}MB each
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {documents.length >= MAX_DOCUMENTS && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <AlertCircle className="w-4 h-4" />
            Maximum {MAX_DOCUMENTS} documents reached. Remove one to add another.
          </div>
        )}
      </Card>

      {/* Quiz Settings */}
      <Card className="p-6 space-y-6">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          Quiz Settings
        </h3>

        {/* Number of Questions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Number of Questions</label>
            <span className="text-sm font-bold text-primary">{numQuestions}</span>
          </div>
          <Slider
            value={[numQuestions]}
            onValueChange={([val]) => setNumQuestions(val)}
            min={10}
            max={70}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>10</span>
            <span>70 (max)</span>
          </div>
        </div>

        {/* Time Limit */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time Limit
            </label>
            <span className="text-sm font-bold text-primary">{timeLimitMinutes} min</span>
          </div>
          <Slider
            value={[timeLimitMinutes]}
            onValueChange={([val]) => setTimeLimitMinutes(val)}
            min={5}
            max={120}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5 min</span>
            <span>120 min (max)</span>
          </div>
        </div>
      </Card>

      {/* Start Button */}
      <Button
        size="lg"
        className="w-full gradient-primary text-primary-foreground h-14 text-lg font-semibold"
        disabled={!canStartQuiz}
        onClick={handleStartQuiz}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Generating Quiz...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Generate & Start Quiz
          </>
        )}
      </Button>

      {documents.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Upload at least one document to get started
        </p>
      )}
    </div>
  );
};
