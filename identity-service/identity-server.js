const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const express = require("express");
const app = express();
require("dotenv").config();
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

app.use(express.json());

app.use(helmet());
app.use(cors());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
}));

const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Identity Service API",
            version: "1.0.0",
            description: "Documentation du Identity Service"
        }
    },
    apis: [__filename]
});

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);
//utilisateurs
const users = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" }
];
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Consulter un utilisateur
 *     description: Retourne les informations d'un utilisateur à partir de son identifiant.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Identifiant de l'utilisateur
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Utilisateur trouvé
 *       404:
 *         description: Utilisateur introuvable
 */
//consulter un utilisateur à partir de son identifiant
app.get("/users/:id", (req, res) => {
    const user = users.find(u => u.id === Number(req.params.id));
//si aucun utilisateurs correspond on fait erreur 404
    if (!user) {
        return res.status(404).json({
            exists: false,
            message: "Utilisateur introuvable"
        });
    }
//vérifier si un utilisateur existe
    res.json(user);
});
/**
 * @swagger
 * /users/{id}/exists:
 *   get:
 *     summary: Vérifier l'existence d'un utilisateur
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Retourne true ou false
 */
app.get("/users/:id/exists", (req, res) => {
    const user = users.find(u => u.id === Number(req.params.id));
//securiser les informations de l'utilisateur
    res.json({
        exists: !!user
    });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Identity Service lancé sur le port ${PORT}`);
});