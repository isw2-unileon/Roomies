import HelloWorld from './components/HelloWorld'

export default function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-2xl space-y-6 text-center">
        <h1 className="text-4xl font-bold text-gray-900">Roomies</h1>
        <p className="text-gray-600">Frontend + backend hello world connection</p>
        <div className="flex justify-center">
          {/* Component that calls /api/hello and renders loading/success/error states. */}
          <HelloWorld />
        </div>
      </div>
    </main>
  )
}
