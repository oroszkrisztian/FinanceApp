// Update your ai.ts file with this enhanced version

import { Hono } from "hono";
import { verifyToken } from "../middleware/auth";

const ai = new Hono();

// Initialize Gemini AI lazily to handle potential import issues
let GoogleGenerativeAI: any = null;
let genAI: any = null;

const initializeGemini = async () => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }

    if (!GoogleGenerativeAI) {
      // Dynamic import to handle potential module issues
      const module = await import("@google/generative-ai");
      GoogleGenerativeAI = module.GoogleGenerativeAI;
      genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      console.log("✅ Gemini AI initialized successfully");
    }

    return { GoogleGenerativeAI, genAI };
  } catch (error) {
    console.error("❌ Failed to initialize Gemini AI:", error);
    throw error;
  }
};

// Middleware to verify authentication
ai.use("*", verifyToken);

interface AIBudgetRecommendation {
  action: "create" | "update" | "delete";
  budgetId?: number | null;
  name: string;
  limitAmount?: number;
  currency?: string;
  categoryIds?: number[];
  reason?: string;
}

async function createUserBudgetWithCategories(
  userId: number,
  name: string,
  limitAmount: number,
  currency: string,
  categoryIds: number[]
) {
  const response = await fetch(
    `http://localhost:3000/budget/createUserBudgetWithCategories`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        name,
        limitAmount,
        currency,
        categoryIds,
      }),
    }
  );
  if (!response.ok) throw new Error("Failed to create budget");
  return response.json();
}

async function updateUserBudget(
  userId: number,
  budgetId: number,
  name: string,
  limitAmount: number,
  currency: string,
  categoryIds: number[]
) {
  const response = await fetch(
    `http://localhost:3000/budget/updateUserBudget`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        budgetId,
        name,
        limitAmount,
        currency,
        categoryIds,
      }),
    }
  );
  if (!response.ok) throw new Error("Failed to update budget");
  return response.json();
}

async function deleteUserBudget(userId: number, budgetId: number) {
  const response = await fetch(
    `http://localhost:3000/budget/deleteUserBudget`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, budgetId }),
    }
  );
  if (!response.ok) throw new Error("Failed to delete budget");
  return response.json();
}

