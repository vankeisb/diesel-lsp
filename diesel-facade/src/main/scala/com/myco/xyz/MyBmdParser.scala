package com.myco.xyz

import diesel.facade.DieselParserFacade

object MyDieselParser {

  val myDslParser: DieselParserFacade = new DieselParserFacade(MyDsl)

}
