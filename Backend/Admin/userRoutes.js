const express = require("express");
const router = express.Router();
const User = require("../models/userModel");


router.get("/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: "User not found" });
    }
});


router.put("/balance/:id", async (req, res) => {
    const { amount } = req.body;
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.balance += amount;
            await user.save();
            res.json({ balance: user.balance });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error updating balance" });
    }
});

module.exports = router;
