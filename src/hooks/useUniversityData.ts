import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUniversityData = () => {
  const { data: universities, isLoading: loadingUniversities } = useQuery({
    queryKey: ["nigerian-universities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nigerian_universities")
        .select("name")
        .order("name");
      if (error) throw error;
      return data.map((d) => d.name);
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

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
