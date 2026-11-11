import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';

/** Validates and parses a request body (or param/query) with a zod schema. Use: `@Body(new ZodValidationPipe(schema))`. */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        statusCode: 400,
        message: result.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; '),
        code: 'VALIDATION_FAILED',
      });
    }
    return result.data;
  }
}
