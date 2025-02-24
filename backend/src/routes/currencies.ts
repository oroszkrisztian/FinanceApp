import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";

const currencies = new Hono();
const prisma = new PrismaClient();

currencies.get("/", async (c) => {
  try {
    const currencies = await prisma.currency.findMany();
    return c.json(currencies);
  } catch (error) {
    console.error("Error fetching currencies:", error);
    return c.json({ error: "Failed to fetch currencies" }, 500);
  }
});

export default currencies;
