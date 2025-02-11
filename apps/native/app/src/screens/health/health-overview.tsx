import { Alert, Button, Heading, Input, InputRow, Typography } from '@ui'
import React, { useCallback, useMemo, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import {
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import { NavigationFunctionComponent } from 'react-native-navigation'
import styled, { useTheme } from 'styled-components/native'

import {
  useGetHealthCenterQuery,
  useGetHealthInsuranceOverviewQuery,
  useGetMedicineDataQuery,
  useGetPaymentOverviewQuery,
  useGetPaymentStatusQuery,
} from '../../graphql/types/schema'
import { createNavigationOptionHooks } from '../../hooks/create-navigation-option-hooks'
import externalLinkIcon from '../../assets/icons/external-link.png'
import { getConfig } from '../../config'
import { useBrowser } from '../../lib/use-browser'
import { useConnectivityIndicator } from '../../hooks/use-connectivity-indicator'
import { navigateTo } from '../../lib/deep-linking'
import { useFeatureFlag } from '../../contexts/feature-flag-provider'

const Host = styled(SafeAreaView)`
  padding-horizontal: ${({ theme }) => theme.spacing[2]}px;
  margin-bottom: ${({ theme }) => theme.spacing[4]}px;
`

const ButtonWrapper = styled.View`
  flex-direction: row;
  margin-top: ${({ theme }) => theme.spacing[3]}px;
  margin-bottom: ${({ theme }) => -theme.spacing[1]}px;
  gap: ${({ theme }) => theme.spacing[2]}px;
  flex-wrap: wrap;
`

interface HeadingSectionProps {
  title: string
  onPress: () => void
}

const HeadingSection: React.FC<HeadingSectionProps> = ({ title, onPress }) => {
  const theme = useTheme()
  return (
    <TouchableOpacity onPress={onPress} style={{ marginTop: theme.spacing[2] }}>
      <Heading
        small
        button={
          <TouchableOpacity
            onPress={onPress}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Typography
              variant="heading5"
              color={theme.color.blue400}
              style={{ marginRight: 4 }}
            >
              <FormattedMessage id="button.seeAll" />
            </Typography>
            <Image source={externalLinkIcon} />
          </TouchableOpacity>
        }
      >
        {title}
      </Heading>
    </TouchableOpacity>
  )
}

const { getNavigationOptions, useNavigationOptions } =
  createNavigationOptionHooks((theme, intl) => ({
    topBar: {
      title: {
        text: intl.formatMessage({ id: 'health.overview.screenTitle' }),
      },
    },
  }))

export const HealthOverviewScreen: NavigationFunctionComponent = ({
  componentId,
}) => {
  useNavigationOptions(componentId)
  const intl = useIntl()
  const theme = useTheme()
  const { openBrowser } = useBrowser()
  const origin = getConfig().apiUrl.replace(/\/api$/, '')
  const [refetching, setRefetching] = useState(false)
  const { width } = useWindowDimensions()
  const buttonStyle = { flex: 1, minWidth: width * 0.5 - theme.spacing[3] }
  const isVaccinationsEnabled = useFeatureFlag('isVaccinationsEnabled', false)

  const now = useMemo(() => new Date().toISOString(), [])

  const medicinePurchaseRes = useGetMedicineDataQuery()
  const healthInsuranceRes = useGetHealthInsuranceOverviewQuery()
  const healthCenterRes = useGetHealthCenterQuery()
  const paymentStatusRes = useGetPaymentStatusQuery()
  const paymentOverviewRes = useGetPaymentOverviewQuery({
    variables: {
      input: {
        // The items we are fethcing are static and are not using the dates for calculation,
        // it is though not allowed to skip them or send and empty string so we send current date for both
        dateFrom: now,
        dateTo: now,
        serviceTypeCode: '',
      },
    },
  })

  const medicinePurchaseData =
    medicinePurchaseRes.data?.rightsPortalDrugPeriods?.[0]
  const healthInsuranceData =
    healthInsuranceRes.data?.rightsPortalInsuranceOverview
  const paymentStatusData = paymentStatusRes.data?.rightsPortalCopaymentStatus
  const paymentOverviewData =
    paymentOverviewRes.data?.rightsPortalPaymentOverview?.items?.[0]

  const isMedicinePeriodActive =
    medicinePurchaseData?.active ||
    (medicinePurchaseData?.dateTo &&
      new Date(medicinePurchaseData.dateTo) > new Date())

  useConnectivityIndicator({
    componentId,
    refetching,
    queryResult: [
      medicinePurchaseRes,
      healthInsuranceRes,
      healthCenterRes,
      paymentStatusRes,
      paymentOverviewRes,
    ],
  })

  const onRefresh = useCallback(async () => {
    setRefetching(true)

    try {
      const promises = [
        medicinePurchaseRes.refetch(),
        healthInsuranceRes.refetch(),
        healthCenterRes.refetch(),
        paymentStatusRes.refetch(),
        paymentOverviewRes.refetch(),
      ]
      await Promise.all(promises)
    } catch (e) {
      // noop
    } finally {
      setRefetching(false)
    }
  }, [
    medicinePurchaseRes,
    healthInsuranceRes,
    healthCenterRes,
    paymentStatusRes,
    paymentOverviewRes,
  ])

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refetching} onRefresh={onRefresh} />
        }
        style={{ flex: 1 }}
      >
        <Host>
          <Heading>
            <FormattedMessage
              id="health.overview.title"
              defaultMessage="Heilsan mín"
            />
          </Heading>
          <Typography>
            <FormattedMessage
              id="health.overview.description"
              defaultMessage="Hér finnur þú þín heilsufarsgögn, heilsugæslu og sjúkratryggingar"
            />
          </Typography>
          <ButtonWrapper>
            {isVaccinationsEnabled && (
              <Button
                title={intl.formatMessage({
                  id: 'health.overview.vaccinations',
                })}
                isOutlined
                isUtilityButton
                iconStyle={{ tintColor: theme.color.dark300 }}
                style={buttonStyle}
                ellipsis
                onPress={() => navigateTo('/vaccinations', componentId)}
              />
            )}
            <Button
              title={intl.formatMessage({ id: 'health.overview.therapy' })}
              isOutlined
              isUtilityButton
              icon={externalLinkIcon}
              iconStyle={{ tintColor: theme.color.dark300 }}
              style={buttonStyle}
              ellipsis
              onPress={() =>
                openBrowser(
                  `${origin}/minarsidur/heilsa/thjalfun/sjukrathjalfun`,
                  componentId,
                )
              }
            />
            <Button
              title={intl.formatMessage({
                id: 'health.overview.aidsAndNutrition',
              })}
              isOutlined
              isUtilityButton
              icon={externalLinkIcon}
              iconStyle={{ tintColor: theme.color.dark300 }}
              style={{
                ...buttonStyle,
                maxWidth: width * 0.5 - theme.spacing[3],
              }}
              ellipsis
              onPress={() =>
                openBrowser(
                  `${origin}/minarsidur/heilsa/hjalpartaeki-og-naering`,
                  componentId,
                )
              }
            />
          </ButtonWrapper>
          <HeadingSection
            title={intl.formatMessage({ id: 'health.overview.healthCenter' })}
            onPress={() =>
              openBrowser(
                `${origin}/minarsidur/heilsa/heilsugaesla`,
                componentId,
              )
            }
          />
          <InputRow background>
            <Input
              label={intl.formatMessage({
                id: 'health.overview.healthCenter',
              })}
              value={
                healthCenterRes.data
                  ?.rightsPortalHealthCenterRegistrationHistory?.current
                  ?.healthCenterName ??
                intl.formatMessage({
                  id: 'health.overview.noHealthCenterRegistered',
                })
              }
              loading={healthCenterRes.loading && !healthCenterRes.data}
              error={healthCenterRes.error && !healthCenterRes.data}
              darkBorder
            />
          </InputRow>
          <InputRow background>
            <Input
              label={intl.formatMessage({
                id: 'health.overview.physician',
              })}
              value={
                healthCenterRes.data
                  ?.rightsPortalHealthCenterRegistrationHistory?.current
                  ?.doctor ??
                intl.formatMessage({
                  id: 'health.overview.noPhysicianRegistered',
                })
              }
              loading={healthCenterRes.loading && !healthCenterRes.data}
              error={healthCenterRes.error && !healthCenterRes.data}
              noBorder
            />
          </InputRow>
          <HeadingSection
            title={intl.formatMessage({ id: 'health.overview.statusOfRights' })}
            onPress={() =>
              openBrowser(`${origin}/minarsidur/heilsa/yfirlit`, componentId)
            }
          />
          {healthInsuranceData?.isInsured || healthInsuranceRes.loading ? (
            <InputRow background>
              <Input
                label={intl.formatMessage({
                  id: 'health.overview.insuredFrom',
                })}
                value={
                  healthInsuranceData?.from
                    ? intl.formatDate(healthInsuranceData.from)
                    : null
                }
                loading={healthInsuranceRes.loading && !healthInsuranceRes.data}
                error={healthInsuranceRes.error && !healthInsuranceRes.data}
                noBorder
              />
              <Input
                label={intl.formatMessage({
                  id: 'health.overview.status',
                })}
                value={healthInsuranceData?.status?.display}
                loading={healthInsuranceRes.loading && !healthInsuranceRes.data}
                error={healthInsuranceRes.error && !healthInsuranceRes.data}
                noBorder
              />
            </InputRow>
          ) : (
            <Alert
              type="info"
              title={intl.formatMessage({ id: 'health.overview.notInsured' })}
              message={healthInsuranceData?.explanation ?? ''}
              hasBorder
            />
          )}
          <HeadingSection
            title={intl.formatMessage({
              id: 'health.overview.coPayments',
            })}
            onPress={() =>
              openBrowser(
                `${origin}/minarsidur/heilsa/greidslur/greidsluthatttaka`,
                componentId,
              )
            }
          />
          <InputRow background>
            <Input
              label={intl.formatMessage({
                id: 'health.overview.maxMonthlyPayment',
              })}
              value={
                paymentStatusData?.maximumMonthlyPayment
                  ? `${intl.formatNumber(
                      paymentStatusData?.maximumMonthlyPayment,
                    )} kr.`
                  : '0 kr.'
              }
              loading={paymentStatusRes.loading && !paymentStatusRes.data}
              error={paymentStatusRes.error && !paymentStatusRes.data}
              darkBorder
            />
          </InputRow>
          <InputRow background>
            <Input
              label={intl.formatMessage({
                id: 'health.overview.paymentLimit',
              })}
              value={
                paymentStatusData?.maximumPayment
                  ? `${intl.formatNumber(
                      paymentStatusData?.maximumPayment,
                    )} kr.`
                  : '0 kr.'
              }
              loading={paymentStatusRes.loading && !paymentStatusRes.data}
              error={paymentStatusRes.error && !paymentStatusRes.data}
              darkBorder
            />
          </InputRow>
          <InputRow background>
            <Input
              label={intl.formatMessage({
                id: 'health.overview.paymentCredit',
              })}
              value={
                paymentOverviewData?.credit
                  ? `${intl.formatNumber(paymentOverviewData?.credit)} kr.`
                  : '0 kr.'
              }
              loading={paymentOverviewRes.loading && !paymentOverviewRes.data}
              error={paymentOverviewRes.error && !paymentOverviewRes.data}
              noBorder
            />
            <Input
              label={intl.formatMessage({
                id: 'health.overview.paymentDebt',
              })}
              value={
                paymentOverviewData?.debt
                  ? `${intl.formatNumber(paymentOverviewData?.debt)} kr.`
                  : '0 kr.'
              }
              loading={paymentOverviewRes.loading && !paymentOverviewRes.data}
              error={paymentOverviewRes.error && !paymentOverviewRes.data}
              noBorder
            />
          </InputRow>
          <HeadingSection
            title={intl.formatMessage({
              id: 'health.overview.medicinePurchase',
            })}
            onPress={() =>
              openBrowser(
                `${origin}/minarsidur/heilsa/lyf/lyfjakaup`,
                componentId,
              )
            }
          />
          <InputRow background>
            <Input
              label={intl.formatMessage({
                id: 'health.overview.period',
              })}
              value={
                medicinePurchaseData?.dateFrom && medicinePurchaseData?.dateTo
                  ? `${intl.formatDate(
                      medicinePurchaseData.dateFrom,
                    )} - ${intl.formatDate(medicinePurchaseData.dateTo)}`
                  : ''
              }
              loading={medicinePurchaseRes.loading && !medicinePurchaseRes.data}
              error={medicinePurchaseRes.error && !medicinePurchaseRes.data}
              darkBorder
            />
          </InputRow>
          <InputRow background>
            <Input
              label={intl.formatMessage({
                id: 'health.overview.levelStatus',
              })}
              value={
                medicinePurchaseData?.levelNumber &&
                medicinePurchaseData?.levelPercentage
                  ? intl.formatMessage(
                      {
                        id: 'health.overview.levelStatusValue',
                      },
                      {
                        level: medicinePurchaseData?.levelNumber,
                        percentage: medicinePurchaseData?.levelPercentage,
                      },
                    )
                  : ''
              }
              loading={medicinePurchaseRes.loading && !medicinePurchaseRes.data}
              error={medicinePurchaseRes.error && !medicinePurchaseRes.data}
              noBorder
              warningText={
                !isMedicinePeriodActive
                  ? intl.formatMessage({
                      id: 'health.overview.medicinePurchaseNoActivePeriodWarning',
                    })
                  : ''
              }
            />
          </InputRow>
        </Host>
      </ScrollView>
    </View>
  )
}

HealthOverviewScreen.options = getNavigationOptions
