import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useToast } from "@/hooks/use-toast";

export interface QuizQuestion {
  id?: string;
  quiz_session_id?: string;
  question_number: number;
  question: string;
  options: string[];
  correct_answer: string;
  user_answer?: string | null;
  is_flagged: boolean;
}

export interface QuizSession {
  id: string;
  user_id: string;
  document_name: string | null;
  document_content: string | null;
  num_questions: number;
  time_limit_minutes: number;
  score: number | null;
  total_questions: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

// Fetch a quiz session by ID
export const useQuizSession = (sessionId: string | null) => {
  return useQuery({
    queryKey: ["quiz-session", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const { data, error } = await supabase.from("quiz_sessions").select("*").eq("id", sessionId).single();
      if (error) throw error;
      return data as QuizSession;
    },
    enabled: !!sessionId,
  });
};

// Fetch questions for a quiz session
export const useQuizQuestions = (sessionId: string | null) => {
  return useQuery({
    queryKey: ["quiz-questions", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_session_id", sessionId)
        .order("question_number", { ascending: true });
      if (error) throw error;
      return data.map((q) => ({
        ...q,
        options: q.options as string[],
      })) as QuizQuestion[];
    },
    enabled: !!sessionId,
  });
};

// Create a new quiz session
export const useCreateQuizSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      documentName,
      documentContent,
      numQuestions,
      timeLimitMinutes,
    }: {
      userId: string;
      documentName?: string;
      documentContent?: string;
      numQuestions: number;
      timeLimitMinutes: number;
    }) => {
      const { data, error } = await supabase
        .from("quiz_sessions")
        .insert({
          user_id: userId,
          document_name: documentName || null,
          document_content: documentContent || null,
          num_questions: numQuestions,
          time_limit_minutes: timeLimitMinutes,
        })
        .select()
        .single();
      if (error) throw error;
      return data as QuizSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-sessions"] });
    },
  });
};

// Generate quiz questions using AI
export const useGenerateQuizQuestions = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      sessionId,
      documentContent,
      numQuestions,
    }: {
      sessionId: string;
      documentContent: string;
      numQuestions: number;
    }) => {
      // Check if API key is configured
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your environment.");
      }

      const genAIInstance = new GoogleGenerativeAI(apiKey);
      const model = genAIInstance.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Allow up to 70 questions as per UI slider
      const questionsToGenerate = Math.min(numQuestions, 70);

      const prompt = `You are an expert quiz generator. Generate exactly ${questionsToGenerate} multiple choice questions.

CRITICAL MULTI-DOCUMENT INSTRUCTIONS:
1. The content below may contain MULTIPLE DOCUMENTS separated by "--- Document: [name] ---"
2. You MUST draw questions from ALL documents provided, distributing them as evenly as possible
3. For example: with 3 documents and 30 questions, aim for ~10 questions from each document
4. SHUFFLE the final question order so questions from different documents are mixed together
5. Do NOT cluster all questions from one document together

QUESTION FORMAT RULES:
1. Each question must have exactly 4 options labeled A, B, C, D
2. Questions should test understanding, not just memorization
3. Mix difficulty levels (easy, medium, hard)
4. Ensure only ONE correct answer per question
5. Make wrong answers plausible but clearly incorrect

Document content:
${documentContent.slice(0, 50000)}

Return your response as a valid JSON array with this exact format (no markdown, no code blocks, just pure JSON):
[
  {
    "question": "The question text here?",
    "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
    "correct": "A"
  }
]

Generate exactly ${questionsToGenerate} questions distributed across ALL documents. SHUFFLE the order. Return ONLY the JSON array, nothing else.`;

      console.log("Starting quiz generation for", questionsToGenerate, "questions");

      let result;
      try {
        result = await model.generateContent(prompt);
      } catch (apiError: any) {
        console.error("Gemini API error:", apiError);
        if (apiError.message?.includes("API_KEY")) {
          throw new Error("Invalid Gemini API key. Please check your VITE_GEMINI_API_KEY.");
        }
        if (apiError.message?.includes("quota") || apiError.message?.includes("429")) {
          throw new Error("API quota exceeded. Please try again later.");
        }
        throw new Error(`AI service error: ${apiError.message || "Unknown error"}`);
      }

      const responseText = result.response.text();
      console.log("Received response, length:", responseText.length);

      // Extract JSON from response (handle potential markdown code blocks)
      let jsonStr = responseText.trim();
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();

      let questions;
      try {
        questions = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error("JSON parse error. Response was:", jsonStr.slice(0, 500));
        throw new Error("Failed to parse quiz questions. The AI returned an invalid format.");
      }

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("No questions were generated. Please try with different content.");
      }

      // Validate question count and warn if different from requested
      if (questions.length < numQuestions) {
        console.warn(`Requested ${numQuestions} questions but AI generated ${questions.length}`);
      }
      console.log(`Generated ${questions.length} questions (requested: ${numQuestions})`);

      // Insert questions into database
      const questionsToInsert = questions.slice(0, numQuestions).map((q: any, idx: number) => ({
        quiz_session_id: sessionId,
        question_number: idx + 1,
        question: q.question,
        options: q.options,
        correct_answer: q.correct,
        is_flagged: false,
      }));

      const { error } = await supabase.from("quiz_questions").insert(questionsToInsert);

      if (error) {
        console.error("Database insert error:", error);
        throw new Error("Failed to save questions to database.");
      }

      // Update session with total questions and start time
      await supabase
        .from("quiz_sessions")
        .update({
          total_questions: questionsToInsert.length,
          started_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      return questionsToInsert.length;
    },
    onError: (error: Error) => {
      console.error("Quiz generation error:", error);
      toast({
        title: "Failed to generate quiz",
        description: error.message || "There was an error generating the quiz questions. Please try again.",
        variant: "destructive",
      });
    },
  });
};

