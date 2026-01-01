import { Category } from "../types";
import { supabase } from "../lib/supabaseClient";

export const processVoiceCommand = async (
  audioBase64: string,
  categories: Category[]
): Promise<any[]> => {
  const categoryNames = categories.map(c => c.name);
  const currentDate = new Date().toISOString().split('T')[0];

  try {
    const { data, error } = await supabase.functions.invoke('analyze-finances', {
      body: {
        audioBase64,
        categories: categoryNames,
        currentDate
      }
    });

    if (error) throw error;
    return data.transactions || [];
  } catch (error) {
    console.error("Voice Processing Error:", error);
    throw error;
  }
};
