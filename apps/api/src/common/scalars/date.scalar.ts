import { CustomScalar, Scalar } from '@nestjs/graphql'
import { Kind, ValueNode } from 'graphql'

@Scalar('Date')
export class DateScalar implements CustomScalar<number, Date> {
  description = 'Date custom scalar type'

  serialize(value: unknown): number {
    if (!(value instanceof Date)) {
      throw new Error('Invalid Date')
    }
    return value.getTime()
  }

  parseValue(value: unknown): Date {
    if (typeof value !== 'number') {
      throw new Error('Invalid Date')
    }
    return new Date(value)
  }

  parseLiteral(ast: ValueNode): Date {
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10))
    }
    throw new Error('Invalid AST for Date')
  }
}
