import {
  Body,
  Controller,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger'

import type { Logger } from '@island.is/logging'
import { LOGGER_PROVIDER } from '@island.is/logging'

import { TokenGuard } from '@island.is/judicial-system/auth'
import {
  messageEndpoint,
  MessageType,
} from '@island.is/judicial-system/message'

import { Case, CaseHasExistedGuard, CurrentCase } from '../case'
import { CurrentDefendant, Defendant, DefendantExistsGuard } from '../defendant'
import { SubpoenaExistsGuard } from '../subpoena'
import { CaseNotificationDto } from './dto/caseNotification.dto'
import { DefendantNotificationDto } from './dto/defendantNotification.dto'
import { InstitutionNotificationDto } from './dto/institutionNotification.dto'
import { NotificationDispatchDto } from './dto/notificationDispatch.dto'
import { SubpoenaNotificationDto } from './dto/subpoenaNotification.dto'
import { DeliverResponse } from './models/deliver.response'
import { CaseNotificationService } from './caseNotification.service'
import { DefendantNotificationService } from './defendantNotification.service'
import { InstitutionNotificationService } from './institutionNotification.service'
import { NotificationDispatchService } from './notificationDispatch.service'
import { SubpoenaNotificationService } from './subpoenaNotification.service'

@UseGuards(TokenGuard)
@Controller('api/internal')
@ApiTags('internal notifications')
export class InternalNotificationController {
  constructor(
    private readonly caseNotificationService: CaseNotificationService,
    private readonly notificationDispatchService: NotificationDispatchService,
    private readonly institutionNotificationService: InstitutionNotificationService,
    private readonly subpoenaNotificationService: SubpoenaNotificationService,
    private readonly defendantNotificationService: DefendantNotificationService,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {}

  @Post(`case/:caseId/${messageEndpoint[MessageType.NOTIFICATION]}`)
  @UseGuards(CaseHasExistedGuard)
  @ApiCreatedResponse({
    type: DeliverResponse,
    description: 'Sends a case notification for an existing case',
  })
  sendCaseNotification(
    @Param('caseId') caseId: string,
    @CurrentCase() theCase: Case,
    @Body() notificationDto: CaseNotificationDto,
  ): Promise<DeliverResponse> {
    this.logger.debug(
      `Sending ${notificationDto.type} case notification for case ${caseId}`,
    )

    return this.caseNotificationService.sendCaseNotification(
      notificationDto.type,
      theCase,
      notificationDto.user,
    )
  }

  @Post(
    `case/:caseId/${
      messageEndpoint[MessageType.SUBPOENA_NOTIFICATION]
    }/:defendantId/:subpoenaId`,
  )
  @UseGuards(CaseHasExistedGuard, DefendantExistsGuard, SubpoenaExistsGuard)
  @ApiCreatedResponse({
    type: DeliverResponse,
    description: 'Sends a subpoena notification for an existing subpoena',
  })
  sendSubpoenaNotification(
    @Param('caseId') caseId: string,
    @Param('defendantId') defendantId: string,
    @Param('subpoenaId') subpoenaId: string,
    @CurrentCase() theCase: Case,
    @Body() notificationDto: SubpoenaNotificationDto,
  ): Promise<DeliverResponse> {
    this.logger.debug(
      `Sending ${notificationDto.type} subpoena notification for subpoena ${subpoenaId} of defendant ${defendantId} and case ${caseId}`,
    )

    return this.subpoenaNotificationService.sendSubpoenaNotification(
      notificationDto.type,
      theCase,
    )
  }

  @Post(
    `case/:caseId/${
      messageEndpoint[MessageType.DEFENDANT_NOTIFICATION]
    }/:defendantId`,
  )
  @UseGuards(CaseHasExistedGuard, DefendantExistsGuard)
  @ApiCreatedResponse({
    type: DeliverResponse,
    description:
      'Sends defendant related notifications for an existing defendant',
  })
  sendDefendantNotification(
    @Param('caseId') caseId: string,
    @Param('defendantId') defendantId: string,
    @CurrentCase() theCase: Case,
    @CurrentDefendant() defendant: Defendant,
    @Body() notificationDto: DefendantNotificationDto,
  ): Promise<DeliverResponse> {
    this.logger.debug(
      `Sending ${notificationDto.type} defendant notification for defendant ${defendantId} and case ${caseId}`,
    )

    return this.defendantNotificationService.sendDefendantNotification(
      notificationDto.type,
      defendant,
      theCase,
    )
  }

  @Post(messageEndpoint[MessageType.NOTIFICATION_DISPATCH])
  @ApiCreatedResponse({
    type: DeliverResponse,
    description: 'Dispatches notifications',
  })
  dispatchNotification(
    @Body() notificationDto: NotificationDispatchDto,
  ): Promise<DeliverResponse> {
    this.logger.debug(`Dispatching ${notificationDto.type} notification`)

    return this.notificationDispatchService.dispatchNotification(
      notificationDto.type,
    )
  }

  @Post(messageEndpoint[MessageType.INSTITUTION_NOTIFICATION])
  @ApiCreatedResponse({
    type: DeliverResponse,
    description: 'Sends an institution notification',
  })
  sendNotification(
    @Body() notificationDto: InstitutionNotificationDto,
  ): Promise<DeliverResponse> {
    this.logger.debug(`Sending ${notificationDto.type} notification`)

    return this.institutionNotificationService.sendNotification(
      notificationDto.type,
      notificationDto.prosecutorsOfficeId,
    )
  }
}
