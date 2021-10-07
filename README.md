# Fable.Expect

`Fable.Expect` contains helpers to easily test your Fable apps following best practices. It's composed of several parts:

- `Expect`: Assertion helpers that will throw errors compatible with diffing in JS test runners.
- `Expect.Dom`: Utilities to run tests with DOM elements.
- `Expect.Elmish`: Utilities to test Elmish apps.
- `WebTestRunner`: Utilities to write tests for [Web Test Runner](https://modern-web.dev/docs/test-runner/overview/).

To access each helper open the corresponding module/namespace. Assertion helpers are always qualified with `Expect.`:

```fsharp
module TodoTest

open Elmish
open Expect
open Expect.Dom
open Expect.Elmish
open WebTestRunner

describe "Todo" <| fun () ->
    it "New todo" <| fun () -> promise {
        // Initialize the Elmish app with Program.mountAndTest,
        // this returns a container that also gives access to the Elmish model.
        // `mount` is a function that renders the result of `view`
        //  onto the container's element (e.g. ReactDom.render)
        use! container =
            Program.mkProgram init update view
            |> Program.mountAndTest mount

        // Get the element from the container and do snapshot testing
        let el = container.El
        do! el |> Expect.matchHtmlSnapshot "before new todo"

        // We can get the form elements using the aria labels, same way as screen readers will do
        el.getTextInput("New todo description").value <- "Elmish test"
        el.getButton("Add new todo").click()

        // Get the updated model and confirm it contains the new todo uncompleted
        container.Model.Todos
        |> Expect.find "new todo" (fun t -> t.Description = "Elmish test")
        |> Expect.isFalse "complete" (fun t -> t.Completed)

        // Wait until next animation frame to make sure the HTML has updated before the snapshot
        do! Promise.awaitAnimationFrame()
        do! el |> Expect.matchHtmlSnapshot "after new todo"
    }
```

## Accessible queries

Writing tests that find elements in your UI is a great opportunity to put you in the shoes of a screen-reader user. Popularized by the [Testing Library](https://testing-library.com/), [accessible queries](https://testing-library.com/docs/queries/about#priority) are a way to make sure your tests find elements in your UI the same way screen-readers do.

- `getByText(pattern): HTMLElement`: The given pattern becomes an ignore-case regular expression.
- `getByRole(role, accessibleName): Element`: Query every element exposed in the accessibility tree. The given accessibleName becomes an ignore-case regular expression.

The following shortcuts for common roles are provided:

- `getButton(accessibleName): HTMLButtonElement`
- `getCheckbox(accessibleName): HTMLInputElement`
- `getTextInput(accessibleName): HTMLInputElement`

## Web Test Runner

Except for `WebTestRunner` module, the other helpers can be run with any test runner that provides a DOM. We recommend [Web Test Runner](https://modern-web.dev/docs/test-runner/overview/) because it's compatible with ES modules and runs your tests in a headless browser by default instead of node. Web Test Runner provides the same [BDD interface as Mocha](https://mochajs.org/#interfaces) and allows you to [execute commands](https://modern-web.dev/docs/test-runner/commands/) to interact with the browser instance or the file system. At the time of writing Fable.Lit.Tests includes helpers for snapshot testing.

## Snapshot testing

Snapshot testing is helpful to make sure your UI doesn't change unintentionally. If no snapshot has been created for the specific file/name pair a new one will just be saved. Next time the given content will be compared with the stored snapshot and assertion will fail if they don't match.

```fsharp
it "snapshot" <| fun () -> promise {
    use container = new Container()
    // Render something onto the container's element
    return! container.El |> Expect.matchHtmlSnapshot "my-element"
}
```

If you have changed the UI intentionally you can update the snapshots with the self-telling `--update-snapshots` argument.

```sh
npm test -- --update-snapshots
```

The main caveat is at the time of writing Web Test Runner doesn't support configuring the directory for snapshots and they will be placed next to the test files. This can be problematic if you're outputting the compiled JS files to a gitignored folder. In this case, you need to add an exception to make sure git checks the snapshots:

```sh
# .gitignore

build/client/*
build/test/*
!build/test/__snapshots__
```
