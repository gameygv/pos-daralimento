import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
          <div className="w-full max-w-lg rounded-lg border border-red-200 bg-white p-6 shadow-lg">
            <h2 className="mb-2 text-lg font-bold text-red-700">Error en la aplicacion</h2>
            <p className="mb-4 text-sm text-gray-600">
              Algo salio mal. Intenta recargar la pagina.
            </p>
            <pre className="mb-4 max-h-40 overflow-auto rounded bg-red-50 p-3 text-xs text-red-800">
              {this.state.error?.message}
              {'\n'}
              {this.state.error?.stack?.split('\n').slice(0, 5).join('\n')}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Recargar pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
