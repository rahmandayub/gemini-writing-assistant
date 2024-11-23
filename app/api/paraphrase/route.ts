import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const getStylePrompt = (style: string) => {
    switch (style) {
        case 'Casual':
            return 'Use casual, friendly, and conversational language';
        case 'Formal':
            return 'Use formal, polite, and refined language';
        case 'Professional':
            return 'Use professional, clear, and business-appropriate language';
        case 'Creative':
            return 'Use creative, expressive, and engaging language';
        default:
            return 'Use natural language';
    }
};

export async function POST(req: Request) {
    try {
        const { text, sourceLang, targetLang, style, mode } = await req.json();
        const model = googleAI.getGenerativeModel({
            model: 'gemini-1.5-flash-8b-latest',
        });

        const styleInstruction = getStylePrompt(style);
        const sourceLangText =
            sourceLang !== 'auto'
                ? `from ${sourceLang}`
                : 'from the original language';
        const targetLangText =
            targetLang !== 'auto'
                ? `in ${targetLang}`
                : 'in the same language as the source text';

        let prompt = '';
        if (mode === 'Translate') {
            prompt = `Instructions: Translate the following text ${sourceLangText} to ${targetLang}. ${styleInstruction}.
Output only the translated text without any explanations or additional text.

Text to translate:
${text}`;
        } else {
            prompt = `Instructions: Rewrite the following text ${targetLangText}. ${styleInstruction}.
Keep the original language and meaning but use different wording and structure.
Output only the paraphrased text without any explanations or additional text.

Text to paraphrase:
${text}`;
        }

        const result = await model.generateContentStream(prompt);

        // Set up Server-Sent Events stream
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();
        const encoder = new TextEncoder();

        // Process the stream
        (async () => {
            try {
                for await (const chunk of result.stream) {
                    const text = chunk.text();
                    await writer.write(encoder.encode(`data: ${text}\n\n`));
                }
                await writer.write(encoder.encode('data: [DONE]\n\n'));
            } catch (error) {
                console.error('Streaming error:', error);
            } finally {
                await writer.close();
            }
        })();

        return new Response(stream.readable, {
            headers: {
                'Content-Type': 'text/event-stream',
            },
        });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Failed to process' },
            { status: 500 }
        );
    }
}
