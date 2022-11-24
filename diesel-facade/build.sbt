enablePlugins(ScalaJSPlugin)

name := "diesel-lsp"

scalaJSLinkerConfig ~= { _.withModuleKind(ModuleKind.CommonJSModule) }
Test / scalaJSLinkerConfig ~= { _.withModuleKind(ModuleKind.CommonJSModule) }

scalaVersion := "2.13.1" // or any other Scala version >= 2.11.12

scalacOptions ++= Seq(
  "-unchecked",
  "-deprecation",
  "-feature",
  "-Xfatal-warnings",
  "-language:existentials",
  "-Wunused:imports"
)

Compile / fastOptJS := {
  val file = (Compile / fastOptJS).value
  IO.copyFile(file.data, baseDirectory.value / "dist" / "diesel-facade.js")
  file
}

cleanFiles += baseDirectory.value / "dist"