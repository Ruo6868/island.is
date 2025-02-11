import { uuid } from 'uuidv4'

import { MessageService, MessageType } from '@island.is/judicial-system/message'
import {
  CaseNotificationType,
  CaseType,
  DefendantNotificationType,
  DefenderChoice,
  User,
} from '@island.is/judicial-system/types'

import { createTestingDefendantModule } from '../createTestingDefendantModule'

import { Case } from '../../../case'
import { UpdateDefendantDto } from '../../dto/updateDefendant.dto'
import { Defendant } from '../../models/defendant.model'

interface Then {
  result: Defendant
  error: Error
}

type GivenWhenThen = (
  defendantUpdate: UpdateDefendantDto,
  courtCaseNumber?: string,
) => Promise<Then>

describe('DefendantController - Update', () => {
  const user = { id: uuid() } as User
  const caseId = uuid()
  const defendantId = uuid()
  const defendant = {
    id: defendantId,
    caseId,
    nationalId: uuid(),
    defenderEmail: uuid(),
  } as Defendant

  let mockMessageService: MessageService
  let mockDefendantModel: typeof Defendant
  let givenWhenThen: GivenWhenThen

  beforeEach(async () => {
    const { messageService, defendantModel, defendantController } =
      await createTestingDefendantModule()

    mockMessageService = messageService
    mockDefendantModel = defendantModel

    const mockUpdate = mockDefendantModel.update as jest.Mock
    mockUpdate.mockRejectedValue(new Error('Some error'))

    givenWhenThen = async (
      defendantUpdate: UpdateDefendantDto,
      courtCaseNumber?: string,
    ) => {
      const then = {} as Then

      await defendantController
        .update(
          caseId,
          defendantId,
          user,
          { id: caseId, courtCaseNumber, type: CaseType.INDICTMENT } as Case,
          defendant,
          defendantUpdate,
        )
        .then((result) => (then.result = result))
        .catch((error) => (then.error = error))

      return then
    }
  })

  describe('defendant updated', () => {
    const defendantUpdate = { noNationalId: true }
    const updatedDefendant = { ...defendant, ...defendantUpdate }
    let then: Then

    beforeEach(async () => {
      const mockUpdate = mockDefendantModel.update as jest.Mock
      mockUpdate.mockResolvedValueOnce([1, [updatedDefendant]])

      then = await givenWhenThen(defendantUpdate)
    })

    it('should update the defendant without queuing', () => {
      expect(mockDefendantModel.update).toHaveBeenCalledWith(defendantUpdate, {
        where: { id: defendantId, caseId },
        returning: true,
      })
      expect(then.result).toBe(updatedDefendant)
      expect(mockMessageService.sendMessagesToQueue).not.toHaveBeenCalled()
    })
  })

  describe('defendant updated after case is delivered to court', () => {
    const defendantUpdate = { name: 'John Doe' }
    const updatedDefendant = { ...defendant, ...defendantUpdate }

    beforeEach(async () => {
      const mockUpdate = mockDefendantModel.update as jest.Mock
      mockUpdate.mockResolvedValueOnce([1, [updatedDefendant]])

      await givenWhenThen(defendantUpdate, uuid())
    })

    it('should not queue', () => {
      expect(mockMessageService.sendMessagesToQueue).not.toHaveBeenCalled()
    })
  })

  describe('defendant nationalId removed after case is delivered to court', () => {
    const defendantUpdate = { noNationalId: true }
    const updatedDefendant = { ...defendant, ...defendantUpdate }

    beforeEach(async () => {
      const mockUpdate = mockDefendantModel.update as jest.Mock
      mockUpdate.mockResolvedValueOnce([1, [updatedDefendant]])

      await givenWhenThen(defendantUpdate, uuid())
    })

    it('should queue messages', () => {
      expect(mockMessageService.sendMessagesToQueue).toHaveBeenCalledWith([
        {
          type: MessageType.DELIVERY_TO_COURT_DEFENDANT,
          user,
          caseId,
          elementId: defendantId,
        },
      ])
    })
  })

  describe('defendant nationalId changed after case is delivered to court', () => {
    const defendantUpdate = { nationalId: uuid() }
    const updatedDefendant = { ...defendant, ...defendantUpdate }

    beforeEach(async () => {
      const mockUpdate = mockDefendantModel.update as jest.Mock
      mockUpdate.mockResolvedValueOnce([1, [updatedDefendant]])

      await givenWhenThen(defendantUpdate, uuid())
    })

    it('should queue messages', () => {
      expect(mockMessageService.sendMessagesToQueue).toHaveBeenCalledWith([
        {
          type: MessageType.NOTIFICATION,
          user,
          caseId,
          body: { type: CaseNotificationType.DEFENDANTS_NOT_UPDATED_AT_COURT },
        },
        {
          type: MessageType.DELIVERY_TO_COURT_DEFENDANT,
          user,
          caseId,
          elementId: defendantId,
        },
      ])
    })
  })

  describe(`defendant's defender email changed after case is delivered to court`, () => {
    const defendantUpdate = { defenderEmail: uuid() }
    const updatedDefendant = { ...defendant, ...defendantUpdate }

    beforeEach(async () => {
      const mockUpdate = mockDefendantModel.update as jest.Mock
      mockUpdate.mockResolvedValueOnce([1, [updatedDefendant]])

      await givenWhenThen(defendantUpdate, uuid())
    })

    it('should queue messages', () => {
      expect(mockMessageService.sendMessagesToQueue).toHaveBeenCalledWith([
        {
          type: MessageType.DELIVERY_TO_COURT_DEFENDANT,
          user,
          caseId,
          elementId: defendantId,
        },
      ])
    })
  })

  describe.each([
    { isDefenderChoiceConfirmed: true, shouldSendEmail: true },
    { isDefenderChoiceConfirmed: false, shouldSendEmail: false },
  ])(
    "defendant's defender choice is changed",
    ({ isDefenderChoiceConfirmed, shouldSendEmail }) => {
      const defendantUpdate = { isDefenderChoiceConfirmed }
      const updatedDefendant = {
        defenderChoice: DefenderChoice.CHOOSE,
        ...defendant,
        ...defendantUpdate,
      }

      beforeEach(async () => {
        const mockUpdate = mockDefendantModel.update as jest.Mock
        mockUpdate.mockResolvedValueOnce([1, [updatedDefendant]])

        await givenWhenThen(defendantUpdate, uuid())
      })

      if (shouldSendEmail) {
        it('should queue message if defender has been confirmed', () => {
          expect(mockMessageService.sendMessagesToQueue).toHaveBeenCalledWith([
            {
              type: MessageType.DEFENDANT_NOTIFICATION,
              caseId,
              body: { type: DefendantNotificationType.DEFENDER_ASSIGNED },
              elementId: defendantId,
            },
          ])
        })
      } else {
        it('should not queue message if defender has not been confirmed', () => {
          expect(mockMessageService.sendMessagesToQueue).not.toHaveBeenCalled()
        })
      }
    },
  )

  describe('defendant update fails', () => {
    let then: Then

    beforeEach(async () => {
      then = await givenWhenThen({})
    })

    it('should throw Error', () => {
      expect(then.error).toBeInstanceOf(Error)
      expect(then.error.message).toBe('Some error')
    })
  })
})
