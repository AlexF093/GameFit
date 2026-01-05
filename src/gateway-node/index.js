const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Redirigir la ruta raíz al index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get("/api/users", async (req, res) => {
  const r = await axios.get("http://users:3001/users");
  res.json(r.data);
});

app.get("/api/workouts/:character", async (req, res) => {
  const r = await axios.get(
    `http://workouts:8000/workouts/${req.params.character}`
  );
  res.json(r.data);
});

app.listen(3000, () => console.log("Gateway on 3000"));

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

