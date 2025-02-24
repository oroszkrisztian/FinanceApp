import { Hono } from "hono";
import { AuthController } from "../controllers/authController";



const app = new Hono();
const authController = new AuthController();


app.post("/login", (c) => authController.login(c));
app.post("/register", (c) => authController.register(c));


export default app;