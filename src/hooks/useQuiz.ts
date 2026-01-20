import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useToast } from "@/hooks/use-toast";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

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
    queryKey: ['quiz-session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const { data, error } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      if (error) throw error;
      return data as QuizSession;
    },
    enabled: !!sessionId,
  });
};

// Fetch questions for a quiz session
export const useQuizQuestions = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['quiz-questions', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_session_id', sessionId)
        .order('question_number', { ascending: true });
      if (error) throw error;
      return data.map(q => ({
        ...q,
        options: q.options as string[]
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
      timeLimitMinutes
    }: {
      userId: string;
      documentName?: string;
      documentContent?: string;
      numQuestions: number;
      timeLimitMinutes: number;
    }) => {
      const { data, error } = await supabase
        .from('quiz_sessions')
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
      queryClient.invalidateQueries({ queryKey: ['quiz-sessions'] });
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
      numQuestions
    }: {
      sessionId: string;
      documentContent: string;
      numQuestions: number;
    }) => {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });
      
      const prompt = `You are an expert quiz generator. Generate exactly ${numQuestions} multiple choice questions based on the following document content.

IMPORTANT RULES:
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

Generate exactly ${numQuestions} questions. Return ONLY the JSON array, nothing else.`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Extract JSON from response (handle potential markdown code blocks)
      let jsonStr = responseText.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();
      
      const questions = JSON.parse(jsonStr);
      
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("Invalid response format from AI");
      }
      
      // Insert questions into database
      const questionsToInsert = questions.slice(0, numQuestions).map((q: any, idx: number) => ({
        quiz_session_id: sessionId,
        question_number: idx + 1,
        question: q.question,
        options: q.options,
        correct_answer: q.correct,
        is_flagged: false
      }));
      
      const { error } = await supabase
        .from('quiz_questions')
        .insert(questionsToInsert);
      
      if (error) throw error;
      
      // Update session with total questions and start time
      await supabase
        .from('quiz_sessions')
        .update({
          total_questions: questionsToInsert.length,
          started_at: new Date().toISOString()
        })
        .eq('id', sessionId);
      
      return questionsToInsert.length;
    },
    onError: (error) => {
      console.error("Quiz generation error:", error);
      toast({
        title: "Failed to generate quiz",
        description: "There was an error generating the quiz questions. Please try again.",
        variant: "destructive"
      });
    }
  });
};

// Save an answer to a question
export const useSaveQuizAnswer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      questionId,
      answer,
      isFlagged
    }: {
      questionId: string;
      answer?: string;
      isFlagged?: boolean;
    }) => {
      const updateData: Record<string, any> = {};
      if (answer !== undefined) updateData.user_answer = answer;
      if (isFlagged !== undefined) updateData.is_flagged = isFlagged;
      
      const { error } = await supabase
        .from('quiz_questions')
        .update(updateData)
        .eq('id', questionId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-questions'] });
    }
  });
};

// Submit quiz and calculate score
export const useSubmitQuiz = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionId: string) => {
      // Get all questions for this session
      const { data: questions, error: fetchError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_session_id', sessionId);
      
      if (fetchError) throw fetchError;
      
      // Calculate score
      let correct = 0;
      questions?.forEach(q => {
        if (q.user_answer === q.correct_answer) {
          correct++;
        }
      });
      
      // Update session with score and completion time
      const { error: updateError } = await supabase
        .from('quiz_sessions')
        .update({
          score: correct,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);
      
      if (updateError) throw updateError;
      
      return {
        score: correct,
        total: questions?.length || 0
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-session'] });
      queryClient.invalidateQueries({ queryKey: ['quiz-questions'] });
    }
  });
};

// Hook to manage quiz timer
export const useQuizTimer = (
  timeLimitMinutes: number,
  isActive: boolean,
  onTimeUp: () => void
) => {
  const [timeRemaining, setTimeRemaining] = useState(timeLimitMinutes * 60);
  
  useState(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  });
  
  return {
    timeRemaining,
    minutes: Math.floor(timeRemaining / 60),
    seconds: timeRemaining % 60,
    formattedTime: `${Math.floor(timeRemaining / 60).toString().padStart(2, '0')}:${(timeRemaining % 60).toString().padStart(2, '0')}`
  };
};
