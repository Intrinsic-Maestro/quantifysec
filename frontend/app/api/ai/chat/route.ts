import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Simple in-memory rate limiting to prevent free-tier abuse
const rateLimit = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const now = Date.now();
    let rl = rateLimit.get(ip);
    
    if (!rl || rl.resetAt < now) {
      rl = { count: 0, resetAt: now + 60000 }; // 1 minute window
    }
    
    if (rl.count >= 20) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
    }
    
    rl.count++;
    rateLimit.set(ip, rl);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI Assistant is not configured. Missing API key.' }, { status: 500 });
    }

    const { messages, context, role } = await req.json();

    const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: 'v1beta' } });
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    // Strip 'models/' prefix if present (API accepts short name)
    const modelId = model.replace(/^models\//, '');

    let systemInstruction = `You are QuantifySec AI Security Analyst, a specialized cybersecurity intelligence assistant.
Your role is to:
- explain cybersecurity concepts
- analyze security findings
- summarize incidents
- explain risk scores
- explain vulnerabilities
- summarize OCSF data
- explain security posture
- identify important trends
- help CISOs understand security posture
- help CFOs understand business/financial impact
- provide actionable recommendations
- explain technical concepts in understandable language

Distinguish between: TECHNICAL FACT, ANALYSIS, RECOMMENDATION, and UNKNOWN INFORMATION.
Never invent security findings. Never claim that an event exists unless it is present in the supplied QuantifySec data.
If data is unavailable, explicitly say so.
`;

    if (role === 'CISO') {
      systemInstruction += `\nYou are speaking with a CISO. Focus on Threats, Vulnerabilities, Incidents, Assets, Attack Surface, Security Score, OCSF events, Technical evidence, and Risk. Provide actionable technical and tactical insights.`;
    } else if (role === 'CFO') {
      systemInstruction += `\nYou are speaking with a CFO. Focus on Financial Risk, Risk Exposure, Potential Impact, Security Investment, Risk Reduction, ROI, and Budget. Do not expose sensitive technical data unnecessarily. Explain technical risks in terms of business impact.`;
    } else {
      systemInstruction += `\nYou are speaking with a user with role: ${role}. Adjust your focus appropriately.`;
    }

    if (context) {
      systemInstruction += `\n\nCurrent Context:\n${JSON.stringify(context, null, 2)}\nUse this context to answer user questions when relevant.`;
    }

    // Convert messages to Gemini format (GoogleGenAI SDK)
    const geminiMessages = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const responseStream = await ai.models.generateContentStream({
      model: modelId,
      contents: geminiMessages,
      config: {
        systemInstruction,
      }
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            if (chunk.text) {
               controller.enqueue(new TextEncoder().encode(chunk.text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked'
      }
    });
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    // Return sanitized error — never expose internal details or API keys
    const msg = typeof error?.message === 'string' ? error.message : 'Internal server error';
    const safeMsg = msg.includes('GEMINI_API_KEY') ? 'Internal server error' : msg;
    return NextResponse.json({ error: safeMsg }, { status: 500 });
  }
}
