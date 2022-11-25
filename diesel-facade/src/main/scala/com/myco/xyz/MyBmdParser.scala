package com.myco.xyz

import diesel.facade.DieselParserFacade
import diesel.samples.jsmodeldsl.BmdDsl

import scala.scalajs.js.annotation.{JSExport, JSExportTopLevel}

@JSExportTopLevel("MyBmdParser")
object MyBmdParser {

  @JSExport
  def createBmdParser(): DieselParserFacade = new DieselParserFacade(BmdDsl)

}
