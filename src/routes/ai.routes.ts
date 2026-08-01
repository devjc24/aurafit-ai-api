import { Router } from "express";
import { generateAI } from "../services/ollama.service";

const router = Router();

router.post("/chat", async (req, res) => {

    try {

        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: "Prompt obrigatório"
            });
        }

        const response = await generateAI(prompt);

        return res.json({
            success: true,
            response
        });

    } catch (error: any) {

        console.error(
            error.response?.data || error.message || error
        );

        return res.status(500).json({
            success: false,
            message: "Erro ao consultar Ollama",
            error: error.message
        });

    }

});

export default router;
