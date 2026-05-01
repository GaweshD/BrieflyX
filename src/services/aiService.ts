import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const askAboutNews = async (articleTitle: string, articleContent: string, question: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: question,
      config: {
        systemInstruction: `You are a helpful news assistant for the BrieflyX platform. 
        Your task is to answer user questions about the following news article:
        
        TITLE: ${articleTitle}
        CONTENT: ${articleContent}
        
        RULES:
        1. Only answer questions directly related to this article or its context.
        2. If a question is not related to the article, politely inform the user that you can only discuss the current article.
        3. Be concise and maintain a futuristic, minimalist tone consistent with BrieflyX.
        4. If you don't know the answer based on the provided text, say so gracefully.`,
      },
    });

    return response.text || "I'm sorry, I couldn't process that signal.";
  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
};
