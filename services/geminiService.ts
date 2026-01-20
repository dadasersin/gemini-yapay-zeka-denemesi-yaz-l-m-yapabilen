
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedFile } from "../types";

export class GeminiCoderService {
  private ai: GoogleGenAI;

  constructor() {
    // API_KEY is provided by the environment
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async generateProjectStructure(prompt: string) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
        Sen dünyanın en kıdemli yazılım mimarısın. 
        Kullanıcı isteği: "${prompt}"
        
        Bu istek için modern, ölçeklenebilir bir proje yapısı oluştur.
        Çıktı JSON formatında olmalı ve şu yapıda olmalı:
        {
          "projectName": "...",
          "files": [
            {"path": "src/main.ts", "purpose": "Entry point"},
            ...
          ]
        }
      `,
      config: {
        thinkingConfig: { thinkingBudget: 15000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            projectName: { type: Type.STRING },
            files: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  path: { type: Type.STRING },
                  purpose: { type: Type.STRING }
                },
                required: ["path", "purpose"]
              }
            }
          },
          required: ["projectName", "files"]
        }
      }
    });

    return JSON.parse(response.text);
  }

  async generateFileContent(prompt: string, fileName: string, context: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
        Sen uzman bir yazılımcısın. Şu dosyanın kodunu yaz: "${fileName}"
        Proje bağlamı: ${prompt}
        Tüm proje yapısı: ${context}
        
        Sadece kodu döndür. Markdown kod blokları içine ALMA. Sadece ham kod metni.
      `,
      config: {
        thinkingConfig: { thinkingBudget: 10000 }
      }
    });

    return response.text || '// Error generating code';
  }

  async selfImprove(code: string, originalGoal: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
        Aşağıdaki kodu incele ve kendi kendini geliştir/optimize et. 
        Hataları düzelt, performansı artır ve temiz kod prensiplerine uyun.
        Orijinal Hedef: ${originalGoal}
        
        Kod:
        ${code}
        
        Sadece geliştirilmiş kodu döndür.
      `,
      config: {
        thinkingConfig: { thinkingBudget: 15000 }
      }
    });

    return response.text || code;
  }
}
