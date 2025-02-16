import { Type } from '@nestjs/common'
import { Field, ObjectType, Int } from '@nestjs/graphql'

interface IEdgeType<T> {
  cursor: string
  node: T
}

interface IPageInfo {
  startCursor?: string
  endCursor?: string
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface IPaginatedType<T> {
  edges: IEdgeType<T>[]
  pageInfo: IPageInfo
  totalCount: number
}

export function Paginated<T>(classRef: Type<T>): Type<IPaginatedType<T>> {
  @ObjectType(`${classRef.name}Edge`)
  abstract class EdgeType implements IEdgeType<T> {
    @Field(() => String)
    cursor!: string

    @Field(() => classRef)
    node!: T
  }

  @ObjectType(`${classRef.name}sPageInfo`)
  abstract class PageInfo implements IPageInfo {
    @Field(() => String, { nullable: true })
    startCursor?: string

    @Field(() => String, { nullable: true })
    endCursor?: string

    @Field(() => Boolean)
    hasPreviousPage!: boolean

    @Field(() => Boolean)
    hasNextPage!: boolean
  }

  @ObjectType(`Paginated${classRef.name}s`, { isAbstract: true })
  abstract class PaginatedType implements IPaginatedType<T> {
    @Field(() => PageInfo)
    pageInfo!: PageInfo

    @Field(() => [EdgeType])
    edges!: EdgeType[]

    @Field(() => Int)
    totalCount!: number
  }

  return PaginatedType as Type<IPaginatedType<T>>
}
