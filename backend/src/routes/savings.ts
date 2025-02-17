import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const saving = new Hono();
const prisma = new PrismaClient();

