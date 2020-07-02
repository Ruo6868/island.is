import React from 'react'
import { ErrorProps } from 'next/error'
import ErrorPage from '../../pages/_error'

export const withErrorBoundary = (Component) => {
  class ErrorBoundary extends React.Component<ErrorProps> {
    state = { ...this.props }

    static getDerivedStateFromError(error: Error) {
      // All throws from frontend are critical crashes,
      // return generic error code unless the error is a custom error object
      return { statusCode: 500, ...error }
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
      // console.error(info)
      // TODO: Log error here
    }

    render() {
      const { statusCode, title, children } = this.state
      if (statusCode) {
        // Display error page for all client side errors during render
        return <ErrorPage statusCode={statusCode} title={title} />
      } else {
        return children
      }
    }
  }

  const NewComponent = (props) => (
    <ErrorBoundary {...props.error}>
      <Component {...props} />
    </ErrorBoundary>
  )

  // Wrapped component might not have getInitialProps dont define for (Automatic Static Optimization)
  if (Component.getInitialProps) {
    // Wrap getInitialProps to be able to pass custom error codes to error page
    NewComponent.getInitialProps = async (ctx) => {
      try {
        return await Component.getInitialProps(ctx)
      } catch ({ statusCode = 500, title }) {
        // TODO: Log error here
        // Let ErrorBoundary handle error display for getInitialProps
        return { error: { statusCode, title } }
      }
    }
  }

  return NewComponent
}

export class CustomNextError extends Error {
  statusCode
  title
  constructor(statusCode: number, title?: string, message?: string) {
    super(message ?? title)
    this.statusCode = statusCode
    this.title = title
  }
}
