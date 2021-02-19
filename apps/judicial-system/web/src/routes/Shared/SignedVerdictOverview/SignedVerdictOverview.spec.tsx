import React from 'react'
import { render, waitFor, screen } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'

import {
  mockCaseQueries,
  mockJudgeQuery,
  mockProsecutorQuery,
} from '@island.is/judicial-system-web/src/utils/mocks'
import { UserProvider } from '@island.is/judicial-system-web/src/shared-components'
import { formatDate, TIME_FORMAT } from '@island.is/judicial-system/formatters'

import * as Constants from '@island.is/judicial-system-web/src/utils/constants'
import { SignedVerdictOverview } from './SignedVerdictOverview'

describe('Signed Verdict Overview route', () => {
  describe('Rejected case', () => {
    test('should have the correct title if case is not accepted', async () => {
      render(
        <MockedProvider
          mocks={[...mockCaseQueries, ...mockJudgeQuery]}
          addTypename={false}
        >
          <MemoryRouter
            initialEntries={[`${Constants.SIGNED_VERDICT_OVERVIEW}/test_id_2`]}
          >
            <UserProvider>
              <Route path={`${Constants.SIGNED_VERDICT_OVERVIEW}/:id`}>
                <SignedVerdictOverview />
              </Route>
            </UserProvider>
          </MemoryRouter>
        </MockedProvider>,
      )

      expect(
        await screen.findByText('Kröfu hafnað', { selector: 'h1' }),
      ).toBeInTheDocument()
    })

    test('should have the correct subtitle if case is not accepted', async () => {
      render(
        <MockedProvider
          mocks={[...mockCaseQueries, ...mockJudgeQuery]}
          addTypename={false}
        >
          <MemoryRouter
            initialEntries={[`${Constants.SIGNED_VERDICT_OVERVIEW}/test_id_4`]}
          >
            <UserProvider>
              <Route path={`${Constants.SIGNED_VERDICT_OVERVIEW}/:id`}>
                <SignedVerdictOverview />
              </Route>
            </UserProvider>
          </MemoryRouter>
        </MockedProvider>,
      )

      expect(
        await screen.findByText('Úrskurðað 16. september 2020 kl. 19:51'),
      ).toBeInTheDocument()
    })

    test('should not show restrictions tag if case is rejected event though there are restrictions', async () => {
      render(
        <MockedProvider
          mocks={[...mockCaseQueries, ...mockJudgeQuery]}
          addTypename={false}
        >
          <MemoryRouter
            initialEntries={[`${Constants.SIGNED_VERDICT_OVERVIEW}/test_id_2`]}
          >
            <UserProvider>
              <Route path={`${Constants.SIGNED_VERDICT_OVERVIEW}/:id`}>
                <SignedVerdictOverview />
              </Route>
            </UserProvider>
          </MemoryRouter>
        </MockedProvider>,
      )

      expect(
        await waitFor(() =>
          screen.queryByText('Heimsóknarbann', { selector: 'span' }),
        ),
      ).not.toBeInTheDocument()
    })

    test('should not show a button for extention', async () => {
      render(
        <MockedProvider
          mocks={[...mockCaseQueries, ...mockProsecutorQuery]}
          addTypename={false}
        >
          <MemoryRouter
            initialEntries={[`${Constants.SIGNED_VERDICT_OVERVIEW}/test_id_2`]}
          >
            <UserProvider>
              <Route path={`${Constants.SIGNED_VERDICT_OVERVIEW}/:id`}>
                <SignedVerdictOverview />
              </Route>
            </UserProvider>
          </MemoryRouter>
        </MockedProvider>,
      )

      expect(
        await waitFor(() =>
          screen.queryByRole('button', { name: 'Framlengja gæslu' }),
        ),
      ).not.toBeInTheDocument()

      expect(
        await screen.findByText(
          'Ekki hægt að framlengja gæsluvarðhald sem var hafnað.',
        ),
      ).toBeInTheDocument()
    })
  })

  describe('Accepted case with active custody', () => {
    test('should have the correct title', async () => {
      render(
        <MockedProvider
          mocks={[...mockCaseQueries, ...mockJudgeQuery]}
          addTypename={false}
        >
          <MemoryRouter
            initialEntries={[`${Constants.SIGNED_VERDICT_OVERVIEW}/test_id_5`]}
          >
            <UserProvider>
              <Route path={`${Constants.SIGNED_VERDICT_OVERVIEW}/:id`}>
                <SignedVerdictOverview />
              </Route>
            </UserProvider>
          </MemoryRouter>
        </MockedProvider>,
      )

      expect(
        await screen.findByText('Gæsluvarðhald virkt', { selector: 'h1' }),
      ).toBeInTheDocument()
    })

    test('should have the correct subtitle', async () => {
      const date = '2020-09-25T19:50:08.033Z'
      render(
        <MockedProvider
          mocks={[...mockCaseQueries, ...mockJudgeQuery]}
          addTypename={false}
        >
          <MemoryRouter
            initialEntries={[`${Constants.SIGNED_VERDICT_OVERVIEW}/test_id_5`]}
          >
            <UserProvider>
              <Route path={`${Constants.SIGNED_VERDICT_OVERVIEW}/:id`}>
                <SignedVerdictOverview />
              </Route>
            </UserProvider>
          </MemoryRouter>
        </MockedProvider>,
      )

      expect(
        await screen.findByText(
          `Gæsla til ${formatDate(date, 'PPP')} kl. ${formatDate(
            date,
            TIME_FORMAT,
          )}`,
        ),
      ).toBeInTheDocument()
    })

    test('should show restrictions tag if there are restrictions', async () => {
      render(
        <MockedProvider
          mocks={[...mockCaseQueries, ...mockJudgeQuery]}
          addTypename={false}
        >
          <MemoryRouter
            initialEntries={[`${Constants.SIGNED_VERDICT_OVERVIEW}/test_id`]}
          >
            <UserProvider>
              <Route path={`${Constants.SIGNED_VERDICT_OVERVIEW}/:id`}>
                <SignedVerdictOverview />
              </Route>
            </UserProvider>
          </MemoryRouter>
        </MockedProvider>,
      )

      expect(
        await screen.findByText('Fjölmiðlabann', { selector: 'span' }),
      ).toBeInTheDocument()
    })

    test('should not show a button for extention because the user is a judge', async () => {
      render(
        <MockedProvider
          mocks={[...mockCaseQueries, ...mockJudgeQuery]}
          addTypename={false}
        >
          <MemoryRouter
            initialEntries={[`${Constants.SIGNED_VERDICT_OVERVIEW}/test_id`]}
          >
            <UserProvider>
              <Route path={`${Constants.SIGNED_VERDICT_OVERVIEW}/:id`}>
                <SignedVerdictOverview />
              </Route>
            </UserProvider>
          </MemoryRouter>
        </MockedProvider>,
      )

      expect(
        await waitFor(() =>
          screen.queryByRole('button', { name: 'Framlengja gæslu' }),
        ),
      ).not.toBeInTheDocument()
    })
  })

  describe('Accepted case with custody end time in the past', () => {
    test('should have the correct title', async () => {
      render(
        <MockedProvider
          mocks={[...mockCaseQueries, ...mockJudgeQuery]}
          addTypename={false}
        >
          <MemoryRouter
            initialEntries={[`${Constants.SIGNED_VERDICT_OVERVIEW}/test_id_6`]}
          >
            <UserProvider>
              <Route path={`${Constants.SIGNED_VERDICT_OVERVIEW}/:id`}>
                <SignedVerdictOverview />
              </Route>
            </UserProvider>
          </MemoryRouter>
        </MockedProvider>,
      )

      expect(
        await screen.findByText('Gæsluvarðhaldi lokið', { selector: 'h1' }),
      ).toBeInTheDocument()
    })

    test('should have the correct subtitle', async () => {
      const dateInPast = '2020-09-24T19:50:08.033Z'

      render(
        <MockedProvider
          mocks={[...mockCaseQueries, ...mockJudgeQuery]}
          addTypename={false}
        >
          <MemoryRouter
            initialEntries={[`${Constants.SIGNED_VERDICT_OVERVIEW}/test_id_6`]}
          >
            <UserProvider>
              <Route path={`${Constants.SIGNED_VERDICT_OVERVIEW}/:id`}>
                <SignedVerdictOverview />
              </Route>
            </UserProvider>
          </MemoryRouter>
        </MockedProvider>,
      )

      expect(
        await screen.findByText(
          `Gæsla rann út ${formatDate(dateInPast, 'PPP')} kl. ${formatDate(
            dateInPast,
            TIME_FORMAT,
          )}`,
        ),
      ).toBeInTheDocument()
    })

    test('should display restriction tags if there are restrictions', async () => {
      render(
        <MockedProvider
          mocks={[...mockCaseQueries, ...mockJudgeQuery]}
          addTypename={false}
        >
          <MemoryRouter
            initialEntries={[`${Constants.SIGNED_VERDICT_OVERVIEW}/test_id_6`]}
          >
            <UserProvider>
              <Route path={`${Constants.SIGNED_VERDICT_OVERVIEW}/:id`}>
                <SignedVerdictOverview />
              </Route>
            </UserProvider>
          </MemoryRouter>
        </MockedProvider>,
      )

      expect(
        await screen.findByText('Heimsóknarbann', { selector: 'span' }),
      ).toBeInTheDocument()
    })

    test('should not show a button for extention because the user is a judge', async () => {
      render(
        <MockedProvider
          mocks={[...mockCaseQueries, ...mockJudgeQuery]}
          addTypename={false}
        >
          <MemoryRouter
            initialEntries={[`${Constants.SIGNED_VERDICT_OVERVIEW}/test_id`]}
          >
            <UserProvider>
              <Route path={`${Constants.SIGNED_VERDICT_OVERVIEW}/:id`}>
                <SignedVerdictOverview />
              </Route>
            </UserProvider>
          </MemoryRouter>
        </MockedProvider>,
      )

      expect(
        await waitFor(() =>
          screen.queryByRole('button', { name: 'Framlengja gæslu' }),
        ),
      ).not.toBeInTheDocument()
    })

    test('should display an indicator that the case cannot be extended', async () => {
      render(
        <MockedProvider
          mocks={[...mockCaseQueries, ...mockProsecutorQuery]}
          addTypename={false}
        >
          <MemoryRouter
            initialEntries={[`${Constants.SIGNED_VERDICT_OVERVIEW}/test_id_8`]}
          >
            <UserProvider>
              <Route path={`${Constants.SIGNED_VERDICT_OVERVIEW}/:id`}>
                <SignedVerdictOverview />
              </Route>
            </UserProvider>
          </MemoryRouter>
        </MockedProvider>,
      )

      expect(
        await screen.findByText(
          'Ekki hægt að framlengja kröfu þegar dómari hefur úrskurðað um annað en dómkröfur sögðu til um.',
        ),
      ).toBeInTheDocument()
    })
  })

  describe('Accepted case with active travel ban', () => {
    test('should have the correct title', async () => {
      render(
        <MockedProvider
          mocks={[...mockCaseQueries, ...mockJudgeQuery]}
          addTypename={false}
        >
          <MemoryRouter
            initialEntries={[`${Constants.SIGNED_VERDICT_OVERVIEW}/test_id_7`]}
          >
            <UserProvider>
              <Route path={`${Constants.SIGNED_VERDICT_OVERVIEW}/:id`}>
                <SignedVerdictOverview />
              </Route>
            </UserProvider>
          </MemoryRouter>
        </MockedProvider>,
      )

      expect(
        await screen.findByText('Farbann virkt', { selector: 'h1' }),
      ).toBeInTheDocument()
    })

    test('should have the correct subtitle', async () => {
      const date = '2020-09-25T19:50:08.033Z'
      render(
        <MockedProvider
          mocks={[...mockCaseQueries, ...mockJudgeQuery]}
          addTypename={false}
        >
          <MemoryRouter
            initialEntries={[`${Constants.SIGNED_VERDICT_OVERVIEW}/test_id_7`]}
          >
            <UserProvider>
              <Route path={`${Constants.SIGNED_VERDICT_OVERVIEW}/:id`}>
                <SignedVerdictOverview />
              </Route>
            </UserProvider>
          </MemoryRouter>
        </MockedProvider>,
      )

      expect(
        await screen.findByText(
          `Farbann til ${formatDate(date, 'PPP')} kl. ${formatDate(
            date,
            TIME_FORMAT,
          )}`,
        ),
      ).toBeInTheDocument()
    })

    test('should not show a button for extention because the user is a judge', async () => {
      render(
        <MockedProvider
          mocks={[...mockCaseQueries, ...mockJudgeQuery]}
          addTypename={false}
        >
          <MemoryRouter
            initialEntries={[`${Constants.SIGNED_VERDICT_OVERVIEW}/test_id`]}
          >
            <UserProvider>
              <Route path={`${Constants.SIGNED_VERDICT_OVERVIEW}/:id`}>
                <SignedVerdictOverview />
              </Route>
            </UserProvider>
          </MemoryRouter>
        </MockedProvider>,
      )

      expect(
        await waitFor(() =>
          screen.queryByRole('button', { name: 'Framlengja gæslu' }),
        ),
      ).not.toBeInTheDocument()
    })

    test('should not show an extention for why the case cannot be extended if the user is a prosecutor', async () => {
      render(
        <MockedProvider
          mocks={[...mockCaseQueries, ...mockProsecutorQuery]}
          addTypename={false}
        >
          <MemoryRouter
            initialEntries={[`${Constants.SIGNED_VERDICT_OVERVIEW}/test_id_7`]}
          >
            <UserProvider>
              <Route path={`${Constants.SIGNED_VERDICT_OVERVIEW}/:id`}>
                <SignedVerdictOverview />
              </Route>
            </UserProvider>
          </MemoryRouter>
        </MockedProvider>,
      )

      expect(
        await screen.findByText(
          'Ekki hægt að framlengja kröfu þegar dómari hefur úrskurðað um annað en dómkröfur sögðu til um.',
        ),
      ).toBeInTheDocument()
    })
  })

  describe('Accepted case with travel ban end time in the past', () => {
    test('should have the correct title', async () => {
      render(
        <MockedProvider
          mocks={[...mockCaseQueries, ...mockJudgeQuery]}
          addTypename={false}
        >
          <MemoryRouter
            initialEntries={[`${Constants.SIGNED_VERDICT_OVERVIEW}/test_id_8`]}
          >
            <UserProvider>
              <Route path={`${Constants.SIGNED_VERDICT_OVERVIEW}/:id`}>
                <SignedVerdictOverview />
              </Route>
            </UserProvider>
          </MemoryRouter>
        </MockedProvider>,
      )

      expect(
        await screen.findByText('Farbanni lokið', { selector: 'h1' }),
      ).toBeInTheDocument()
    })

    test('should have the correct subtitle', async () => {
      const dateInPast = '2020-09-24T19:50:08.033Z'

      render(
        <MockedProvider
          mocks={[...mockCaseQueries, ...mockJudgeQuery]}
          addTypename={false}
        >
          <MemoryRouter
            initialEntries={[`${Constants.SIGNED_VERDICT_OVERVIEW}/test_id_8`]}
          >
            <UserProvider>
              <Route path={`${Constants.SIGNED_VERDICT_OVERVIEW}/:id`}>
                <SignedVerdictOverview />
              </Route>
            </UserProvider>
          </MemoryRouter>
        </MockedProvider>,
      )

      expect(
        await screen.findByText(
          `Farbann rann út ${formatDate(dateInPast, 'PPP')} kl. ${formatDate(
            dateInPast,
            TIME_FORMAT,
          )}`,
        ),
      ).toBeInTheDocument()
    })

    test('should show a button for extention because the user is a prosecutor', async () => {
      render(
        <MockedProvider
          mocks={[...mockCaseQueries, ...mockProsecutorQuery]}
          addTypename={false}
        >
          <MemoryRouter
            initialEntries={[`${Constants.SIGNED_VERDICT_OVERVIEW}/test_id`]}
          >
            <UserProvider>
              <Route path={`${Constants.SIGNED_VERDICT_OVERVIEW}/:id`}>
                <SignedVerdictOverview />
              </Route>
            </UserProvider>
          </MemoryRouter>
        </MockedProvider>,
      )

      expect(
        await screen.findByRole('button', { name: 'Framlengja gæslu' }),
      ).toBeInTheDocument()
    })
  })
})
