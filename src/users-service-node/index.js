const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
app.use(cors());
app.use(express.json());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "GameFit Users API",
      version: "1.0.0",
      description: "API for user management in GameFit",
    },
    servers: [
      {
        url: "http://localhost:3001",
      },
    ],
  },
  apis: ["./index.js"], // files containing annotations
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 🔗 Conexión MongoDB (docker-compose)
mongoose.connect("mongodb://mongo:27017/gamefit", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// 📦 Modelo Usuario
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  character: { type: String, default: 'Goku' },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 }
});

const User = mongoose.model("User", UserSchema);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User created successfully
 *       400:
 *         description: Bad request
 */
app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body;

  console.log("Register attempt:", { username, hasPassword: !!password });

  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña requeridos" });
  }

  try {
    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(400).json({ error: "Usuario ya existe" });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hash });
    await user.save();

    console.log("User created:", username);
    res.json({ message: "Usuario creado" });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 character:
 *                   type: string
 *                 level:
 *                   type: integer
 *                 xp:
 *                   type: integer
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  console.log("Login attempt:", { username, hasPassword: !!password });

  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña requeridos" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "Usuario no encontrado" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    console.log("Login successful:", username);
    res.json({
      username: user.username,
      character: user.character,
      level: user.level,
      xp: user.xp
    });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// 🚀 START
app.listen(3001, () => {
  console.log("Users service running on port 3001");
  console.log("API Docs available at http://localhost:3001/api-docs");
});
