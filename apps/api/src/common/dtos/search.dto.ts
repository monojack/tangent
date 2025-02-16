import { Field, InputType } from '@nestjs/graphql'

@InputType()
export class SearchInput {
  @Field(() => String, { nullable: true })
  text?: string
}
