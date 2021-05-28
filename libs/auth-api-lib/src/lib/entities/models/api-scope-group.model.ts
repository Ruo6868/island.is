import {
  Column,
  CreatedAt,
  DataType,
  Model,
  Table,
  UpdatedAt,
  PrimaryKey,
  HasMany,
} from 'sequelize-typescript'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ApiScope } from './api-scope.model'

@Table({
  tableName: 'api_scope_group',
  indexes: [
    {
      fields: ['id'],
    },
  ],
})
export class ApiScopeGroup extends Model<ApiScopeGroup> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  @ApiProperty()
  id!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  @ApiProperty({
    example: 'Finance',
  })
  name!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  @ApiProperty({
    example: 'Description about the Finance group',
  })
  description!: string

  @CreatedAt
  @ApiProperty()
  readonly created!: Date

  @UpdatedAt
  @ApiProperty()
  readonly modified?: Date

  @HasMany(() => ApiScope)
  @ApiPropertyOptional()
  scopes?: ApiScope[]
}
