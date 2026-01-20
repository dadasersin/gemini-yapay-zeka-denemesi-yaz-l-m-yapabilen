
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedFile, ProjectAudit } from "../types";

export class GeminiCoderService {
  private ai: GoogleGenAI;

  constructor() {
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

  async getAutocomplete(currentCode: string, cursorContext: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Aşağıdaki kodun devamı için en mantıklı kod bloğunu öner. 
        Mevcut Kod:
        ${currentCode}
        
        Bağlam: ${cursorContext}
        Sadece devam kodunu döndür, açıklama yapma.
      `,
    });
    return response.text || '';
  }

  async evolveSystem(request: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
        Sen EvoCoder AI'nın çekirdek zekasısın. Kullanıcı senden mevcut yeteneklerini güncellemeni veya yeni bir özellik eklemeni istiyor.
        Kullanıcı İsteği: "${request}"
        
        Mevcut App.tsx ve geminiService.ts mantığını bildiğini varsayarak, bu özelliği gerçekleştirecek YENİ kod bloğunu veya güncellenmiş mantığı döndür.
      `,
      config: { thinkingConfig: { thinkingBudget: 20000 } }
    });
    return response.text || '';
  }

  async generateLiveComponent(request: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Kullanıcı için şu özelliği içeren bir 'Canlı Bileşen' (Live Component) oluştur: "${request}"
        Sadece Tailwind CSS ve Vanilla JS kullanarak tek bir HTML dosyası (inline CSS/JS) döndür.
        Tasarım modern, karanlık tema ve şık olmalı.
      `,
    });
    return response.text || '<div>Hata oluştu</div>';
  }

  async generateTests(code: string, fileName: string) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Aşağıdaki kod için 3-5 adet kritik test senaryosu oluştur.
        Dosya: ${fileName}
        Kod:
        ${code}
        
        JSON formatında döndür:
        {
          "tests": [
            { "name": "...", "description": "...", "expected": "..." }
          ]
        }
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tests: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  expected: { type: Type.STRING }
                },
                required: ["name", "description", "expected"]
              }
            }
          },
          required: ["tests"]
        }
      }
    });

    return JSON.parse(response.text);
  }

  async performAudit(files: GeneratedFile[]): Promise<ProjectAudit> {
    const context = files.map(f => `File: ${f.path}\nContent:\n${f.content}`).join('\n---\n');
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
        Tüm projeyi güvenlik, performans ve en iyi uygulamalar açısından denetle.
        Kodları analiz et ve bulgularını JSON formatında döndür.
        
        JSON Şeması:
        {
          "score": 0-100 arası bir puan,
          "summary": "Genel analiz özeti",
          "issues": [
            {
              "id": "benzersiz-id",
              "severity": "critical" | "warning" | "info",
              "category": "security" | "performance" | "best-practice",
              "title": "Kısa başlık",
              "description": "Detaylı açıklama",
              "suggestion": "Nasıl düzeltilir?"
            }
          ]
        }
      `,
      config: {
        thinkingConfig: { thinkingBudget: 15000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            issues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  category: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  suggestion: { type: Type.STRING }
                },
                required: ["id", "severity", "category", "title", "description", "suggestion"]
              }
            }
          },
          required: ["score", "summary", "issues"]
        }
      }
    });

    return JSON.parse(response.text);
  }
}
