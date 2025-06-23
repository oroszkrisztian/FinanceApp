import { Hono } from "hono";
import { verifyToken } from "../middleware/auth";

const ai = new Hono();

let GoogleGenerativeAI: any = null;
let genAI: any = null;

const initializeGemini = async () => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }

    if (!GoogleGenerativeAI) {
      const module = await import("@google/generative-ai");
      GoogleGenerativeAI = module.GoogleGenerativeAI;
      genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }

    return { GoogleGenerativeAI, genAI };
  } catch (error) {
    throw error;
  }
};

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

interface AIExistingCategorySuggestion {
  type: "existing";
  categoryId: number;
  categoryName: string;
  confidence: number;
  reason: string;
}

interface AINewCategorySuggestion {
  type: "new";
  categoryName: string;
  confidence: number;
  reason: string;
  description?: string;
}

type AICategorySuggestion =
  | AIExistingCategorySuggestion
  | AINewCategorySuggestion;

async function createCategory(categoryName: string, token: string) {
  const response = await fetch(
    `https://financeapp-bg0k.onrender.com/categories/createUserCategory`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ categoryName }),
    }
  );
  if (!response.ok) throw new Error("Failed to create ai category user");
  return response.json();
}

async function getAllCategoriesForUser(token: string) {
  const response = await fetch(
    "https://financeapp-bg0k.onrender.com/categories/getAllCategoriesForUser",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    }
  );
  if (!response.ok) throw new Error("Failed to get all categories ai for user");
  return response.json();
}

async function getUserBudgets(userId: number, token: string) {
  try {
    const response = await fetch(
      `https://financeapp-bg0k.onrender.com/budget/getAllUserBudgets`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      }
    );
    if (!response.ok) throw new Error("Failed to get user budgets");
    const data = await response.json();
    return data.budgets || data || [];
  } catch (error) {
    return [];
  }
}

async function createUserBudgetWithCategories(
  userId: number,
  name: string,
  limitAmount: number,
  currency: string,
  categoryIds: number[],
  token: string
) {
  const response = await fetch(
    `https://financeapp-bg0k.onrender.com/createUserBudgetWithCategories`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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

async function getExchangeRates() {
  try {
    const response = await fetch("https://www.bnr.ro/nbrfxrates.xml");
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
    }
    const xmlText = await response.text();
    return xmlText;
  } catch (error) {
    return null;
  }
}

async function updateUserBudget(
  userId: number,
  budgetId: number,
  name: string,
  limitAmount: number,
  currency: string,
  categoryIds: number[],
  token: string
) {
  const response = await fetch(
    `https://financeapp-bg0k.onrender.com/budget/updateUserBudget`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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

async function deleteUserBudget(userId: number, budgetId: number, token: string) {
  const response = await fetch(
    `https://financeapp-bg0k.onrender.com/budget/deleteUserBudget`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, budgetId }),
    }
  );
  if (!response.ok) throw new Error("Failed to delete budget");
  return response.json();
}

