import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { audioBase64, categories, currentDate } = await req.json()
        const apiKey = Deno.env.get('GEMINI_API_KEY')

        if (!apiKey) throw new Error('Missing GEMINI_API_KEY')

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        // Prompt for transaction extraction
        const prompt = `
          Extract financial transactions from the provided audio. 
          Return ONLY a JSON array of objects. Do not include any other text or markdown formatting.
          
          JSON Structure:
          [{ 
            "amount": number, 
            "note": string, 
            "type": "INCOME" | "EXPENSE", 
            "category_name": string, 
            "date": "YYYY-MM-DD" 
          }]

          Context:
          - Today's date: ${currentDate}
          - Available categories: ${categories.join(', ')}
          - If a transaction date is not mentioned, use Today's date.
          - If no note is mentioned, leave it as an empty string.
          - Identify the most relevant category from the list above.
        `

        // Gemini can handle base64 audio in the request
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: audioBase64,
                    mimeType: "audio/m4a" // Expo default for iOS/Android often
                }
            }
        ])

        const response = await result.response
        let text = response.text()

        // Clean the response (sometimes Gemini adds ```json ... ```)
        text = text.replace(/```json/g, '').replace(/```/g, '').trim()

        return new Response(
            JSON.stringify({ transactions: JSON.parse(text) }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )
    } catch (error) {
        console.error(error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
