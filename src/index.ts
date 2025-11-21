import OpenAI from "openai";
import cron from "node-cron";
import dotenv from "dotenv";
import { getClassificationPrompt, getLabelsString, getLabels } from "./prompts";
import { authorize, listUnreadMessages, getMessage, getEmailBody, createLabel, modifyMessage } from "./gmail";

// Load environment variables
dotenv.config();

// Configuration Validation
const requiredEnvVars = ["LLM_BASE_URL", "LLM_MODEL"];
const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  console.error(`❌ Error: Missing required environment variables: ${missingVars.join(", ")}`);
  console.error("Please create a .env file based on .env.example");
  process.exit(1);
}

const config = {
  baseURL: process.env.LLM_BASE_URL,
  apiKey: process.env.LLM_API_KEY || "sk-local-key", // Default dummy key for local LLMs
  model: process.env.LLM_MODEL!,
  temperature: parseFloat(process.env.LLM_TEMPERATURE || "0.1"),
  cronSchedule: process.env.CRON_SCHEDULE || "*/5 * * * *",
};

const client = new OpenAI({
  baseURL: config.baseURL,
  apiKey: config.apiKey,
});

const invokeGemma = async (text: string): Promise<string | null> => {
  try {
    const response = await client.chat.completions.create({
      messages: [
        {
          role: "user",
          content: text,
        },
      ],
      temperature: config.temperature,
      model: config.model,
    });

    return response.choices[0]?.message.content?.trim().toLowerCase() || null;
  } catch (error) {
    console.error("Error invoking LLM:", error);
    return null;
  }
};

const processNewEmails = async () => {
  console.log("Checking for new emails...");
  try {
    const auth = await authorize();
    const messages = await listUnreadMessages(auth);

    if (messages.length === 0) {
      console.log("No new unread emails.");
      return;
    }

    console.log(`Found ${messages.length} unread emails.`);

    // Ensure all labels exist
    const labels = getLabels();
    for (const label of labels) {
      await createLabel(auth, label);
    }

    for (const msg of messages) {
      if (!msg.id) continue;

      const fullMsg = await getMessage(auth, msg.id);
      const body = getEmailBody(fullMsg);
      const snippet = fullMsg.snippet || "";

      // Combine snippet and first 1000 chars of body for context
      const textToClassify = `Snippet: ${snippet}\nBody: ${body.substring(0, 1000)}`;

      const prompt = getClassificationPrompt(getLabelsString(), textToClassify);
      const predictedLabel = await invokeGemma(prompt);

      if (predictedLabel) {
        // Clean up label (remove punctuation if any leaked)
        const cleanLabel = predictedLabel.replace(/[^a-z-]/g, '');

        if (labels.includes(cleanLabel)) {
          console.log(`Classifying email ${msg.id} as: ${cleanLabel}`);
          const labelId = await createLabel(auth, cleanLabel); // Get ID (create if needed)

          // Apply label
          await modifyMessage(auth, msg.id, [labelId]);
        } else {
          console.log(`LLM returned unknown label: ${predictedLabel} for email ${msg.id}`);
          // Fallback to 'other'
          const otherId = await createLabel(auth, 'other');
          await modifyMessage(auth, msg.id, [otherId]);
        }
      }
    }
  } catch (error) {
    console.error("Error processing emails:", error);
  }
};

// Run immediately on start
console.log(`Starting Gmail Classifier Service...`);
console.log(`Model: ${config.model}`);
console.log(`Schedule: ${config.cronSchedule}`);
processNewEmails();

// Schedule cron
if (cron.validate(config.cronSchedule)) {
  cron.schedule(config.cronSchedule, () => {
    processNewEmails();
  });
} else {
  console.error(`❌ Invalid cron schedule: ${config.cronSchedule}`);
  process.exit(1);
}
