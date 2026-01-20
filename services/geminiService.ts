
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedFile, ProjectAudit } from "../types";

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface EnhancedResponse<T> {
  data: T;
  sources: GroundingSource[];
}

export class GeminiCoderService {
  private ai: GoogleGenAI | null = null;
  public isDemoMode: boolean = false;

  constructor() {
    const apiKey = process.env.API_KEY;
    if (apiKey && apiKey !== 'undefined' && apiKey.length > 10) {
      this.ai = new GoogleGenAI({ apiKey });
      this.isDemoMode = false;
    } else {
      this.isDemoMode = true;
    }
  }

  private extractSources(response: any): GroundingSource[] {
    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri
          });
        }
      });
    }
    return sources;
  }

  async generateProjectStructure(prompt: string): Promise<EnhancedResponse<any>> {
    if (this.isDemoMode || !this.ai) {
      return { data: this.getMockStructure(prompt), sources: [] };
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `
          Sen dünyanın en kıdemli yazılım mimarısın. İnterneti kullanarak şu anki en güncel, en güvenli ve en performanslı kütüphaneleri araştır.
          Kullanıcı isteği: "${prompt}"
          
          Bu istek için modern bir proje yapısı oluştur.
          Çıktı JSON formatında olmalı:
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
          tools: [{ googleSearch: {} }],
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
      
      return {
        data: JSON.parse(response.text),
        sources: this.extractSources(response)
      };
    } catch (e) {
      console.warn("API Error, switching to mock:", e);
      return { data: this.getMockStructure(prompt), sources: [] };
    }
  }

  async generateFileContent(prompt: string, fileName: string, context: string): Promise<EnhancedResponse<string>> {
    if (this.isDemoMode || !this.ai) {
      return { data: this.getMockFileContent(fileName), sources: [] };
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `
          Dosya: "${fileName}"
          Proje bağlamı: ${prompt}
          Mimar: ${context}
          
          Lütfen internetteki en güncel dökümantasyonları ve best-practice'leri araştırarak bu dosyanın içeriğini en profesyonel şekilde yaz.
          Sadece ham kod döndür.
        `,
        config: {
          thinkingConfig: { thinkingBudget: 10000 },
          tools: [{ googleSearch: {} }]
        }
      });
      
      return {
        data: response.text || '// Hata oluştu',
        sources: this.extractSources(response)
      };
    } catch (e) {
      return { data: this.getMockFileContent(fileName), sources: [] };
    }
  }

  async selfImprove(code: string, originalGoal: string): Promise<string> {
    if (this.isDemoMode || !this.ai) return code + "\n\n// EvoCoder AI tarafından optimize edildi (Demo)";

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `
          Kodu internetteki en son güvenlik standartlarına göre optimize et:
          ${code}
          Orijinal Hedef: ${originalGoal}
        `,
        config: {
          thinkingConfig: { thinkingBudget: 15000 },
          tools: [{ googleSearch: {} }]
        }
      });
      return response.text || code;
    } catch (e) {
      return code;
    }
  }

  async getAutocomplete(currentCode: string, cursorContext: string): Promise<string> {
    if (this.isDemoMode || !this.ai) return "  // Autocomplete simülasyonu";

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Kodun devamını en mantıklı ve modern şekilde tamamla:\n${currentCode}\nBağlam: ${cursorContext}`,
      });
      return response.text || '';
    } catch (e) {
      return "";
    }
  }

  async evolveSystem(request: string): Promise<string> {
    if (this.isDemoMode || !this.ai) return "// Sistem evrimi demo modunda simüle edildi.";

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `EvoCoder AI sistemini şu yönde geliştir: "${request}". İnternetteki en modern AI mimarilerini araştır.`,
        config: { 
          thinkingConfig: { thinkingBudget: 20000 },
          tools: [{ googleSearch: {} }]
        }
      });
      return response.text || '';
    } catch (e) {
      return "// Evrim başarısız.";
    }
  }

  async generateLiveComponent(request: string): Promise<string> {
    if (this.isDemoMode || !this.ai) {
      return `<div style="background:#1e293b; color:white; padding:20px; border-radius:10px; border:1px solid #334155; text-align:center;">
        <h2 style="color:#38bdf8;">Demo Bileşen</h2>
        <p>İsteğiniz: ${request}</p>
      </div>`;
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Modern Tailwind CSS bileşeni oluştur: "${request}"`,
      });
      return response.text || '<div>Hata</div>';
    } catch (e) {
      return "<div>Hata</div>";
    }
  }

  async generateTests(code: string, fileName: string) {
    if (this.isDemoMode || !this.ai) {
      return { tests: [{ name: "Demo Test", description: "Otomatik test", expected: "Ok" }] };
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Bu kod için test senaryoları oluştur: ${fileName}`,
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
    } catch (e) {
      return { tests: [] };
    }
  }

  async performAudit(files: GeneratedFile[]): Promise<ProjectAudit> {
    if (this.isDemoMode || !this.ai) {
      return { score: 85, summary: "Demo Analizi", issues: [] };
    }

    try {
      const context = files.map(f => `File: ${f.path}\nContent:\n${f.content}`).join('\n---\n');
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Projeyi internetteki en güncel güvenlik açıklarını (CVE) araştırarak denetle: ${context}`,
        config: {
          thinkingConfig: { thinkingBudget: 15000 },
          tools: [{ googleSearch: {} }],
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
    } catch (e) {
      return { score: 0, summary: "Hata", issues: [] };
    }
  }

  private getMockStructure(prompt: string) {
    return {
      projectName: "Demo Proje",
      files: [
        { path: "src/index.ts", purpose: "Giriş" },
        { path: "src/app.ts", purpose: "Mantık" }
      ]
    };
  }

  private getMockFileContent(fileName: string): string {
    return `// Demo içeriği: ${fileName}`;
  }
}