// Save an answer to a question
export const useSaveQuizAnswer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      questionId,
      answer,
      isFlagged,
    }: {
      questionId: string;
      answer?: string;
      isFlagged?: boolean;
    }) => {
      const updateData: Record<string, any> = {};
      if (answer !== undefined) updateData.user_answer = answer;
      if (isFlagged !== undefined) updateData.is_flagged = isFlagged;

      const { error } = await supabase.from("quiz_questions").update(updateData).eq("id", questionId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quiz-questions"] });
    },
  });
};

// Submit quiz and calculate score
export const useSubmitQuiz = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      // Get all questions for this session
      const { data: questions, error: fetchError } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_session_id", sessionId);

      if (fetchError) throw fetchError;

      // Calculate score
      let correct = 0;
      questions?.forEach((q) => {
        if (q.user_answer === q.correct_answer) {
          correct++;
        }
      });

      // Update session with score and completion time
      const { error: updateError } = await supabase
        .from("quiz_sessions")
        .update({
          score: correct,
          completed_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (updateError) throw updateError;

      return {
        score: correct,
        total: questions?.length || 0,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-session"] });
      queryClient.invalidateQueries({ queryKey: ["quiz-questions"] });
      queryClient.invalidateQueries({ queryKey: ["goal-progress"] });
      queryClient.invalidateQueries({ queryKey: ["gamification-quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["gamification-questions"] });
    },
  });
};

// Fetch quiz history for a user
export const useQuizHistory = (userId: string | null) => {
  return useQuery({
    queryKey: ["quiz-history", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("quiz_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as QuizSession[];
    },
    enabled: !!userId,
  });
};

// Delete a quiz session and its questions
export const useDeleteQuizSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      // Delete questions first
      const { error: questionsError } = await supabase
        .from("quiz_questions")
        .delete()
        .eq("quiz_session_id", sessionId);

      if (questionsError) throw questionsError;

      // Then delete the session
      const { error: sessionError } = await supabase
        .from("quiz_sessions")
        .delete()
        .eq("id", sessionId);

      if (sessionError) throw sessionError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-history"] });
      queryClient.invalidateQueries({ queryKey: ["quiz-sessions"] });
    },
  });
};

// Hook to manage quiz timer
export const useQuizTimer = (timeLimitMinutes: number, isActive: boolean, onTimeUp: () => void) => {
  const [timeRemaining, setTimeRemaining] = useState(timeLimitMinutes * 60);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, onTimeUp]);

  return {
    timeRemaining,
    minutes: Math.floor(timeRemaining / 60),
    seconds: timeRemaining % 60,
    formattedTime: `${Math.floor(timeRemaining / 60)
      .toString()
      .padStart(2, "0")}:${(timeRemaining % 60).toString().padStart(2, "0")}`,
  };
};
