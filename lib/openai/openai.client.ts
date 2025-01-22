import { OpenAI } from "openai";
import { env } from "../../config";

export const openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
