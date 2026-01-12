# GameFit - Prototipo Final

## Link al github
https://github.com/AlexF093/GameFit.git

## Descripción
GameFit es una aplicación web que combina el entrenamiento físico con el mundo de los videojuegos y el anime. Permite a los usuarios entrenar como su personaje favorito mediante rutinas personalizadas y gamificadas.

## Arquitectura
- **Microservicios**: 3 servicios (Users en Node.js, Workouts en Python, Gateway en Node.js)
- **Base de Datos**: MongoDB (no relacional)
- **Frontend**: SPA HTML5 con JavaScript vanilla
- **APIs**: RESTful, documentadas con OpenAPI/Swagger

## Requisitos del Sistema
- Docker y Docker Compose
- Node.js (opcional para desarrollo local)
- Python 3.8+ (opcional para desarrollo local)
- MongoDB (incluido en Docker)

## Instalación y Arranque

### Opción 1: Docker (Recomendado)
```bash
# Desde la carpeta src/
docker-compose up --build
```

### Opción 2: Desarrollo Local
1. **Instalar dependencias**:
   ```bash
   # Servicio de usuarios
   cd users-service-node
   npm install

   # Gateway
   cd ../gateway-node
   npm install

   # Servicio de workouts
   cd ../workouts-service-python
   pip install -r requirements.txt
   ```

2. **Iniciar MongoDB** (local o Docker):
   ```bash
   docker run -d -p 27017:27017 --name mongo mongo
   ```

3. **Arrancar servicios**:
   ```bash
   # Terminal 1: Servicio de usuarios
   cd users-service-node
   node index.js

   # Terminal 2: Servicio de workouts
   cd workouts-service-python
   uvicorn main:app --reload --host 0.0.0.0 --port 8000

   # Terminal 3: Gateway
   cd gateway-node
   node index.js
   ```

## Acceso a la Aplicación
/*- **Frontend**: http://localhost:8080
- **API Gateway**: http://localhost:3002/api/
- **Users API**: http://localhost:3001*/
- **Users API Docs (Swagger)**: http://localhost:3001/api-docs
- **Gateway API Docs (Swagger)**: http://localhost:3002/api-docs
- **Workouts API (Swagger)**: http://localhost:8000/docs

## Funcionalidades
- Registro e inicio de sesión de usuarios
- Elección de personaje favorito
- Generación de rutinas de entrenamiento (con datos externos opcionales)
- Seguimiento de progreso y XP
- Historial de rutinas completadas
- Persistencia de datos en MongoDB

## APIs Externas (Opcional)
El servicio de workouts consume la API de API Ninjas para obtener ejercicios reales. Requiere una API key gratuita (registrarse en https://api.api-ninjas.com/).

## Estructura del Proyecto
```
src/
├── docker-compose.yml
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── gateway-node/
│   ├── index.js
│   └── package.json
├── users-service-node/
│   ├── index.js
│   └── package.json
└── workouts-service-python/
    ├── main.py
    └── requirements.txt
```
