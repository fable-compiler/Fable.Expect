#r "nuget: Fable.PublishUtils, 2.4.0"

open System
open PublishUtils

// ATTENTION: Packages must appear in dependency order
let packages = [
    "Fable.Expect"
  ]

let ignoreCaseEquals (str1: string) (str2: string) =
    String.Equals(str1, str2, StringComparison.OrdinalIgnoreCase)

run "npm install && npm test"

let args =
    fsi.CommandLineArgs
    |> Array.skip 1
    |> List.ofArray

match args with
| IgnoreCase "publish"::rest ->
    let target = List.tryHead rest
    let srcDir = fullPath "src"
    let projFiles = packages |> List.map (fun pkg ->
        (srcDir </> pkg), (pkg + ".fsproj"))

    for projDir, file in projFiles do
        let publish =
            match target with
            | Some target -> ignoreCaseEquals file.[..(file.Length - 8)] target
            | None -> true
        if publish then
            pushFableNuget (projDir </> file) [] doNothing
| _ -> ()
