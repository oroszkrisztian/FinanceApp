import { Context } from "hono";
import { FundService } from "../services/fundService";

class FundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FundError";
  }
}

export class FundController {
  private fundService: FundService;

  constructor() {
    this.fundService = new FundService();
  }

  async getFunds(c: Context, userId: number) {
    try {
      if (!userId) {
        throw new FundError("Unauthorized");
      }
      const funds = await this.fundService.getUserFunds(userId);
      return c.json(funds);
    } catch (error) {
      console.error("Get funds error:", error);
      if (error instanceof FundError || error instanceof Error) {
        return c.json({ error: error.message }, 401);
      }
      return c.json({ error: "Internal server error" }, 500);
    }
  }
}