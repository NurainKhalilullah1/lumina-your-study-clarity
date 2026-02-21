export const UNIVERSITIES = [
  "University of Lagos (UNILAG)",
  "Obafemi Awolowo University (OAU)",
  "University of Ibadan (UI)",
  "Lagos State University (LASU)",
  "Ahmadu Bello University (ABU)",
  "University of Ilorin (UNILORIN)",
  "University of Benin (UNIBEN)",
  "University of Nigeria, Nsukka (UNN)",
  "Federal University of Technology, Minna (FUTMINNA)",
  "Covenant University",
  "Babcock University",
  "University of Port Harcourt (UNIPORT)",
  "Federal University of Technology, Akure (FUTA)",
  "Nnamdi Azikiwe University (UNIZIK)",
  "University of Calabar (UNICAL)",
  "Bayero University, Kano (BUK)",
  "Rivers State University (RSU)",
  "Ladoke Akintola University of Technology (LAUTECH)",
  "Lagos State University of Science and Technology (LASUSTECH)",
  "Yaba College of Technology (YABATECH)",
] as const;

export type University = (typeof UNIVERSITIES)[number] | string;
