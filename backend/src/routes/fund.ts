import { Hono } from "hono";
import { FundController } from "../controllers/fundController";

const fund = new Hono();
const fundController = new FundController();

fund.get("/funds", (c) => {
    console.log("Request object:", c.req);
    const userId = c.req.query("userId"); 
    console.log("User ID:", userId);
    if (!userId) {
        return c.json({ error: "User ID is required" }, 400);
    }
    const userIdNumber = parseInt(userId, 10);
    if (isNaN(userIdNumber)) {
        return c.json({ error: "Invalid user ID" }, 400);
    }
    return fundController.getFunds(c, userIdNumber);
});

export default fund;