ai.get("/test", async (c) => {
  try {
    const { genAI: geminiClient } = await initializeGemini();
    const model = geminiClient.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(
      "Say hello and confirm you're working correctly for financial analysis."
    );
    const response = await result.response;
    const text = response.text();

    return c.json({
      success: true,
      message: "Gemini AI connection successful",
      response: text,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: "Failed to connect to Gemini AI",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

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

    const exchangeRates = await getExchangeRates();

    const { genAI: geminiClient } = await initializeGemini();
    const model = geminiClient.getGenerativeModel({
      model: "gemini-2.5-flash-preview-05-20",
    });

    const prompt = `You are a financial assistant and only can answer about the sent data, any other random questions are prohibited. The user asked: "${question}".\n\nHere is the user's financial data for the current month (use the original currencies as provided in the data, do not convert or summarize in a different currency):\nAccounts: ${JSON.stringify(accounts)}\nTransactions: ${JSON.stringify(transactions)}\nFuture Outgoing Payments: ${JSON.stringify(futureOutgoingPayments)}\nFuture Incoming Payments: ${JSON.stringify(futureIncomingPayments)}\nBudgets: ${JSON.stringify(budgets)}\n\nExchange Rates (Romanian Central Bank): ${exchangeRates || "Not available"}\n\nWhen asked about total spending, always list the total for each currency and also list all individual spending names and their amounts, grouped by currency.\n\nAlways format your response in clear, visually appealing Markdown. Use headings for sections, bullet points or tables for lists, and bold/italic for emphasis. Make the response easy to read and nice to look at.\n\nAnswer the user's question in a concise, friendly, and helpful way. If you don't have enough data, say so.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return c.json({ success: true, answer: text });
  } catch (error) {
    return c.json({ success: false, error: "Failed to get AI response" }, 500);
  }
});

ai.post("/aiCategorySuggestion", async (c) => {
  try {
    const userId = (c as any).get("userId") as number;
    
    if (!userId) {
      return c.json(
        {
          success: false,
          error: "User ID not found in token",
        },
        401
      );
    }

    const body = await c.req.json();
    const {
      paymentName,
      paymentAmount,
      paymentType,
      currency,
      description,
    } = body;

    if (!paymentName || !paymentAmount || !paymentType) {
      return c.json(
        {
          success: false,
          error:
            "Missing required fields: paymentName, paymentAmount, paymentType",
        },
        400
      );
    }
    
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return c.json(
        {
          success: false,
          error: "Authorization token not found",
        },
        401
      );
    }
    
    const categoriesData = await getAllCategoriesForUser(token);
    if (!categoriesData || !Array.isArray(categoriesData)) {
      return c.json(
        {
          success: false,
          error: "Failed to fetch user categories",
        },
        500
      );
    }

    const userBudgets = await getUserBudgets(userId, token);

    const { genAI: geminiClient } = await initializeGemini();
    const model = geminiClient.getGenerativeModel({
      model: "gemini-2.5-flash-preview-05-20",
    });

    const prompt = `You are a financial categorization AI that can suggest both existing categories and recommend creating new ones.

Payment Details:
- Name: "${paymentName}"
- Amount: ${paymentAmount} ${currency}
- Type: ${paymentType}
- Description: ${description || "No description"}

Existing Categories:
${categoriesData.map((cat: any) => `- ID: ${cat.id}, Name: "${cat.name}"`).join("\n")}

User's Current Budgets (for context):
${
  userBudgets && userBudgets.length > 0
    ? userBudgets
        .map(
          (budget: any) =>
            `- Budget: "${budget.name}" (${budget.limitAmount} ${budget.currency}) - Categories: ${budget.categoryIds?.join(", ") || "None"}`
        )
        .join("\n")
    : "No existing budgets"
}

Analysis Guidelines:
1. First, analyze if any existing categories fit well (confidence 0.7+)
2. If no existing categories fit well, suggest creating new, more specific categories
3. Consider the payment name and type for categorization
4. Look at existing budget patterns for consistency
5. For expenses: categorize based on what is being purchased/paid for
6. For income: categorize based on the source of income
7. Suggest 1-4 total suggestions (mix of existing and new)
8. Be conservative with confidence scores

Instructions:
- For existing categories: use "existing" type with categoryId
- For new categories: use "new" type with suggested categoryName
- Provide practical reasoning for each suggestion
- Order by confidence (highest first)
- Only suggest creating new categories if they would be significantly more specific/useful than existing ones

Return ONLY a valid JSON array in this exact format:
[
  {
    "type": "existing",
    "categoryId": 123,
    "categoryName": "Category Name",
    "confidence": 0.85,
    "reason": "Brief explanation why this existing category fits"
  },
  {
    "type": "new",
    "categoryName": "Suggested New Category Name",
    "confidence": 0.75,
    "reason": "Brief explanation why creating this new category would be beneficial",
    "description": "Optional: Brief description of what this category would include"
  }
]

Important: Return only the JSON array, no other text or formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      let cleanedText = text.trim();

      cleanedText = cleanedText
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "");

      const jsonMatch = cleanedText.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }

      const suggestions = JSON.parse(cleanedText);

      const validSuggestions = suggestions
        .filter((suggestion: any) => {
          if (
            !suggestion.type ||
            !suggestion.categoryName ||
            !suggestion.reason
          ) {
            return false;
          }

          if (suggestion.type === "existing") {
            return (
              suggestion.categoryId &&
              typeof suggestion.confidence === "number" &&
              suggestion.confidence >= 0.1 &&
              suggestion.confidence <= 1.0 &&
              categoriesData.some(
                (cat: any) => cat.id === suggestion.categoryId
              )
            );
          } else if (suggestion.type === "new") {
            return (
              typeof suggestion.confidence === "number" &&
              suggestion.confidence >= 0.1 &&
              suggestion.confidence <= 1.0 &&
              suggestion.categoryName.trim().length > 0
            );
          }

          return false;
        })
        .slice(0, 4)
        .map((suggestion: any) => ({
          type: suggestion.type,
          categoryId:
            suggestion.type === "existing" ? suggestion.categoryId : undefined,
          categoryName: suggestion.categoryName.trim(),
          confidence: Math.round(suggestion.confidence * 100) / 100,
          reason: suggestion.reason.trim(),
          description:
            suggestion.type === "new"
              ? suggestion.description?.trim()
              : undefined,
        }));

      return c.json({
        success: true,
        suggestions: validSuggestions,
      });
    } catch (parseError) {
      const fallbackSuggestions: AICategorySuggestion[] = [];
      const paymentNameLower = paymentName.toLowerCase();
      const descriptionLower = (description || "").toLowerCase();
      const searchText = `${paymentNameLower} ${descriptionLower}`.trim();

      for (const category of categoriesData) {
        const categoryNameLower = category.name.toLowerCase();
        let confidence = 0;
        let reason = "";

        if (
          searchText.includes(categoryNameLower) ||
          categoryNameLower.includes(paymentNameLower)
        ) {
          confidence = 0.8;
          reason = "Direct name match with payment";
        }

        if (confidence > 0) {
          fallbackSuggestions.push({
            type: "existing",
            categoryId: category.id,
            categoryName: category.name,
            confidence,
            reason,
          });
        }
      }

      if (userBudgets && userBudgets.length > 0) {
        for (const budget of userBudgets) {
          if (budget.categoryIds && budget.categoryIds.length > 0) {
            for (const categoryId of budget.categoryIds) {
              const category = categoriesData.find(
                (cat: any) => cat.id === categoryId
              );
              if (
                category &&
                !fallbackSuggestions.some(
                  (s) => s.type === "existing" && s.categoryId === categoryId
                )
              ) {
                const budgetNameLower = budget.name.toLowerCase();
                if (
                  paymentNameLower.includes(budgetNameLower) ||
                  budgetNameLower.includes(paymentNameLower)
                ) {
                  fallbackSuggestions.push({
                    type: "existing",
                    categoryId: category.id,
                    categoryName: category.name,
                    confidence: 0.75,
                    reason: `Used in existing budget: ${budget.name}`,
                  });
                }
              }
            }
          }
        }
      }

      const finalSuggestions = fallbackSuggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3);

      return c.json({
        success: true,
        suggestions: finalSuggestions,
      });
    }
  } catch (error) {
    return c.json(
      {
        success: false,
        error: "Failed to generate category suggestions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

ai.post("/budgetEdit", async (c) => {
  try {
    const userId = (c as any).get("userId") as number;
    
    if (!userId) {
      return c.json(
        {
          success: false,
          error: "User ID not found in token",
        },
        401
      );
    }

    const body = await c.req.json();
    const {
      transactions,
      categories,
      budgets,
      futureOutgoingPayments,
      futureIncomingPayments,
    } = body;

    const { genAI: geminiClient } = await initializeGemini();
    const model = geminiClient.getGenerativeModel({
      model: "gemini-2.5-flash-preview-05-20",
    });

    const availableCategoryIds = categories?.map((cat: any) => cat.id) || [];
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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      let cleanedText = text.trim();

      cleanedText = cleanedText
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "");

      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }

      const aiResponse = JSON.parse(cleanedText);

      if (aiResponse && Array.isArray(aiResponse.recommendations)) {
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

        return c.json({
          success: true,
          recommendations: validRecommendations,
        });
      } else {
        return c.json({
          success: true,
          recommendations: [],
        });
      }
    } catch (parseError) {
      return c.json({
        success: true,
        recommendations: [],
      });
    }
  } catch (error) {
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

ai.post("/applyRecommendations", async (c) => {
  try {
    const userId = (c as any).get("userId") as number;
    
    if (!userId) {
      return c.json(
        {
          success: false,
          error: "User ID not found in token",
        },
        401
      );
    }

    const body = await c.req.json();
    const { recommendations } = body;

    if (!Array.isArray(recommendations)) {
      return c.json(
        {
          success: false,
          error: "Missing or invalid recommendations array",
        },
        400
      );
    }

    const authHeader = c.req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return c.json(
        {
          success: false,
          error: "Authorization token not found",
        },
        401
      );
    }

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
              rec.categoryIds,
              token
            );
            results.push({
              success: true,
              action: "create",
              name: rec.name,
              details: result,
            });
            break;

          case "update":
            result = await updateUserBudget(
              userId,
              rec.budgetId,
              rec.name,
              rec.limitAmount,
              rec.currency,
              rec.categoryIds,
              token
            );
            results.push({
              success: true,
              action: "update",
              name: rec.name,
              budgetId: rec.budgetId,
              details: result,
            });
            break;

          case "delete":
            result = await deleteUserBudget(userId, rec.budgetId, token);
            results.push({
              success: true,
              action: "delete",
              name: rec.name,
              budgetId: rec.budgetId,
              reason: rec.reason,
              details: result,
            });
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

    return c.json({
      success: true,
      applied: successful.length,
      failed: failed.length,
      results: results,
    });
  } catch (error) {
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