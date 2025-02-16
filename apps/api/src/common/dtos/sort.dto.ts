import { Field, InputType, registerEnumType } from '@nestjs/graphql'

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

registerEnumType(SortDirection, {
  name: 'SortDirection',
})

@InputType()
export class SortInput {
  @Field(() => String)
  field!: string

  @Field(() => SortDirection)
  direction!: SortDirection
}
