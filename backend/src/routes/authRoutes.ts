import { Hono } from "hono";
import { AuthController } from "../controllers/authController";

const auth = new Hono();
const controller = new AuthController();

auth.post("/login", (c) => controller.login(c));
auth.post("/register", (c) => controller.register(c));

export default auth;