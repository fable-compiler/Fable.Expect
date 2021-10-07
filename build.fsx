#r "nuget: Fable.PublishUtils"

open System
open PublishUtils

// ATTENTION: Packages must appear in dependency order
let packages = [
    "Fable.Expect"
  ]

let ignoreCaseEquals (str1: string) (str2: string) =
    String.Equals(str1, str2, StringComparison.OrdinalIgnoreCase)

run "npm install && npm test"

match args with
| IgnoreCase "publish"::rest ->
    let target = List.tryHead rest
    let srcDir = fullPath "src"
    let projFiles =
        [ for pkg in packages do
            yield (srcDir </> pkg), (pkg + ".fsproj") ]

    async {
        for projDir, file in projFiles do
            match target with
            | Some target ->
                if ignoreCaseEquals file.[..(file.Length - 8)] target then
                    do! pushFableNuget (projDir </> file) [] doNothing
            | None ->
                do! pushFableNuget (projDir </> file) [] doNothing
    }
    |> Async.Start
| _ -> ()
