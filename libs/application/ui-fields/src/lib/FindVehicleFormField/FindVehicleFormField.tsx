import {
  Box,
  Button,
  SkeletonLoader,
  AlertMessage,
  ActionCard,
  Bullet,
  BulletList,
  InputError,
} from '@island.is/island-ui/core'
import { InputController } from '@island.is/shared/form-fields'
import { useLocale } from '@island.is/localization'
import {
  BasicVehicleInformation,
  EnergyFundVehicleDetailsWithGrant,
  MachineDetails,
  VehicleOperatorChangeChecksByPermno,
  VehicleOwnerchangeChecksByPermno,
  VehiclePlateOrderChecksByPermno,
  VehicleValidationErrorMessage,
} from '@island.is/api/schema'
import { FieldBaseProps, FindVehicleField } from '@island.is/application/types'
import { formatText, getValueViaPath } from '@island.is/application/core'
import { useFormContext } from 'react-hook-form'
import { FC, useEffect, useState } from 'react'
import format from 'date-fns/format'
import { formatCurrency } from '@island.is/application/ui-components'
import {
  energyFundsLabel,
  mustInspectBeforeStreetRegistration,
} from './FindVehicleFormField.util'

interface VehicleDetails {
  permno: string
  make: string
  color: string
  isDebtLess?: boolean
  validationErrorMessages?: VehicleValidationErrorMessage[]
  requireMileage?: boolean
  mileageReading: string
}

interface Props extends FieldBaseProps {
  field: FindVehicleField
}

const extractCommonVehicleInfo = function (
  basicInfo: BasicVehicleInformation | null | undefined,
): VehicleDetails {
  if (!basicInfo) {
    throw new Error('Missing basic vehicle information')
  }

  return {
    permno: basicInfo.permno || '',
    make: basicInfo.make || '',
    color: basicInfo.color || '',
    requireMileage: basicInfo.requireMileage || false,
    mileageReading: (basicInfo?.mileageReading || '') as string,
  }
}

const isVehicleType = function <T>(
  response: unknown,
  typeName: string,
): response is T {
  return (
    response !== null &&
    typeof response === 'object' &&
    '__typename' in response &&
    response['__typename'] === typeName
  )
}

export const formatIsk = (value: number): string =>
  value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' kr.'

const extractDetails = function (
  response:
    | VehicleOwnerchangeChecksByPermno
    | VehiclePlateOrderChecksByPermno
    | VehicleOperatorChangeChecksByPermno
    | MachineDetails
    | EnergyFundVehicleDetailsWithGrant
    | unknown,
): VehicleDetails | MachineDetails | EnergyFundVehicleDetailsWithGrant {
  // Use type guards to determine the response type and access properties safely
  if (
    isVehicleType<VehicleOwnerchangeChecksByPermno>(
      response,
      'VehicleOwnerchangeChecksByPermno',
    )
  ) {
    return {
      ...extractCommonVehicleInfo(response.basicVehicleInformation),
      isDebtLess: response.isDebtLess ?? true,
      validationErrorMessages: response?.validationErrorMessages ?? [],
    }
  } else if (
    isVehicleType<VehiclePlateOrderChecksByPermno>(
      response,
      'VehiclePlateOrderChecksByPermno',
    )
  ) {
    return {
      ...extractCommonVehicleInfo(response.basicVehicleInformation),
      isDebtLess: true,
      validationErrorMessages: response?.validationErrorMessages ?? [],
    }
  } else if (
    isVehicleType<VehicleOperatorChangeChecksByPermno>(
      response,
      'VehicleOperatorChangeChecksByPermno',
    )
  ) {
    return {
      ...extractCommonVehicleInfo(response.basicVehicleInformation),
      isDebtLess: response.isDebtLess ?? true,
      validationErrorMessages: response?.validationErrorMessages ?? [],
    }
  } else if (isVehicleType<MachineDetails>(response, 'MachineDetails')) {
    return {
      ...response,
    }
  } else if (
    isVehicleType<EnergyFundVehicleDetailsWithGrant>(
      response,
      'EnergyFundVehicleDetailsWithGrant',
    )
  ) {
    return {
      ...response,
    }
  } else {
    // Handle unexpected response types
    throw new Error('Unexpected response type')
  }
}

