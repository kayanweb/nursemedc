var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  let aiClient = null;
  function getAiClient() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required but missing");
      }
      aiClient = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    }
    return aiClient;
  }
  app.post("/api/ai/analyze-medication", async (req, res) => {
    try {
      const { search_query } = req.body;
      if (!search_query || typeof search_query !== "string" || search_query.trim() === "") {
        return res.status(400).json({ success: false, error: "Invalid medication name." });
      }
      const client = getAiClient();
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
      let result;
      for (let i = 0; i < 3; i++) {
        try {
          result = await client.models.generateContent({
            model: "gemini-3.5-flash",
            contents: search_query,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              temperature: 0
            }
          });
          break;
        } catch (err) {
          if (i === 2) throw err;
          if (err.status === 503 || err.message?.includes("503") || err.message?.includes("high demand")) {
            await new Promise((resolve) => setTimeout(resolve, 2e3 * (i + 1)));
            continue;
          }
          throw err;
        }
      }
      let responseJson;
      try {
        responseJson = JSON.parse(result.text);
      } catch (e) {
        console.error("Critical: AI returned malformed JSON", result.text);
        throw new Error("AI data integrity error.");
      }
      res.json({ success: true, medication: responseJson });
    } catch (error) {
      console.error("Medication API Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to analyze medication. Please try again or consult a pharmacist."
      });
    }
  });
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
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.1
        }
      });
      let responseJson;
      try {
        responseJson = JSON.parse(response.text);
      } catch (e) {
        console.error("Critical: AI interaction returned malformed JSON", response.text);
        throw new Error("AI data integrity error.");
      }
      res.json({ success: true, analysis: responseJson });
    } catch (error) {
      console.error("Medication Interaction API Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to analyze drug interaction."
      });
    }
  });
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
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.1
        }
      });
      res.json({ success: true, result: JSON.parse(response.text) });
    } catch (error) {
      console.error("IV Compatibility API Error:", error);
      res.status(500).json({ success: false, error: "Failed to check IV compatibility." });
    }
  });
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
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.2
        }
      });
      res.json({ success: true, counseling: JSON.parse(response.text) });
    } catch (error) {
      console.error("Counseling API Error:", error);
      res.status(500).json({ success: false, error: "Failed to generate counseling." });
    }
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
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
- Temperature: ${data.temperature}\xB0C
- Calculated SCORE: ${data.totalScore}
- Risk Level: ${data.riskLevel}

Please provide:
1. Clinical Assessment (\u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0633\u0631\u064A\u0631\u064A): Evaluate the physiological risk severity based on these parameters.
2. Immediate Nursing Actions (\u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u062A\u0645\u0631\u064A\u0636\u064A\u0629 \u0627\u0644\u0641\u0648\u0631\u064A\u0629): Steps to stabilize the patient.
3. Escalation Protocol (\u0628\u0631\u0648\u062A\u0648\u0643\u0648\u0644 \u0627\u0644\u062A\u0635\u0639\u064A\u062F): Who to notify (e.g., attending physician, Critical Care Team) and frequency of monitoring.
4. Red Flags & Warning Signs (\u0627\u0644\u0639\u0644\u0627\u0645\u0627\u062A \u0627\u0644\u062A\u062D\u0630\u064A\u0631\u064A\u0629 \u0627\u0644\u062E\u0637\u064A\u0631\u0629): Specific symptoms or deterioration signs to watch for.

Format the response beautifully in clean, structured Markdown.
The language of the response MUST be: ${lang === "ar" ? "Arabic" : "English"}.
If in Arabic, write with professional medical terminology used in top hospitals. Ensure a compassionate, professional, and clear scientific tone.
        `;
      } else if (type === "isbar") {
        targetPrompt = `
You are a Clinical Auditor and Expert Nurse Trainer. You are reviewing a patient medical handover report formatted as ISBAR (Identify, Situation, Background, Assessment, Recommendation).

Handover Data:
- Identify (\u0627\u0644\u062A\u0639\u0631\u064A\u0641 \u0628\u0627\u0644\u0645\u0631\u064A\u0636): ${data.identify}
- Situation (\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0633\u0631\u064A\u0631\u064A \u0627\u0644\u062D\u0627\u0644\u064A): ${data.situation}
- Background (\u0627\u0644\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0645\u0631\u0636\u064A \u0648\u0627\u0644\u062E\u0644\u0641\u064A\u0629): ${data.background}
- Assessment (\u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u062D\u0627\u0644\u064A \u0644\u0644\u0645\u0631\u064A\u0636): ${data.assessment}
- Recommendation (\u0627\u0644\u062A\u0648\u0635\u064A\u0627\u062A \u0648\u062E\u0637\u0637 \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629): ${data.recommendation}

Please provide:
1. Quality Audit & Review (\u062A\u062F\u0642\u064A\u0642 \u062C\u0648\u062F\u0629 \u0627\u0644\u062A\u0642\u0631\u064A\u0631): Critically review this ISBAR handover for completeness, accuracy, and clear communication.
2. Clinical Insights & Risks (\u0627\u0644\u0631\u0624\u0649 \u0648\u0627\u0644\u062A\u062D\u0630\u064A\u0631\u0627\u062A \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629): Identify potential blind spots, active risks, or missing information in the transfer of care.
3. Recommended Diagnostic / Therapeutic next steps (\u0627\u0644\u062E\u0637\u0648\u0627\u062A \u0627\u0644\u0639\u0644\u0627\u062C\u064A\u0629 \u0648\u0627\u0644\u062A\u0634\u062E\u064A\u0635\u064A\u0629 \u0627\u0644\u0645\u0642\u062A\u0631\u062D\u0629): Immediate suggestions for safe patient clinical management.
4. Suggestions for Handover Improvement (\u0645\u0642\u062A\u0631\u062D\u0627\u062A \u0644\u062A\u062D\u0633\u064A\u0646 \u0635\u064A\u0627\u063A\u0629 \u0627\u0644\u062A\u0642\u0631\u064A\u0631): How this report could be written better or more clearly to avoid communication errors.

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
      let response;
      let lastError;
      for (let i = 0; i < 3; i++) {
        try {
          response = await client.models.generateContent({
            model: "gemini-3.5-flash",
            contents: targetPrompt,
            config: {
              temperature: 0.3
            }
          });
          break;
        } catch (err) {
          lastError = err;
          if (err.status === 503 || err.message?.includes("503") || err.message?.includes("high demand")) {
            await new Promise((resolve) => setTimeout(resolve, 2e3 * (i + 1)));
            continue;
          }
          throw err;
        }
      }
      if (!response) throw lastError;
      const text = response.text || "";
      res.json({ success: true, analysis: text });
    } catch (error) {
      console.error("Gemini API Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error occurred during AI analysis."
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware loaded.");
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
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
//# sourceMappingURL=server.cjs.map
