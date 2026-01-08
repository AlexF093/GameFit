const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
app.use(cors());
app.use(express.json());

// Swagger
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "GameFit Gateway API",
      version: "1.0.0",
      description: "API Gateway for GameFit microservices",
    },
    servers: [{ url: "http://localhost:3002" }],
  },
  apis: ["./index.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Servir frontend
app.use(express.static(path.join(__dirname, "../frontend")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// USERS
app.get("/api/users", async (req, res) => {
  const r = await axios.get("http://users:3001/users");
  res.json(r.data);
});

// AUTH
app.post("/api/auth/register", async (req, res) => {
  const r = await axios.post(
    "http://users:3001/api/auth/register",
    req.body
  );
  res.json(r.data);
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const response = await axios.post(
      "http://users:3001/api/auth/login",
      req.body
    );

    res.json(response.data);

  } catch (error) {
    console.error("Gateway login error:", error.message);

    if (error.response) {
      // Error esperado (400, 401…) → reenviar tal cual
      return res
        .status(error.response.status)
        .json(error.response.data);
    }

    // Error grave (servicio caído, red, DNS)
    res.status(500).json({
      error: "No se pudo conectar con users-service"
    });
  }
});


// WORKOUTS (personajes)
app.get("/api/workouts/:character", async (req, res) => {
  const r = await axios.get(
    `http://workouts:8000/workouts/${req.params.character}`
  );
  res.json(r.data);
});

// 🏋️ RUTINAS USUARIO
app.get("/api/routines/:username", async (req, res) => {
  const r = await axios.get(
    `http://workouts:8000/routines/${req.params.username}`
  );
  res.json(r.data);
});

app.post("/api/routines", async (req, res) => {
  const r = await axios.post(
    "http://workouts:8000/routines",
    req.body
  );
  res.json(r.data);
});

// 📜 HISTORIAL
app.get("/api/history/:username", async (req, res) => {
  const r = await axios.get(
    `http://workouts:8000/history/${req.params.username}`
  );
  res.json(r.data);
});

app.post("/api/history", async (req, res) => {
  const r = await axios.post(
    "http://workouts:8000/history",
    req.body
  );
  res.json(r.data);
});

app.listen(3002, () => {
  console.log("Gateway running on 3002");
});


// XP
app.post("/api/auth/update-xp", async (req, res) => {
  try {
    const r = await axios.post(
      "http://users:3001/api/auth/update-xp",
      req.body
    );
    res.json(r.data);
  } catch (error) {
    console.error("Gateway update-xp error:", error.message);

    if (error.response) {
      return res
        .status(error.response.status)
        .json(error.response.data);
    }

    res.status(500).json({
      error: "No se pudo actualizar la XP"
    });
  }
});


app.put("/api/routines", async (req, res) => {
  const r = await axios.put(
    "http://workouts:8000/routines",
    req.body
  );
  res.json(r.data);
});



app.delete("/api/routines", async (req, res) => {
  const r = await axios.delete(
    "http://workouts:8000/routines",
    { data: req.body }
  );
  res.json(r.data);
});


