import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { redisClient } from '../config/redis';
import * as crypto from 'crypto';
import * as https from 'https';

const generateDescriptionSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),

  mode: z.enum(['custom', 'predefined']),

  // Custom mode
  appointmentDate: z.string().optional(), // YYYY-MM-DD
  appointmentTime: z.string().optional(), // HH:MM

  // Predefined mode
  predefinedTypeName: z.string().optional(),
  dateOfChange: z.string().optional(), // YYYY-MM-DD
  futureChangeDate: z.string().optional(), // YYYY-MM-DD
  futureChangeTime: z.string().optional(), // HH:MM
});

type GenerateDescriptionBody = z.infer<typeof generateDescriptionSchema>;

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    // Try to extract a JSON object from surrounding text.
    const start = value.indexOf('{');
    const end = value.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(value.slice(start, end + 1)) as T;
      } catch {
        // ignore
      }
    }
    return null;
  }
}

async function callOpenAIChat(payload: {
  model: string;
  systemPrompt: string;
  userPrompt: string;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const body = JSON.stringify({
    model: payload.model,
    messages: [
      { role: 'system', content: payload.systemPrompt },
      { role: 'user', content: payload.userPrompt },
    ],
    temperature: 0.7,
  });

  const options: https.RequestOptions = {
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(body),
    },
  };

  return await new Promise<string>((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.setEncoding('utf8');

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          return reject(new Error(`OpenAI request failed (${res.statusCode}): ${data}`));
        }

        const parsed = safeJsonParse<any>(data);
        const content =
          parsed?.choices?.[0]?.message?.content ??
          parsed?.choices?.[0]?.text ??
          null;

        if (typeof content !== 'string' || !content.trim()) {
          return reject(new Error(`OpenAI returned empty content: ${data}`));
        }

        resolve(content);
      });
    });

    req.on('error', (err) => reject(err));
    req.write(body);
    req.end();
  });
}

export async function aiRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/generate-description',
    async (request, reply): Promise<void> => {
      try {
        const input = generateDescriptionSchema.parse(request.body);

        const hash = crypto
          .createHash('sha256')
          .update(JSON.stringify(input))
          .digest('hex');
        const cacheKey = `ai:generate-description:${hash}`;

        const cached = await redisClient.get(cacheKey);
        if (cached) {
          reply.send(JSON.parse(cached));
          return;
        }

        const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

        const systemPrompt =
          'You generate concise, professional appointment descriptions for a scheduling app. ' +
          'Return ONLY valid JSON. Keys: "description" (string) and optionally "title" (string). ' +
          'Keep description between 1 and 4 sentences.';

        const userPrompt = [
          'Generate an appointment description using the details below.',
          '',
          `Title: ${input.title}`,
          input.description ? `Existing description: ${input.description}` : 'Existing description: (none)',
          `Mode: ${input.mode}`,
          input.mode === 'custom'
            ? `Appointment date/time: ${input.appointmentDate || '(unknown)'} ${input.appointmentTime || '(unknown)'}`
            : `Predefined type: ${input.predefinedTypeName || '(unknown)'}\nDate of change: ${
                input.dateOfChange || '(unknown)'
              }\nFuture change date/time: ${input.futureChangeDate || '(unknown)'} ${input.futureChangeTime || '(unknown)'}`,
          '',
          'If the existing description is present, improve it while preserving meaning.',
        ].join('\n');

        const raw = await callOpenAIChat({
          model,
          systemPrompt,
          userPrompt,
        });

        const parsed = safeJsonParse<{ title?: string; description: string }>(raw);
        if (!parsed?.description) {
          return reply.code(502).send({ error: 'AI returned unexpected response' });
        }

        const result = {
          title: parsed.title,
          description: parsed.description,
        };

        await redisClient.setEx(cacheKey, 60 * 10, JSON.stringify(result));
        reply.send(result);
      } catch (error) {
        if (error instanceof z.ZodError) {
          reply.code(400).send({ error: error.errors });
          return;
        }

        const message = error instanceof Error ? error.message : 'AI generation failed';
        reply.code(500).send({ error: message });
      }
    }
  );
}

