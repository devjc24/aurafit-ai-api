import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";

import aiRoutes from "./routes/ai.routes";


const app = express();


app.use(cors());
app.use(helmet());
app.use(express.json());


app.get("/",(_,res)=>{
    res.json({
        status:"online",
        service:"AuraFit AI API"
    });
});


app.use("/api/ai", aiRoutes);


app.listen(process.env.PORT,()=>{

    console.log("OLLAMA:", process.env.OLLAMA_URL);
    console.log("MODEL:", process.env.MODEL);

    console.log(
        `API rodando na porta ${process.env.PORT}`
    );

});
