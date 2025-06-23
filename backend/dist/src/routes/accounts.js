"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const accountsController_1 = require("../controllers/accountsController");
const auth_1 = require("../middleware/auth");
const accounts = new hono_1.Hono();
const accountsController = new accountsController_1.AccountsController();
accounts.use("*", auth_1.verifyToken);
accounts.get("/getAllAccounts", async (c) => {
    try {
        const userId = c.get("userId");
        const startDate = c.req.query("startDate");
        const endDate = c.req.query("endDate");
        let parsedStartDate;
        let parsedEndDate;
        if (startDate && endDate) {
            try {
                parsedStartDate = new Date(startDate);
                parsedEndDate = new Date(endDate);
                if (isNaN(parsedStartDate.getTime()) ||
                    isNaN(parsedEndDate.getTime())) {
                    return c.json({ error: "Invalid date format" }, 400);
                }
                if (parsedStartDate > parsedEndDate) {
                    return c.json({ error: "startDate must be before endDate" }, 400);
                }
            }
            catch (error) {
                return c.json({ error: "Invalid date format" }, 400);
            }
        }
        return await accountsController.getAllAccounts(c, userId, parsedStartDate, parsedEndDate);
    }
    catch (error) {
        console.error("Error in /getAllAccounts route:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});
accounts.get("/getDefault", async (c) => {
    try {
        const userId = c.get("userId");
        return await accountsController.getDefaultAccounts(c, userId);
    }
    catch (error) {
        console.error("Error in /getDefault route:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});
accounts.get("/getSavings", async (c) => {
    try {
        const userId = c.get("userId");
        return await accountsController.getSavingAccounts(c, userId);
    }
    catch (error) {
        console.error("Error in /getSavings route:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});
accounts.post("/insertDefault", async (c) => {
    try {
        const userId = c.get("userId");
        const body = await c.req.json();
        const { accountType, currencyType, name, description } = body;
        if (!accountType || !currencyType || !name) {
            return c.json({ error: "Fill all necessary fields" }, 400);
        }
        const account = await accountsController.createDefaultAccount(c, userId, accountType, currencyType, name, description || "");
        return c.json({
            message: "Default account inserted successfully",
            account,
        }, 201);
    }
    catch (error) {
        console.error("Error in /insertDefault route:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});
accounts.post("/insertSaving", async (c) => {
    try {
        const userId = c.get("userId");
        const body = await c.req.json();
        const { accountType, currencyType, name, description, targetAmount, targetDate, } = body;
        if (!accountType || !currencyType || !name || !targetAmount) {
            return c.json({ error: "Fill all necessary fields" }, 400);
        }
        const account = await accountsController.createSavingAccount(c, userId, accountType, currencyType, name, description || "", targetAmount, targetDate);
        return c.json({
            message: "Saving account inserted successfully",
            account,
        }, 201);
    }
    catch (error) {
        console.error("Error in /insertSaving route:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});
accounts.get("/searchAccount", async (c) => {
    try {
        const userId = c.get("userId");
        const searchString = c.req.query("search");
        if (!searchString) {
            return c.json({ error: "Search string is required" }, 400);
        }
        return await accountsController.searchAccountByString(c, userId, searchString);
    }
    catch (error) {
        console.error("Error in /searchAccount route:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});
accounts.delete("/deleteDefaultAccount", async (c) => {
    try {
        const userId = c.get("userId");
        const accountId = c.req.query("accountId");
        if (!accountId || isNaN(Number(accountId))) {
            return c.json({ error: "Invalid or missing accountId" }, 400);
        }
        await accountsController.deleteDefaultAccount(c, userId, Number(accountId));
        return c.json({ message: "Account deleted successfully" });
    }
    catch (error) {
        console.error("Error in /deleteAccount route:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});
accounts.delete("/deleteSavingAccount", async (c) => {
    try {
        const userId = c.get("userId");
        const accountId = c.req.query("accountId");
        if (!accountId || isNaN(Number(accountId))) {
            return c.json({ error: "Invalid or missing accountId" }, 400);
        }
        await accountsController.deleteSavingAccount(c, userId, Number(accountId));
        return c.json({ message: "Account deleted successfully" });
    }
    catch (error) {
        console.error("Error in /deleteAccount route:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});
accounts.post("/editDefaultAccount", async (c) => {
    try {
        const userId = c.get("userId");
        const accountId = c.req.query("accountId");
        const body = await c.req.json();
        const { name, description, currency, accountType, amount } = body;
        if (!accountId || isNaN(Number(accountId))) {
            return c.json({ error: "Invalid or missing accountId" }, 400);
        }
        if (!name) {
            return c.json({ error: "Name is required" }, 400);
        }
        await accountsController.editDefaultAccount(c, userId, Number(accountId), name, description || "", currency, accountType, amount);
        return c.json({ message: "Account edited successfully" });
    }
    catch (error) {
        console.error("Error in /editDefaultAccount route:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});
accounts.post("/editSavingAccount", async (c) => {
    try {
        const userId = c.get("userId");
        const accountId = c.req.query("accountId");
        const body = await c.req.json();
        const { name, description, currency, accountType } = body;
        const targetAmount = body.savingAccount?.update?.targetAmount;
        const targetDate = body.savingAccount?.update?.targetDate;
        if (!accountId || isNaN(Number(accountId))) {
            return c.json({ error: "Invalid or missing accountId" }, 400);
        }
        if (!name) {
            return c.json({ error: "Name is required" }, 400);
        }
        if (targetDate === undefined) {
            return c.json({ error: "Date is required" }, 400);
        }
        await accountsController.editSavingAccount(c, userId, Number(accountId), name, description || "", currency, accountType, targetAmount, new Date(targetDate));
        return c.json({ message: "Account edited successfully" });
    }
    catch (error) {
        console.error("Error in /editSavingAccount route:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});
exports.default = accounts;
//# sourceMappingURL=accounts.js.map