export const FindVehicleFormField: FC<React.PropsWithChildren<Props>> = ({
  application,
  field,
  errors,
  setFieldLoadingState,
  setSubmitButtonDisabled,
}) => {
  const {
    getDetails,
    additionalErrors,
    findPlatePlaceholder,
    findVehicleButtonText,
    notFoundErrorMessage,
    notFoundErrorTitle,
    fallbackErrorMessage,
    validationErrors,
    hasErrorTitle,
    isNotDebtLessTag,
    requiredValidVehicleErrorMessage,
    isMachine,
    isEnergyFunds,
    energyFundsMessages,
  } = field

  const [plate, setPlate] = useState<string>(
    getValueViaPath(application.answers, `${field.id}.plate`, '') as string,
  )
  const { setValue } = useFormContext()
  const { formatMessage } = useLocale()
  const [vehicleNotFound, setVehicleNotFound] = useState<boolean>()
  const [buttonDisabled, setButtonDisabled] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState(false)
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails | null>(
    null,
  )
  const [machineDetails, setMachineDetails] = useState<MachineDetails | null>(
    null,
  )
  const [energyDetails, setEnergyDetails] =
    useState<EnergyFundVehicleDetailsWithGrant | null>(null)

  const [submitButtonDisabledCalled, setSubmitButtonDisabledCalled] =
    useState(false)
  const updateInputState = (value: string) => {
    const maxLength = isMachine ? 7 : 5
    setButtonDisabled(value.length !== maxLength && value.length !== 6)
    setPlate(value)
  }
  const findVehicleByPlate = async () => {
    setIsLoading(true)
    try {
      if (!getDetails) {
        throw new Error('getDetails function is not defined')
      }

      const response = await getDetails(plate.toUpperCase())
      const details:
        | VehicleDetails
        | MachineDetails
        | EnergyFundVehicleDetailsWithGrant = extractDetails(response)

      setValues(details)

      const isVehicleFound = !!details
      setVehicleNotFound(!isVehicleFound)
      setSubmitButtonDisabled?.(!isVehicleFound)
    } catch (error) {
      console.error('error', error)
      setVehicleNotFound(true)
      setVehicleDetails(null)
      setMachineDetails(null)
      setEnergyDetails(null)
      setSubmitButtonDisabled?.(true)
    } finally {
      setIsLoading(false)
    }
  }

  const setValues = (
    details:
      | MachineDetails
      | VehicleDetails
      | EnergyFundVehicleDetailsWithGrant,
  ) => {
    if (isEnergyFunds) {
      setEnergyFundsValues(details as EnergyFundVehicleDetailsWithGrant)
    } else if (isMachine) {
      setMachineValues(details as MachineDetails)
    } else {
      setVehicleValues(details as VehicleDetails)
    }
  }
  const setVehicleValues = (vehicleDetails: VehicleDetails) => {
    const vehicleDisabled =
      additionalErrors &&
      vehicleDetails &&
      (!vehicleDetails.isDebtLess ||
        !!vehicleDetails.validationErrorMessages?.length)

    const permno = vehicleDisabled ? '' : vehicleDetails.permno || ''

    setValue('findVehicle', true)

    setValue(`${field.id}.type`, vehicleDetails.make)
    setValue(`${field.id}.make`, vehicleDetails.make)
    setValue(`${field.id}.plate`, permno)
    setValue(`${field.id}.color`, vehicleDetails.color || undefined)
    setValue(`${field.id}.requireMileage`, vehicleDetails.requireMileage)
    setValue(`${field.id}.mileageReading`, vehicleDetails.mileageReading)

    setValue('vehicleMileage.requireMileage', vehicleDetails?.requireMileage)
    setValue('vehicleMileage.mileageReading', vehicleDetails?.mileageReading)

    if (permno) setValue('vehicleInfo.plate', permno)
    if (permno) setValue('vehicleInfo.type', vehicleDetails.make)

    setSubmitButtonDisabled?.(!vehicleDisabled || false)

    setVehicleDetails(vehicleDetails)
  }

  const setMachineValues = (machineDetails: MachineDetails) => {
    const machineDisabled = machineDetails.disabled

    if (application.typeId === 'StreetRegistration') {
      const mustInspect = mustInspectBeforeStreetRegistration(
        application?.externalData,
        machineDetails.regNumber || '',
      )
      if (mustInspect && !machineDisabled) {
        machineDetails = {
          ...machineDetails,
          disabled: true,
          status:
            validationErrors &&
            formatText(
              validationErrors.inspectBeforeRegistration,
              application,
              formatMessage,
            ),
        }
      }
    }
    setValue('findVehicle', true)

    setValue(
      `${field.id}.paymentRequiredForOwnerChange`,
      machineDetails.paymentRequiredForOwnerChange,
    )
    setValue(`${field.id}.regNumber`, machineDetails.regNumber)
    setValue(`${field.id}.category`, machineDetails.category)
    setValue(`${field.id}.type`, machineDetails.type || '')
    setValue(`${field.id}.subType`, machineDetails.subType || '')
    setValue(`${field.id}.plate`, machineDetails.plate || '')
    setValue(`${field.id}.ownerNumber`, machineDetails.ownerNumber || '')
    setValue(`${field.id}.id`, machineDetails.id)
    setValue(`${field.id}.date`, new Date().toISOString())

    setValue('pickMachine.id', machineDetails.id)
    setValue('pickMachine.isValid', machineDisabled ? undefined : true)

    setSubmitButtonDisabled?.(!machineDisabled || false)

    setMachineDetails(machineDetails)
  }

  const setEnergyFundsValues = (
    vehicleDetailsWithGrant: EnergyFundVehicleDetailsWithGrant,
  ) => {
    setValue('findVehicle', true)

    setValue(`${field.id}.type`, vehicleDetailsWithGrant.make)
    setValue(`${field.id}.plate`, plate)
    setValue(`${field.id}.color`, vehicleDetailsWithGrant.color || undefined)
    setValue(
      `${field.id}.newRegistrationDate`,
      vehicleDetailsWithGrant.newRegistrationDate || '',
    )
    setValue(
      `${field.id}.firstRegistrationDate`,
      vehicleDetailsWithGrant.firstRegistrationDate || '',
    )
    setValue(`${field.id}.vin`, vehicleDetailsWithGrant.vin)
    setValue(`${field.id}.grantAmount`, vehicleDetailsWithGrant.vehicleGrant)
    setValue(
      `${field.id}.grantItemCode`,
      vehicleDetailsWithGrant.vehicleGrantItemCode,
    )

    setEnergyDetails(vehicleDetailsWithGrant)
  }

  const vehicleDisabled =
    additionalErrors &&
    vehicleDetails &&
    (!vehicleDetails.isDebtLess ||
      !!vehicleDetails.validationErrorMessages?.length)

  const machineDisabled = machineDetails?.disabled

  useEffect(() => {
    if (!submitButtonDisabledCalled) {
      setSubmitButtonDisabled?.(true)
      setSubmitButtonDisabledCalled(true)
    }
    if (plate.length === 5 || plate.length === 6 || plate.length === 7) {
      setButtonDisabled(false)
    }
    if (vehicleDisabled || machineDisabled) {
      setSubmitButtonDisabled?.(true)
    }
    setFieldLoadingState?.(isLoading)
  }, [isLoading])

  return (
    <Box>
      <Box display="flex" alignItems="center">
        <Box flexGrow={1} marginRight={2}>
          <InputController
            id={`${field.id}.permno`}
            name={`${field.id}.permno`}
            label={
              findPlatePlaceholder &&
              formatText(findPlatePlaceholder, application, formatMessage)
            }
            onChange={(event) => {
              updateInputState(event.target.value)
            }}
            required={true}
            defaultValue={plate}
            rules={{
              required: true,
              validate: (value) => {
                if (isMachine) {
                  if (value.length !== 6 && value.length !== 7) {
                    return false
                  }
                } else {
                  if (value.length !== 5) {
                    return false
                  }
                }
                return true
              },
            }}
            maxLength={isMachine ? 7 : 5}
          />
        </Box>
        <Button onClick={findVehicleByPlate} disabled={buttonDisabled}>
          {findVehicleButtonText &&
            formatText(findVehicleButtonText, application, formatMessage)}
        </Button>
      </Box>

      <Box paddingTop={3}>
        {isLoading ? (
          <SkeletonLoader />
        ) : (
          <Box>
            {vehicleNotFound && (
              <AlertMessage
                type="error"
                title={
                  notFoundErrorTitle &&
                  formatText(notFoundErrorTitle, application, formatMessage)
                }
                message={
                  notFoundErrorMessage &&
                  formatMessage(notFoundErrorMessage.valueOf(), {
                    plate: plate.toUpperCase(),
                  })
                }
              />
            )}
            {vehicleDetails && !vehicleNotFound && (
              <ActionCard
                backgroundColor={vehicleDisabled ? 'red' : 'blue'}
                heading={vehicleDetails.make || ''}
                text={`${vehicleDetails.color} - ${vehicleDetails.permno}`}
                focused={true}
              />
            )}
            {machineDetails && !vehicleNotFound && (
              <ActionCard
                backgroundColor={machineDisabled ? 'red' : 'blue'}
                heading={machineDetails.regNumber || ''}
                text={`${machineDetails.type} ${machineDetails.subType}`}
                focused={true}
              />
            )}
            {energyDetails && !vehicleNotFound && (
              <ActionCard
                heading={`${energyDetails.make ?? ''} - ${
                  energyDetails.permno
                }`}
                text={`${energyDetails.color} - ${
                  energyFundsMessages && energyFundsMessages.registrationDate
                    ? formatText(
                        energyFundsMessages.registrationDate,
                        application,
                        formatMessage,
                      ) + ': '
                    : ''
                }${
                  energyDetails.newRegistrationDate
                    ? format(
                        new Date(energyDetails.newRegistrationDate),
                        'dd.MM.yyyy',
                      )
                    : ''
                }`}
                tag={{
                  label: energyFundsLabel(
                    energyDetails,
                    energyFundsMessages,
                    formatMessage,
                    formatCurrency,
                    application,
                  ),
                  outlined: true,
                  variant:
                    !energyDetails.hasReceivedSubsidy &&
                    energyDetails.vehicleGrant
                      ? 'blue'
                      : 'red',
                }}
              />
            )}
            {vehicleDetails && vehicleDisabled && (
              <Box marginTop={2}>
                <AlertMessage
                  type="error"
                  title={
                    hasErrorTitle &&
                    formatText(hasErrorTitle, application, formatMessage)
                  }
                  message={
                    <Box>
                      <BulletList>
                        {!vehicleDetails.isDebtLess && (
                          <Bullet>
                            {isNotDebtLessTag &&
                              formatText(
                                isNotDebtLessTag,
                                application,
                                formatMessage,
                              )}
                          </Bullet>
                        )}
                        {!!vehicleDetails.validationErrorMessages?.length &&
                          vehicleDetails.validationErrorMessages?.map(
                            (error) => {
                              const message = formatMessage(
                                (validationErrors &&
                                  getValueViaPath(
                                    validationErrors,
                                    error.errorNo || '',
                                  )) ||
                                  '',
                              )
                              const defaultMessage = error.defaultMessage
                              const fallbackMessage =
                                fallbackErrorMessage &&
                                formatText(
                                  fallbackErrorMessage,
                                  application,
                                  formatMessage,
                                ) +
                                  ' - ' +
                                  error.errorNo

                              return (
                                <Bullet>
                                  {message || defaultMessage || fallbackMessage}
                                </Bullet>
                              )
                            },
                          )}
                      </BulletList>
                    </Box>
                  }
                />
              </Box>
            )}
            {machineDetails && machineDisabled && (
              <Box marginTop={2}>
                <AlertMessage
                  type="error"
                  title={
                    hasErrorTitle &&
                    formatText(hasErrorTitle, application, formatMessage)
                  }
                  message={
                    <Box>
                      <BulletList>
                        {!!machineDetails.status?.length && (
                          <Bullet>{machineDetails.status}</Bullet>
                        )}
                      </BulletList>
                    </Box>
                  }
                />
              </Box>
            )}
            {!isLoading &&
              plate.length === 0 &&
              (errors as any)?.pickVehicle && (
                <InputError
                  errorMessage={
                    requiredValidVehicleErrorMessage &&
                    formatText(
                      requiredValidVehicleErrorMessage,
                      application,
                      formatMessage,
                    )
                  }
                />
              )}
          </Box>
        )}
      </Box>
    </Box>
  )
}
