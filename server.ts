import { createClient } from "@supabase/supabase-js";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { withSupabase } from "@supabase/server";

dotenv.config();

// Supabase Admin Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const supabaseAdmin = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // Lazy load Gemini AI helper
  let aiClient: GoogleGenAI | null = null;
  function getAiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required but missing");
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // API Route: Medication Intelligence AI
  app.post("/api/ai/analyze-medication", async (req, res) => {
    try {
        // Validate Input
        const { search_query } = req.body;
        if (!search_query || typeof search_query !== "string" || search_query.trim() === "") {
            return res.status(400).json({ success: false, error: "Invalid medication name." });
        }

        const client = getAiClient();

        // System Instructions based on user's request
        const systemInstruction = `
You are a digital clinical pharmacist system responsible for medication safety review and labeling.
Your task is to receive the medication name, auto-correct spelling, classify it, and determine safety labels (High-Alert / LASA) and nursing monitoring instructions.
Output ONLY a JSON object based on this schema:
{
  "search_result": {
    "original_query": "string",
    "is_corrected": boolean,
    "corrected_name_trade": "string",
    "generic_name": "string",
    "drug_class": "string"
  },
  "required_labels": {
    "high_alert_status": { "is_high_alert": boolean, "label_color": "string", "reason": "string" },
    "lasa_status": { 
      "has_lasa_risk": boolean, 
      "label_color": "string", 
      "confused_with": Array<{ "name": "string", "reason_of_confusion": "string", "danger_level": "string" }> 
    }
  },
  "clinical_guidelines": {
    "administration_routes": ["string"],
    "vital_signs_to_monitor": ["string"]
  }
}
`;

        // Retry logic
        let result;
        for (let i = 0; i < 3; i++) {
          try {
            result = await client.models.generateContent({
                model: "gemini-3.5-flash",
                contents: search_query,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                    temperature: 0.0,
                },
            });
            break;
          } catch (err: any) {
            if (i === 2) throw err;
            if (err.status === 503 || err.message?.includes("503") || err.message?.includes("high demand")) {
              await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1))); 
              continue;
            }
            throw err;
          }
        }
        
        // Parse JSON safely
        let responseJson;
        try {
            responseJson = JSON.parse(result!.text!);
        } catch (e) {
            console.error("Critical: AI returned malformed JSON", result!.text);
            throw new Error("AI data integrity error.");
        }
        
        res.json({ success: true, medication: responseJson });

    } catch (error: any) {
        console.error("Medication API Error:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message || "Failed to analyze medication. Please try again or consult a pharmacist." 
        });
    }
});

  // API Route: Drug-Drug Interaction Checker AI
  app.post("/api/ai/check-interaction", async (req, res) => {
    try {
        const { med1, med2, lang } = req.body;
        if (!med1 || !med2) {
            return res.status(400).json({ success: false, error: "Please provide both medication names." });
        }

        const client = getAiClient();
        const isAr = lang === "ar";

        const systemInstruction = `
You are a senior clinical pharmacist specializing in drug safety and drug-drug interactions.
Analyze the interaction between Medication 1 and Medication 2.
Output ONLY a JSON object based on this schema:
{
  "interaction_severity": "High" | "Moderate" | "Minor" | "None",
  "has_interaction": boolean,
  "mechanism": "string description",
  "clinical_effects": "string description",
  "recommendation": "string recommendation",
  "monitoring_guidelines": "string guidelines",
  "severity_color": "red" | "orange" | "yellow" | "green"
}
Output localized text in the requested language: ${isAr ? "Arabic" : "English"}.
`;

        const response = await client.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `Analyze interaction between: "${med1}" and "${med2}"`,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                temperature: 0.1,
            },
        });

        let responseJson;
        try {
            responseJson = JSON.parse(response.text!);
        } catch (e) {
            console.error("Critical: AI interaction returned malformed JSON", response.text);
            throw new Error("AI data integrity error.");
        }
        
        res.json({ success: true, analysis: responseJson });

    } catch (error: any) {
        console.error("Medication Interaction API Error:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message || "Failed to analyze drug interaction." 
        });
    }
  });

  // API Route: IV Y-Site Compatibility Checker AI
  app.post("/api/ai/iv-compatibility", async (req, res) => {
    try {
        const { drug1, drug2, fluid, lang } = req.body;
        if (!drug1 || !drug2) {
            return res.status(400).json({ success: false, error: "Please provide both drugs." });
        }

        const client = getAiClient();
        const isAr = lang === "ar";

        const systemInstruction = `
You are an IV therapy specialist pharmacist. Determine if Drug 1 and Drug 2 are physically and chemically compatible for Y-site co-administration, optionally considering the base fluid if provided.
Output ONLY a JSON object based on this schema:
{
  "compatibility_status": "Compatible" | "Incompatible" | "Caution" | "Data Not Available",
  "explanation": "Detailed explanation of compatibility, physical reactions (precipitation, color change, etc.)",
  "recommendation": "Nursing recommendation"
}
Output text in: ${isAr ? "Arabic" : "English"}.
`;
        const response = await client.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `Drug 1: ${drug1}, Drug 2: ${drug2}, Base Fluid: ${fluid || "None"}`,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                temperature: 0.1,
            },
        });

        res.json({ success: true, result: JSON.parse(response.text!) });
    } catch (error: any) {
        console.error("IV Compatibility API Error:", error);
        res.status(500).json({ success: false, error: "Failed to check IV compatibility." });
    }
  });

  // API Route: Patient Medication Counseling Generator
  app.post("/api/ai/medication-counseling", async (req, res) => {
    try {
        const { medication, lang } = req.body;
        if (!medication) {
            return res.status(400).json({ success: false, error: "Please provide medication." });
        }

        const client = getAiClient();
        const isAr = lang === "ar";

        const systemInstruction = `
You are a patient education pharmacist. Create a simple, patient-friendly counseling sheet for the given medication. 
Use plain language (no complex medical jargon).
Output ONLY a JSON object based on this schema:
{
  "drug_name": "Name of drug",
  "what_is_it_for": "Simple explanation",
  "how_to_take": "Clear instructions",
  "common_side_effects": ["side effect 1", "side effect 2"],
  "when_to_call_doctor": ["warning sign 1", "warning sign 2"],
  "food_drug_interactions": "Simple list of foods or other drugs to avoid",
  "forgot_dose_instruction": "What to do if a dose is missed"
}
Output text in: ${isAr ? "Arabic" : "English"}.
`;
        const response = await client.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `Medication: ${medication}`,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                temperature: 0.2,
            },
        });

        res.json({ success: true, counseling: JSON.parse(response.text!) });
    } catch (error: any) {
        console.error("Counseling API Error:", error);
        res.status(500).json({ success: false, error: "Failed to generate counseling." });
    }
  });


  // API Route: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route: Update Database Provider Credentials
  app.post("/api/settings/update-provider", (req, res) => {
      const { provider, settings } = req.body;
      if (provider === "SUPABASE" && settings) {
          const { supabaseUrl, supabaseKey } = settings;
          if (supabaseUrl && supabaseKey) {
              // Update server-side admin client
              (global as any).supabaseAdmin = createClient(supabaseUrl, supabaseKey);
              return res.json({ success: true, message: "Supabase admin client updated." });
          }
      }
      return res.status(400).json({ success: false, error: "Invalid provider or settings." });
  });

  // API Route: Clinical Quality & Safety AI assistant
  app.post("/api/ai/analyze-clinical", async (req, res) => {
    try {
      const { type, data, lang } = req.body;
      const client = getAiClient();

      let targetPrompt = "";
      if (type === "news2") {
        targetPrompt = `
You are a highly qualified Clinical Consultant and triage expert.
You are analyzing a patient's National Early Warning Score (NEWS2) data to evaluate risk and recommend actions.

Patient Data:
- Respiratory Rate: ${data.respiratoryRate} bpm
- SpO2 Scale 1: ${data.spo2Scale1}%
- SpO2 Scale 2: ${data.spo2Scale2}%
- Oxygen Therapy: ${data.oxygenTherapy ? "Yes" : "No"}
- Systolic Blood Pressure: ${data.systolicBP} mmHg
- Pulse / Heart Rate: ${data.pulse} bpm
- Consciousness (ACVPU): ${data.consciousness}
- Temperature: ${data.temperature}°C
- Calculated SCORE: ${data.totalScore}
- Risk Level: ${data.riskLevel}

Please provide:
1. Clinical Assessment (التقييم السريري): Evaluate the physiological risk severity based on these parameters.
2. Immediate Nursing Actions (الإجراءات التمريضية الفورية): Steps to stabilize the patient.
3. Escalation Protocol (بروتوكول التصعيد): Who to notify (e.g., attending physician, Critical Care Team) and frequency of monitoring.
4. Red Flags & Warning Signs (العلامات التحذيرية الخطيرة): Specific symptoms or deterioration signs to watch for.

Format the response beautifully in clean, structured Markdown.
The language of the response MUST be: ${lang === "ar" ? "Arabic" : "English"}.
If in Arabic, write with professional medical terminology used in top hospitals. Ensure a compassionate, professional, and clear scientific tone.
        `;
      } else if (type === "isbar") {
        targetPrompt = `
You are a Clinical Auditor and Expert Nurse Trainer. You are reviewing a patient medical handover report formatted as ISBAR (Identify, Situation, Background, Assessment, Recommendation).

Handover Data:
- Identify (التعريف بالمريض): ${data.identify}
- Situation (الوضع السريري الحالي): ${data.situation}
- Background (التاريخ المرضي والخلفية): ${data.background}
- Assessment (التقييم الحالي للمريض): ${data.assessment}
- Recommendation (التوصيات وخطط المتابعة): ${data.recommendation}

Please provide:
1. Quality Audit & Review (تدقيق جودة التقرير): Critically review this ISBAR handover for completeness, accuracy, and clear communication.
2. Clinical Insights & Risks (الرؤى والتحذيرات السريرية): Identify potential blind spots, active risks, or missing information in the transfer of care.
3. Recommended Diagnostic / Therapeutic next steps (الخطوات العلاجية والتشخيصية المقترحة): Immediate suggestions for safe patient clinical management.
4. Suggestions for Handover Improvement (مقترحات لتحسين صياغة التقرير): How this report could be written better or more clearly to avoid communication errors.

Format the response beautifully in clean, structured Markdown.
The language of the response MUST be: ${lang === "ar" ? "Arabic" : "English"}.
If in Arabic, write with professional medical terminology used in top hospitals. Ensure a compassionate, professional, and clear scientific tone.
        `;
      } else {
        targetPrompt = `
You are a Clinical Quality and Patient Safety AI expert.
Analyze the following medical clinical tool audit / findings:
${JSON.stringify(data, null, 2)}

Provide a professional clinical review, safety assessment, potential risk markers, and recommendations formatted in clean Markdown.
The language of the response MUST be: ${lang === "ar" ? "Arabic" : "English"}.
        `;
      }

      // Retry logic
      let response;
      let lastError;
      for (let i = 0; i < 3; i++) {
        try {
          response = await client.models.generateContent({
            model: "gemini-3.5-flash",
            contents: targetPrompt,
            config: {
              temperature: 0.3,
            },
          });
          break;
        } catch (err: any) {
          lastError = err;
          // Wait before retrying if 503
          if (err.status === 503 || err.message?.includes("503") || err.message?.includes("high demand")) {
            await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1))); // Incremental backoff
            continue;
          }
          throw err; // Don't retry other errors
        }
      }

      if (!response) throw lastError;

      const text = response.text || "";
      res.json({ success: true, analysis: text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error occurred during AI analysis."
      });
    }
  });

  // --- UNIVERSAL ABSTRACTION DATABASE LAYER (In-Memory Server-Side Store) ---
  const providerStores: Record<string, Record<string, any[]>> = {
    SUPABASE: {},
    POCKETBASE: {},
    LOCAL_HOST: {}
  };

  let sseClients: express.Response[] = [];

  // Stream endpoint for Real-Time Event System
  app.get("/api/db/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    sseClients.push(res);

    req.on("close", () => {
      sseClients = sseClients.filter(client => client !== res);
    });
  });

  function broadcastUpdate(provider: string, collectionName: string) {
    const payload = JSON.stringify({ provider, collectionName, timestamp: new Date().toISOString() });
    sseClients.forEach(client => {
      try {
        client.write(`data: ${payload}\n\n`);
      } catch (err) {
        console.error("SSE write error:", err);
      }
    });
  }

  // Get all items in a collection for a given provider
  app.get("/api/db/:provider/:collection", async (req, res) => {
    const { provider, collection: collectionName } = req.params;
    const upperProvider = provider.toUpperCase();

    const admin = (global as any).supabaseAdmin || supabaseAdmin;
    if (upperProvider === "SUPABASE" && admin) {
      try {
        const { data, error } = await admin.from(collectionName).select("*");
        if (error) throw error;
        return res.json({ success: true, data });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    if (!providerStores[upperProvider]) {
      return res.status(404).json({ success: false, error: "Database provider not supported." });
    }

    if (!providerStores[upperProvider][collectionName]) {
      providerStores[upperProvider][collectionName] = [];
    }

    res.json({ success: true, data: providerStores[upperProvider][collectionName] });
  });

  // Save/Update an item in a collection
  app.post("/api/db/:provider/:collection", async (req, res) => {
    const { provider, collection: collectionName } = req.params;
    const upperProvider = provider.toUpperCase();
    const item = req.body;

    const admin = (global as any).supabaseAdmin || supabaseAdmin;
    if (upperProvider === "SUPABASE" && admin) {
      try {
        const { data, error } = await admin.from(collectionName).upsert(item).select();
        if (error) throw error;
        broadcastUpdate(upperProvider, collectionName);
        return res.json({ success: true, item: data?.[0] || item });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    if (!providerStores[upperProvider]) {
      return res.status(404).json({ success: false, error: "Database provider not supported." });
    }

    if (!item || !item.id) {
      return res.status(400).json({ success: false, error: "Item must contain an 'id' field." });
    }

    if (!providerStores[upperProvider][collectionName]) {
      providerStores[upperProvider][collectionName] = [];
    }

    const index = providerStores[upperProvider][collectionName].findIndex(x => x.id === item.id);
    if (index >= 0) {
      providerStores[upperProvider][collectionName][index] = {
        ...providerStores[upperProvider][collectionName][index],
        ...item,
        updatedAt: new Date().toISOString()
      };
    } else {
      providerStores[upperProvider][collectionName].push({
        ...item,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    broadcastUpdate(upperProvider, collectionName);
    res.json({ success: true, item });
  });

  // Delete an item from a collection
  app.delete("/api/db/:provider/:collection/:id", async (req, res) => {
    const { provider, collection: collectionName, id } = req.params;
    const upperProvider = provider.toUpperCase();

    const admin = (global as any).supabaseAdmin || supabaseAdmin;
    if (upperProvider === "SUPABASE" && admin) {
      try {
        const { error } = await admin.from(collectionName).delete().eq("id", id);
        if (error) throw error;
        broadcastUpdate(upperProvider, collectionName);
        return res.json({ success: true });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    if (!providerStores[upperProvider]) {
      return res.status(404).json({ success: false, error: "Database provider not supported." });
    }

    if (!providerStores[upperProvider][collectionName]) {
      providerStores[upperProvider][collectionName] = [];
    }

    const initialLength = providerStores[upperProvider][collectionName].length;
    providerStores[upperProvider][collectionName] = providerStores[upperProvider][collectionName].filter(x => x.id !== id);

    if (providerStores[upperProvider][collectionName].length !== initialLength) {
      broadcastUpdate(upperProvider, collectionName);
    }

    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static files from dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
