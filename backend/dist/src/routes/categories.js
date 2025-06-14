"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const categoriesController_1 = require("../controllers/categoriesController");
const categoriesRepository_1 = require("../repositories/categoriesRepository");
const auth_1 = require("../middleware/auth");
const categories = new hono_1.Hono();
const categoriesController = new categoriesController_1.CategoriesController();
const categoriesRepository = new categoriesRepository_1.CategoriesRepository();
categories.use("*", auth_1.verifyToken);
categories.post("/getAllCategoriesForUser", async (c) => {
    try {
        const userId = c.get("userId");
        const allcategories = await categoriesController.getAllCategoriesForUser(c, userId);
        return c.json(allcategories);
    }
    catch (error) {
        console.error("Error in /getAllCategoriesForUser route:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});
categories.post("/createUserCategory", async (c) => {
    try {
        const userId = c.get("userId");
        const body = await c.req.json();
        const { categoryName } = body;
        const result = await categoriesController.createUserCategory(c, userId, categoryName);
        return c.json(result);
    }
    catch (error) {
        console.error("Error in /createUserCategory route:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});
exports.default = categories;
//# sourceMappingURL=categories.js.map