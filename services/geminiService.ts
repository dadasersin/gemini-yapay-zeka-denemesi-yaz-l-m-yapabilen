
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedFile, ProjectAudit } from "../types";

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

  async generateProjectStructure(prompt: string) {
    if (this.isDemoMode || !this.ai) {
      return this.getMockStructure(prompt);
    }

    try {
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
    } catch (e) {
      console.warn("API Error, switching to mock:", e);
      this.isDemoMode = true;
      return this.getMockStructure(prompt);
    }
  }

  async generateFileContent(prompt: string, fileName: string, context: string): Promise<string> {
    if (this.isDemoMode || !this.ai) {
      return this.getMockFileContent(fileName);
    }

    try {
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
    } catch (e) {
      return this.getMockFileContent(fileName);
    }
  }

  async selfImprove(code: string, originalGoal: string): Promise<string> {
    if (this.isDemoMode || !this.ai) return code + "\n\n// Optimized by EvoCoder AI (Demo Mode)";

    try {
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
    } catch (e) {
      return code;
    }
  }

  async getAutocomplete(currentCode: string, cursorContext: string): Promise<string> {
    if (this.isDemoMode || !this.ai) return "  console.log('EvoCoder autocomplete simulation');";

    try {
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
    } catch (e) {
      return "";
    }
  }

  async evolveSystem(request: string): Promise<string> {
    if (this.isDemoMode || !this.ai) return "// System evolution simulated in demo mode.";

    try {
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
    } catch (e) {
      return "// Evolution failed.";
    }
  }

  async generateLiveComponent(request: string): Promise<string> {
    if (this.isDemoMode || !this.ai) {
      return `<div style="background:#1e293b; color:white; padding:20px; border-radius:10px; border:1px solid #334155; text-align:center;">
        <h2 style="color:#38bdf8;">Demo Bileşen</h2>
        <p>İsteğiniz: ${request}</p>
        <button style="background:#38bdf8; border:none; color:#0f172a; padding:10px 20px; border-radius:5px; cursor:pointer; font-weight:bold;">Tıkla</button>
      </div>`;
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `
          Kullanıcı için şu özelliği içeren bir 'Canlı Bileşen' (Live Component) oluştur: "${request}"
          Sadece Tailwind CSS ve Vanilla JS kullanarak tek bir HTML dosyası (inline CSS/JS) döndür.
          Tasarım modern, karanlık tema ve şık olmalı.
        `,
      });
      return response.text || '<div>Hata oluştu</div>';
    } catch (e) {
      return "<div>Hata oluştu</div>";
    }
  }

  async generateTests(code: string, fileName: string) {
    if (this.isDemoMode || !this.ai) {
      return {
        tests: [
          { name: "Sözdizimi Kontrolü", description: "Dosya içeriğinin geçerli kod içerdiğini doğrular.", expected: "Geçerli" },
          { name: "Bağımlılık Analizi", description: "Gerekli kütüphanelerin import edildiğini kontrol eder.", expected: "Tamamlandı" }
        ]
      };
    }

    try {
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
    } catch (e) {
      return { tests: [] };
    }
  }

  async performAudit(files: GeneratedFile[]): Promise<ProjectAudit> {
    if (this.isDemoMode || !this.ai) {
      return {
        score: 85,
        summary: "Demo modu analizi: Proje genel olarak iyi yapılandırılmış, ancak gerçek API analizi için anahtar gereklidir.",
        issues: [
          { id: "1", severity: "info", category: "best-practice", title: "API Anahtarı Eksik", description: "Sistem demo modunda çalışıyor.", suggestion: "Gerçek analiz için API anahtarı ekleyin." }
        ]
      };
    }

    try {
      const context = files.map(f => `File: ${f.path}\nContent:\n${f.content}`).join('\n---\n');
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `
          Tüm projeyi güvenlik, performans ve en iyi uygulamalar açısından denetle.
          Kodları analiz et ve bulgularını JSON formatında döndür.
          ${context}
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
    } catch (e) {
      return { score: 0, summary: "Hata", issues: [] };
    }
  }

  private getMockStructure(prompt: string) {
    return {
      projectName: prompt.substring(0, 15) || "Demo Proje",
      files: [
        { path: "src/index.ts", purpose: "Ana giriş noktası" },
        { path: "src/app.ts", purpose: "Uygulama mantığı" },
        { path: "src/styles.css", purpose: "Görsel tasarım" },
        { path: "package.json", purpose: "Yapılandırma" }
      ]
    };
  }

  private getMockFileContent(fileName: string): string {
    const ext = fileName.split('.').pop();
    if (ext === 'ts') return `// Simulated code for ${fileName}\nexport const init = () => {\n  console.log("Hello from ${fileName}");\n};`;
    if (ext === 'css') return `/* Simulated styles */\nbody {\n  background: #0f172a;\n  color: white;\n}`;
    if (ext === 'json') return `{\n  "name": "demo-project",\n  "version": "1.0.0"\n}`;
    return `// Code for ${fileName}`;
  }
}
