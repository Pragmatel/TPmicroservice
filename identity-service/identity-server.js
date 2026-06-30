const express = require("express");
const app = express();

app.use(express.json());

//utilisateurs
const users = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" }
];
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

app.get("/users/:id/exists", (req, res) => {
    const user = users.find(u => u.id === Number(req.params.id));
//securiser les informations de l'utilisateur
    res.json({
        exists: !!user
    });
});

app.listen(3001, () => {
    console.log("Identity Service lancé sur le port 3001");
});