export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-2 text-sm text-gray-600">Sign in to continue to Roomies</p>
        </div>

        <form className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none transition focus:border-gray-900"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none transition focus:border-gray-900"
            />
          </div>

          <div className="text-right">
            <a href="/forgot-password" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Login
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/signup" className="font-semibold text-gray-900 hover:underline">
            Sign up
          </a>
        </p>
      </section>
    </main>
  )
}