// Test Gemini connection
ai.get("/test", async (c) => {
  try {
    console.log("🧪 Testing Gemini AI connection...");

    const { genAI: geminiClient } = await initializeGemini();
    const model = geminiClient.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(
      "Say hello and confirm you're working correctly for financial analysis."
    );
    const response = await result.response;
    const text = response.text();

    console.log("✅ Gemini test successful");

    return c.json({
      success: true,
      message: "Gemini AI connection successful",
      response: text,
    });
  } catch (error) {
    console.error("❌ Gemini API Test Error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to connect to Gemini API",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// AI Chat endpoint (keep existing)
ai.post("/chat", async (c) => {
  try {
    const body = await c.req.json();
    const {
      question,
      accounts,
      transactions,
      futureOutgoingPayments,
      futureIncomingPayments,
      budgets,
    } = body;
    if (!question || typeof question !== "string") {
      return c.json(
        { success: false, error: "Missing or invalid question" },
        400
      );
    }
    const { genAI: geminiClient } = await initializeGemini();
    const model = geminiClient.getGenerativeModel({
      model: "gemini-2.5-flash-preview-05-20",
    });

    const prompt = `You are a financial assistant and only can answer about the sent data, any other random questions are prohibited. The user asked: "${question}".\n\nHere is the user's financial data for the current month (use the original currencies as provided in the data, do not convert or summarize in a different currency):\nAccounts: ${JSON.stringify(accounts)}\nTransactions: ${JSON.stringify(transactions)}\nFuture Outgoing Payments: ${JSON.stringify(futureOutgoingPayments)}\nFuture Incoming Payments: ${JSON.stringify(futureIncomingPayments)}\nBudgets: ${JSON.stringify(budgets)}\n\nWhen asked about total spending, always list the total for each currency and also list all individual spending names and their amounts, grouped by currency.\n\nAlways format your response in clear, visually appealing Markdown. Use headings for sections, bullet points or tables for lists, and bold/italic for emphasis. Make the response easy to read and nice to look at.\n\nAnswer the user's question in a concise, friendly, and helpful way. If you don't have enough data, say so.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return c.json({ success: true, answer: text });
  } catch (error) {
    console.error("❌ AI Chat Error:", error);
    return c.json({ success: false, error: "Failed to get AI response" }, 500);
  }
});

// Enhanced AI Budget Edit endpoint with CRUD operations
ai.post("/budgetEdit", async (c) => {
  try {
    const body = await c.req.json();
    const {
      userId,
      transactions,
      categories,
      budgets,
      futureOutgoingPayments,
      futureIncomingPayments,
    } = body;

    if (!userId) {
      return c.json({ success: false, error: "Missing userId" }, 400);
    }

    console.log("🧪 Processing AI budget recommendations for user:", userId);

    const { genAI: geminiClient } = await initializeGemini();
    const model = geminiClient.getGenerativeModel({
      model: "gemini-2.5-flash-preview-05-20",
    });

    // Extract available category IDs from categories array
    const availableCategoryIds = categories?.map((cat: any) => cat.id) || [];

    // Extract existing budget info
    const existingBudgetIds = budgets?.map((b: any) => b.id) || [];

    const prompt = `You are a financial advisor AI. Analyze the user's financial data and provide budget recommendations with CRUD operations.

Current Budgets: ${JSON.stringify(budgets, null, 2)}
Available Categories: ${JSON.stringify(categories, null, 2)}
Recent Transactions: ${JSON.stringify(transactions, null, 2)}
Future Outgoing Payments: ${JSON.stringify(futureOutgoingPayments, null, 2)}
Future Incoming Payments: ${JSON.stringify(futureIncomingPayments, null, 2)}

Available category IDs: ${availableCategoryIds.join(", ")}
Existing budget IDs: ${existingBudgetIds.join(", ")}

Based on this data, provide budget recommendations in the following JSON format:
{
  "recommendations": [
    {
      "action": "create" | "update" | "delete",
      "budgetId": number | null,
      "name": "Budget Name",
      "limitAmount": number,
      "currency": "USD/EUR/RON etc",
      "categoryIds": [1, 2, 3],
      "reason": "Brief explanation why this recommendation makes sense"
    }
  ]
}

Analysis Rules:
1. CREATE action: budgetId should be null, include name, limitAmount, currency, categoryIds
2. UPDATE action: budgetId should be existing budget ID, include name, limitAmount, currency, categoryIds
3. DELETE action: budgetId should be existing budget ID, name for reference, reason why to delete
4. Analyze spending patterns from transactions to suggest realistic limits
5. Recommend creating budgets for categories with high spending but no budget
6. Recommend updating budgets that are consistently over/under spent (adjust limitAmount)
7. Recommend deleting budgets that are unused, have zero transactions, or are redundant
8. Use the same currency as the most frequent transactions or existing budgets
9. Only use category IDs that exist: ${availableCategoryIds.join(", ")}
10. Only reference existing budget IDs for update/delete: ${existingBudgetIds.join(", ")}
11. Provide clear reasoning for each recommendation
12. If no improvements needed, return empty recommendations array
13. Focus on optimizing budget allocation and removing unused budgets

Deletion criteria:
- Budgets with no transactions in the last 3 months
- Budgets that are never used or have very low spending
- Duplicate budgets covering same categories
- Budgets with unrealistic limits (too high/low compared to actual spending)

Return ONLY valid JSON, no additional text.`;

    console.log("🤖 Sending prompt to Gemini AI...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("🤖 Raw AI Response:", text);

    try {
      // Clean and parse the AI response
      let cleanedText = text.trim();

      // Remove any markdown code blocks if present
      cleanedText = cleanedText
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "");

      // Try to find JSON in the response
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }

      const aiResponse = JSON.parse(cleanedText);

      console.log("✅ Parsed AI Response:", aiResponse);

      // Validate the response structure
      if (aiResponse && Array.isArray(aiResponse.recommendations)) {
        // Filter out invalid recommendations
        const validRecommendations = aiResponse.recommendations.filter(
          (rec: AIBudgetRecommendation) => {
            if (
              !rec.action ||
              !["create", "update", "delete"].includes(rec.action)
            ) {
              return false;
            }

            if (rec.action === "delete") {
              return (
                rec.budgetId &&
                existingBudgetIds.includes(rec.budgetId) &&
                rec.reason
              );
            }

            return (
              rec.name &&
              typeof rec.limitAmount === "number" &&
              rec.currency &&
              Array.isArray(rec.categoryIds) &&
              rec.categoryIds.length > 0 &&
              rec.categoryIds.every((id: number) =>
                availableCategoryIds.includes(id)
              ) &&
              (rec.action === "create"
                ? rec.budgetId === null
                : rec.action === "update"
                  ? existingBudgetIds.includes(rec.budgetId)
                  : true)
            );
          }
        );

        console.log(
          `✅ Validated ${validRecommendations.length} recommendations`
        );

        return c.json({
          success: true,
          recommendations: validRecommendations,
        });
      } else {
        console.warn("⚠️ AI response doesn't have expected structure");
        return c.json({
          success: true,
          recommendations: [],
        });
      }
    } catch (parseError) {
      console.error("❌ Failed to parse AI response as JSON:", parseError);
      console.error("Raw response was:", text);

      return c.json({
        success: true,
        recommendations: [],
      });
    }
  } catch (error) {
    console.error("❌ AI Budget Edit Error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to generate budget recommendations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// New endpoint to apply AI recommendations (performs actual CRUD operations)
ai.post("/applyRecommendations", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, recommendations } = body;

    if (!userId || !Array.isArray(recommendations)) {
      return c.json(
        {
          success: false,
          error: "Missing userId or recommendations",
        },
        400
      );
    }

    console.log(
      `🤖 Applying ${recommendations.length} budget recommendations for user:`,
      userId
    );

    const results = [];

    for (const rec of recommendations) {
      try {
        let result;

        switch (rec.action) {
          case "create":
            result = await createUserBudgetWithCategories(
              userId,
              rec.name,
              rec.limitAmount,
              rec.currency,
              rec.categoryIds
            );
            results.push({
              success: true,
              action: "create",
              name: rec.name,
              details: result,
            });
            console.log(`✅ Created budget: ${rec.name}`);
            break;

          case "update":
            result = await updateUserBudget(
              userId,
              rec.budgetId,
              rec.name,
              rec.limitAmount,
              rec.currency,
              rec.categoryIds
            );
            results.push({
              success: true,
              action: "update",
              name: rec.name,
              budgetId: rec.budgetId,
              details: result,
            });
            console.log(`✅ Updated budget: ${rec.name} (ID: ${rec.budgetId})`);
            break;

          case "delete":
            result = await deleteUserBudget(userId, rec.budgetId);
            results.push({
              success: true,
              action: "delete",
              name: rec.name,
              budgetId: rec.budgetId,
              reason: rec.reason,
              details: result,
            });
            console.log(`✅ Deleted budget: ${rec.name} (ID: ${rec.budgetId})`);
            break;

          default:
            results.push({
              success: false,
              action: rec.action,
              name: rec.name,
              error: "Invalid action",
            });
        }
      } catch (error) {
        console.error(`❌ Failed to ${rec.action} budget ${rec.name}:`, error);
        results.push({
          success: false,
          action: rec.action,
          name: rec.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    console.log(`✅ Applied ${successful.length} recommendations successfully`);
    if (failed.length > 0) {
      console.error(`❌ Failed to apply ${failed.length} recommendations`);
    }

    return c.json({
      success: true,
      applied: successful.length,
      failed: failed.length,
      results: results,
    });
  } catch (error) {
    console.error("❌ Apply Recommendations Error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to apply recommendations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default ai;
