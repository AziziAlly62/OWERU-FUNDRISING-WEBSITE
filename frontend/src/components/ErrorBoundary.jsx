import { Component } from 'react'
import Icon from './icons'
import { trackError } from '../analytics'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    trackError(error, 'ErrorBoundary:' + (this.props.context || 'app'))
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-error-50 text-error-500 flex items-center justify-center"><Icon name="alert" className="h-8 w-8" /></div>
            <h1 className="text-2xl font-bold text-ink-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-ink-600 mb-6">
              An unexpected error occurred. Please refresh the page or try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary text-ink-900 font-semibold px-6 py-3 rounded-lg"
            >
              Refresh Page
            </button>
            <p className="text-xs text-ink-500 mt-4">
              Error: {this.state.error?.message || 'Unknown error'}
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
