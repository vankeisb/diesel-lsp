enablePlugins(ScalaJSPlugin)

name := "diesel-lsp-facade"

scalaJSLinkerConfig ~= { _.withModuleKind(ModuleKind.CommonJSModule) }
Test / scalaJSLinkerConfig ~= { _.withModuleKind(ModuleKind.CommonJSModule) }

semanticdbEnabled := true
semanticdbVersion := scalafixSemanticdb.revision

scalaVersion := "2.13.10" // or any other Scala version >= 2.11.12

libraryDependencies += "com.ibm.cloud.diesel" %%% "diesel-core" % "0.2.0"
libraryDependencies += "com.ibm.cloud.diesel" %%% "diesel-core-samples" % "0.2.0"

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