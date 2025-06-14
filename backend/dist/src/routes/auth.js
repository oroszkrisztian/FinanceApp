"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const authController_1 = require("../controllers/authController");
const app = new hono_1.Hono();
const authController = new authController_1.AuthController();
app.post("/login", (c) => authController.login(c));
app.post("/register", (c) => authController.register(c));
app.post("/refresh", (c) => authController.refresh(c));
exports.default = app;
//# sourceMappingURL=auth.js.map