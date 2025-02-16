import { Field, ObjectType, Query, Resolver } from '@nestjs/graphql'

import { AppService } from './app.service'

@ObjectType()
class Hello {
  @Field(() => String)
  message!: string
}

@Resolver(() => Hello)
export class AppResolver {
  constructor(private appService: AppService) {}

  @Query(() => Hello)
  async getHello() {
    return { message: this.appService.getHello() }
  }
}
