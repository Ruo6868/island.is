import React from 'react'
import { useIntl } from 'react-intl'
import { Text, UploadFile } from '@island.is/island-ui/core'
import { incomeFilesForm } from '../../lib/messages'
import { FAFieldBaseProps, OverrideAnswerSchema, UploadFileType } from '../..'
import { Files } from '..'

const IncomeFilesForm = ({ field, application }: FAFieldBaseProps) => {
  const { formatMessage } = useIntl()
  const { id, answers } = application

  return (
    <>
      <Text marginTop={2} marginBottom={[3, 3, 5]}>
        {formatMessage(incomeFilesForm.general.description)}
      </Text>
      <Files
        fileKey={field.id as UploadFileType}
        uploadFiles={
          answers[field.id as keyof OverrideAnswerSchema] as UploadFile[]
        }
        folderId={id}
      />
    </>
  )
}

export default IncomeFilesForm
