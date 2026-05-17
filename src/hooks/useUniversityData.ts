import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import universitiesData from "@/lib/universities.json";

export const useUniversityData = () => {
  const universities = universitiesData.map((d: any) => d.name);
  const loadingUniversities = false;

  const { data: courses, isLoading: loadingCourses } = useQuery({
    queryKey: ["university-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("university_courses")
        .select("name")
        .order("name");
      if (error) throw error;
      return data.map((d) => d.name);
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  return {
    universities: universities || [],
    courses: courses || [],
    loadingUniversities,
    loadingCourses,
  };
};
