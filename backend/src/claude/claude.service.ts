import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ExtractedStudent,
  matchCity,
  STUDENT_FIELDS,
  STUDENT_JSON_SCHEMA,
} from './extracted-student';

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

type ClaudeContentBlock = {
  type: string;
  text?: string;
};

type ClaudeResponse = {
  content?: ClaudeContentBlock[];
  error?: { message?: string };
};

/**
 * The only place this app calls Claude.
 *
 * React uploads the file to Nest. This service sends those bytes to the
 * Messages API and returns the student fields, including city. StudentsService passes
 * that result back to the form. The API key never leaves the server.
 */
@Injectable()
export class ClaudeService {
  constructor(private readonly config: ConfigService) {}

  async extractStudent(file: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
  }): Promise<ExtractedStudent> {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY')?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'ANTHROPIC_API_KEY is not set. Create a key at https://platform.claude.com/settings/keys and put it in backend/.env, then restart the API.',
      );
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2026-10-21',
      },
      body: JSON.stringify({
        model: this.config.get<string>('CLAUDE_MODEL', 'claude-sonnet-5-5'),
        max_tokens: 4096,
        output_config: {
          effort: this.config.get<string>('CLAUDE_EFFORT', 'medium'),
          format: {
            type: 'json_schema',
            schema: STUDENT_JSON_SCHEMA,
          },
        },
        messages: [
          {
            role: 'user',
            content: [
              this.toContentBlock(file),
              {
                type: 'text',
                text: [
                  'Read this student document. It may be a form, ID card, admission slip, or mark sheet.',
                  'Extract studentName, address, course, section, grade, and city exactly as printed.',
                  'For city, use a printed city name, or null when the document has no city.',
                  'Use null when a field is missing. Do not guess or use outside knowledge.',
                ].join(' '),
              },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(120_000),
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'network error';
      throw new BadGatewayException(`Could not reach the Claude API: ${message}`);
    });

    const payload = (await response.json()) as ClaudeResponse;
    if (!response.ok) {
      const detail = payload.error?.message ?? response.statusText;
      throw new BadGatewayException(
        `Claude API returned ${response.status}: ${detail}`,
      );
    }

    return this.parseStudent(payload);
  }

  private toContentBlock(file: {
    buffer: Buffer;
    mimetype: string;
  }): Record<string, unknown> {
    const data = file.buffer.toString('base64');

    if (file.mimetype === 'application/pdf') {
      return {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data,
        },
      };
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      throw new UnprocessableEntityException(
        'Upload a PDF or an image (JPEG, PNG, GIF, or WebP).',
      );
    }

    return {
      type: 'image',
      source: {
        type: 'base64',
        media_type: file.mimetype,
        data,
      },
    };
  }

  private parseStudent(payload: ClaudeResponse): ExtractedStudent {
    const text = payload.content?.find((block) => block.type === 'text')?.text;
    if (!text) {
      throw new BadGatewayException('Claude returned no extracted text.');
    }

    let raw: unknown;
    try {
      raw = JSON.parse(text.replace(/^```json\s*|```$/g, '').trim());
    } catch {
      throw new BadGatewayException('Claude did not return valid JSON.');
    }

    if (!raw || typeof raw !== 'object') {
      throw new BadGatewayException('Claude did not return a student record.');
    }

    const record = raw as Record<string, unknown>;
    const address = this.asText(record.address, 4000);
    const printedCity = matchCity(this.asText(record.city, 255));
    const student: ExtractedStudent = {
      studentName: this.asText(record.studentName, 255),
      address,
      course: this.asText(record.course, 255),
      section: this.asText(record.section, 64),
      grade: this.asText(record.grade, 64),
      city: printedCity === 'none' ? matchCity(address) : printedCity,
    };

    const found = STUDENT_FIELDS.some((field) => student[field]);
    if (!found) {
      throw new UnprocessableEntityException(
        'Claude could not find a student name, address, course, section, or grade in that file.',
      );
    }

    return student;
  }

  private asText(value: unknown, maxLength: number): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed.slice(0, maxLength);
  }
}
