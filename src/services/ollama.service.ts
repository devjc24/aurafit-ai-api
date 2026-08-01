import axios from "axios";


const client = axios.create({
    baseURL: process.env.OLLAMA_URL
});


export async function generateAI(prompt:string){

    const response = await client.post("/api/generate",{
        model: process.env.MODEL,
        prompt,
        stream:false
    });

    return response.data.response;
}
