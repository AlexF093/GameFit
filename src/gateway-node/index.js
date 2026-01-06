const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
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
      title: "GameFit Gateway API",
      version: "1.0.0",
      description: "API Gateway for GameFit microservices",
    },
    servers: [
      {
        url: "http://localhost:3002",
      },
    ],
  },
  apis: ["./index.js"], // files containing annotations
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Redirigir la ruta raíz al index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: List of users
 */
app.get("/api/users", async (req, res) => {
  const r = await axios.get("http://users:3001/users");
  res.json(r.data);
});

/**
 * @swagger
 * /api/workouts/{character}:
 *   get:
 *     summary: Get workout for a character
 *     parameters:
 *       - in: path
 *         name: character
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workout routine
 */
app.get("/api/workouts/:character", async (req, res) => {
  const r = await axios.get(
    `http://workouts:8000/workouts/${req.params.character}`
  );
  res.json(r.data);
});

app.listen(3000, () => console.log("Gateway on 3000"));

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
 *         description: User created
 */
app.post("/api/auth/register", async (req, res) => {
  try {
    const response = await axios.post(
      "http://users:3001/api/auth/register",
      req.body
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error en register:", error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Error interno del servidor" });
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
 */
app.post("/api/auth/login", async (req, res) => {
  try {
    const response = await axios.post(
      "http://users:3001/api/auth/login",
      req.body
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error en login:", error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Error interno del servidor" });
  }
});

app.listen(3002, () => {
  console.log("Gateway on 3002");
  console.log("API Docs available at http://localhost:3002/api-docs");
});

