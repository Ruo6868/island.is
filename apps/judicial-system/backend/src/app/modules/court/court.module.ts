import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { EmailModule } from '@island.is/email-service'

import { CourtClientModule } from '@island.is/judicial-system/court-client'

import { environment } from '../../../environments'
import { EventModule } from '../event/event.module'
import { RobotLog } from './models/robotLog.model'
import { CourtService } from './court.service'

@Module({
  imports: [
    SequelizeModule.forFeature([RobotLog]),
    CourtClientModule,
    EmailModule.register(environment.emailOptions),
    EventModule,
  ],
  providers: [CourtService],
  exports: [CourtService],
})
export class CourtModule {}
