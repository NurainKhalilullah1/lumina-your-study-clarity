import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { FileText, Upload, Loader2, Clock, HelpCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { extractTextFromPDF } from "@/utils/pdfUtils";

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

export const QuizSetup = ({
  initialDocumentName,
  initialDocumentContent,
  onStartQuiz,
  isLoading
}: QuizSetupProps) => {
  const [documentName, setDocumentName] = useState(initialDocumentName || "");
  const [documentContent, setDocumentContent] = useState(initialDocumentContent || "");
  const [numQuestions, setNumQuestions] = useState(35);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(25);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      let content = "";
      
      if (file.type === "application/pdf") {
        content = await extractTextFromPDF(file);
      } else if (file.type.startsWith("text/") || file.name.endsWith(".txt")) {
        content = await file.text();
      } else if (file.type.startsWith("image/")) {
        // For images, we'll store a placeholder and handle it differently
        content = `[Image file: ${file.name}]`;
      } else {
        content = await file.text();
      }

      setDocumentName(file.name);
      setDocumentContent(content);
    } catch (error) {
      console.error("Error processing file:", error);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        handleFileUpload({ target: input } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  const canStartQuiz = documentContent.length > 50 && !isLoading && !isProcessingFile;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
          <HelpCircle className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Create Your Quiz</h1>
        <p className="text-muted-foreground">
          Upload a document and customize your quiz settings
        </p>
      </div>

      {/* Document Upload */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Study Material
        </h3>
        
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
            documentContent ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/40"
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
          />
          
          {isProcessingFile ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-muted-foreground">Processing document...</p>
            </div>
          ) : documentContent ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{documentName}</p>
                <p className="text-sm text-muted-foreground">
                  {documentContent.length.toLocaleString()} characters extracted
                </p>
              </div>
              <Button variant="outline" size="sm" className="mt-2">
                Change Document
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Upload className="w-10 h-10 text-muted-foreground" />
              <div>
                <p className="font-medium">Drop a file here or click to browse</p>
                <p className="text-sm text-muted-foreground">
                  Supports PDF, TXT, and text files
                </p>
              </div>
            </div>
          )}
        </div>
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
        onClick={() => onStartQuiz({
          documentName,
          documentContent,
          numQuestions,
          timeLimitMinutes
        })}
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

      {!documentContent && (
        <p className="text-center text-sm text-muted-foreground">
          Upload a document to get started
        </p>
      )}
    </div>
  );
};
