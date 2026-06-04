import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const TasteSchema = z.object({
  sweetness: z.number().int().min(0).max(10),
  sourness: z.number().int().min(0).max(10),
  saltiness: z.number().int().min(0).max(10),
  spiciness: z.number().int().min(0).max(10),
  bitterness: z.number().int().min(0).max(10),
  astringency: z.number().int().min(0).max(10),
});

export const AnalysisSchema = z.object({
  food: z.string(),
  taste: TasteSchema,
});

export type FoodAnalysis = z.infer<typeof AnalysisSchema>;

export const analyzeFood = createServerFn({ method: "POST" })
  .inputValidator(z.object({ imageDataUrl: z.string().min(20) }))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const { output } = await generateText({
      model,
      output: Output.object({
        schema: z.object({
          food: z.string(),
          taste: z.object({
            sweetness: z.number().int().min(0).max(10),
            sourness: z.number().int().min(0).max(10),
            saltiness: z.number().int().min(0).max(10),
            spiciness: z.number().int().min(0).max(10),
            bitterness: z.number().int().min(0).max(10),
            astringency: z.number().int().min(0).max(10),
          }),
        }),
      }),
      system:
        "You are a Food Taste Analysis AI. Analyze the provided food image and return ONLY valid JSON with exactly two keys: 'food' (the food name) and 'taste' (an object with six integer values from 0-10: sweetness, sourness, saltiness, spiciness, bitterness, astringency). Do not add explanations, markdown, or any extra fields. If the food is unknown, estimate the taste profile logically based on visual cues.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this food image and return the taste profile as JSON.",
            },
            { type: "image", image: data.imageDataUrl },
          ],
        },
      ],
    });

    return output as FoodAnalysis;
  });
