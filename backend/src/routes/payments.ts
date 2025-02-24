import { Hono } from "hono";
import { PaymentsController } from "../controllers/paymentsController";

const paymentsRouter = new Hono();

const paymentsController = new PaymentsController();

paymentsRouter.post("/create", async (c) => {
  console.log("Payment route");
  console.log(c);
  return paymentsController.createPayment(c);
});

paymentsRouter.get("/", async (c) => {
  return c.json({ message: "Fetch all payments" });
});

paymentsRouter.get("/:id", async (c) => {
  const paymentId = c.req.param("id");

  return c.json({ message: `Fetch payment with ID: ${paymentId}` });
});

paymentsRouter.put("/:id", async (c) => {
  const paymentId = c.req.param("id");

  return c.json({ message: `Update payment with ID: ${paymentId}` });
});

paymentsRouter.delete("/:id", async (c) => {
  const paymentId = c.req.param("id");

  return c.json({ message: `Delete payment with ID: ${paymentId}` });
});

process.on("SIGINT", async () => {
  await paymentsController.disconnect();
  process.exit();
});

process.on("SIGTERM", async () => {
  await paymentsController.disconnect();
  process.exit();
});

export default paymentsRouter;
