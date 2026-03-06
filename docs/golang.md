# Go Best Practices

Guidelines and conventions we follow in the backend codebase.

## Project Layout

- `cmd/` -- Entry points (one `main.go` per binary)
- `internal/` -- Private application code, not importable by other modules
- `pkg/` -- (if needed) Library code safe for external use

Reference: [Standard Go Project Layout](https://github.com/golang-standards/project-layout)

## Style Guides

- [Effective Go](https://go.dev/doc/effective_go) -- Official guide from the Go team
- [Google Go Style Guide](https://google.github.io/styleguide/go/) -- Google's internal conventions, covering style decisions, best practices, and readability
- [Uber Go Style Guide](https://github.com/uber-go/guide/blob/master/style.md) -- Practical patterns from Uber's large-scale Go codebase

## Key Principles

- **Keep it simple** -- Prefer clear, boring code over clever abstractions.
- **Handle errors explicitly** -- Always check and return errors. Wrap with context using `fmt.Errorf("doing X: %w", err)`.
- **Use interfaces at the consumer** -- Define small interfaces where they are used, not where they are implemented.
- **Avoid globals** -- Pass dependencies explicitly through constructors.
- **Use `context.Context`** -- Thread it through for cancellation, timeouts, and request-scoped values.
- **Structured logging** -- Use `log/slog` for key-value structured logs.

## Testing

- Use table-driven tests with `t.Run` for subtests.
- Run tests with `-race` to detect data races.
- Keep tests in the same package for white-box testing, or `_test` package for black-box.

Reference: [Go Testing](https://go.dev/doc/tutorial/add-a-test)

## Concurrency

- Prefer channels for communication, mutexes for state protection.
- Never start a goroutine without knowing how it will stop.
- Use `errgroup` for managing groups of goroutines.

Reference: [Go Concurrency Patterns](https://go.dev/blog/pipelines)

## Further Reading

- [Go Code Review Comments](https://go.dev/wiki/CodeReviewComments) -- Common review feedback from the Go team
- [Go Proverbs](https://go-proverbs.github.io/) -- Rob Pike's design philosophy
- [Go Blog](https://go.dev/blog/) -- Official articles on language features and patterns
- [Practical Go (Dave Cheney)](https://dave.cheney.net/practical-go/presentations/qcon-china.html) -- Real-world advice on writing Go
- [100 Go Mistakes](https://100go.co/) -- Common pitfalls and how to avoid them
