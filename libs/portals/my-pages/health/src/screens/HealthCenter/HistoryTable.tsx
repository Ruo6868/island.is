import { useLocale, useNamespaces } from '@island.is/localization'
import { Box, Table as T, Text } from '@island.is/island-ui/core'
import {
  DownloadFileButtons,
  formatDate,
  m,
} from '@island.is/portals/my-pages/core'
import { messages } from '../../lib/messages'
import { RightsPortalHealthCenterRecord } from '@island.is/api/schema'
import { exportHealthCenterFile } from '../../utils/FileBreakdown'

interface Props {
  history: Array<RightsPortalHealthCenterRecord>
}

const HistoryTable = ({ history }: Props) => {
  useNamespaces('sp.health')
  const { formatMessage } = useLocale()

  return (
    <Box marginTop="containerGutter">
      <Text variant="h5" fontWeight="semiBold" paddingBottom={2}>
        {formatMessage(m.registrationHistory)}
      </Text>
      <T.Table>
        <T.Head>
          <T.Row>
            <T.HeadData>
              <Text variant="medium" fontWeight="medium">
                {formatMessage(messages.from)}
              </Text>
            </T.HeadData>
            <T.HeadData>
              <Text variant="medium" fontWeight="medium">
                {formatMessage(messages.to)}
              </Text>
            </T.HeadData>
            <T.HeadData>
              <Text variant="medium" fontWeight="medium">
                {formatMessage(m.healthCenter)}
              </Text>
            </T.HeadData>
            <T.HeadData>
              <Text variant="medium" fontWeight="medium">
                {formatMessage(messages.doctor)}
              </Text>
            </T.HeadData>
          </T.Row>
        </T.Head>
        <T.Body>
          {history.map((rowItem, index) => (
            <T.Row key={index}>
              <T.Data>
                <Text variant="medium">
                  {rowItem.dateFrom ? formatDate(rowItem.dateFrom) : ''}
                </Text>
              </T.Data>
              <T.Data>
                <Text variant="medium">
                  {rowItem.dateTo ? formatDate(rowItem.dateTo) : ''}
                </Text>
              </T.Data>
              <T.Data>
                <Text variant="medium">{rowItem.healthCenterName ?? ''}</Text>
              </T.Data>
              <T.Data>
                <Text variant="medium">
                  {rowItem.doctor ??
                    formatMessage(messages.healthCenterNoDoctor)}
                </Text>
              </T.Data>
            </T.Row>
          ))}
        </T.Body>
      </T.Table>
      <DownloadFileButtons
        BoxProps={{
          paddingTop: 2,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flexEnd',
        }}
        buttons={[
          {
            text: formatMessage(m.getAsExcel),
            onClick: () => exportHealthCenterFile(history ?? [], 'xlsx'),
          },
        ]}
      />
    </Box>
  )
}

export default HistoryTable
