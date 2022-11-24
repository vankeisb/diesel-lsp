package tutorial.webapp

import diesel.samples.jsmodeldsl.BmdDsl
import diesel._

import scala.scalajs.js
import scala.scalajs.js.JSConverters._
import scala.scalajs.js.annotation._

@JSExportTopLevel("tutorial")
object Tutorial {
  @JSExport
  def sayHello(): Unit = {
    println("Hello world (bis) !")
  }
}

object TutorialApp {
  def main(args: Array[String]): Unit = {
    println("Hello world!")
  }
}

@JSExportTopLevel("diesel")
object DieselParser {

  val calcParser: DieselParser = new DieselParser(BmdDsl)

}

@JSExport
class DieselParser(val dsl: Dsl) {

  val bnf: Bnf = Bnf(dsl, None)
  val parser: Earley = Earley(bnf, dsl.dynamicLexer)

  def parse(request: ParseRequest): DieselParseResult = {
    val a = getBnfAxiomOrThrow(request.axiom.toOption)
    val r = parser.parse(new Lexer.Input(request.text), a)
    DieselParseResult(r)
  }

  // TODO borrowed from AstHelper
  private def getBnfAxiomOrThrow(axiom: Option[String]): Bnf.Axiom = {
    axiom match {
      case Some(x) =>
        bnf.axioms
          .find(ba => ba.name == s"${x}[_,_,_,_,_].axiom")
          .getOrElse(throw new IllegalArgumentException(s"missing axiom '${x}'"))
      case None =>
        bnf.axioms
          .headOption
          .getOrElse(throw new IllegalArgumentException("no axiom"))
    }
  }

}

@JSExportAll
class ParseRequest(val text: String, val axiom: js.UndefOr[String])

@JSExport
class DieselMarker(val marker: Marker) {

  @JSExport
  val offset: Int = marker.offset

  @JSExport
  val length: Int = marker.length

  @JSExport
  def getMessage(locale: js.UndefOr[String]): String =
    marker.message.format(locale.getOrElse("en"))

  @JSExport
  val severity: String = marker.descriptor.severity match {
    case diesel.Marker.Severity.Info => "info"
    case diesel.Marker.Severity.Warning => "warning"
    case diesel.Marker.Severity.Error => "error"
  }

}

@JSExport
class DieselParseResult(val res: Either[String, GenericTree]) {

  @JSExport
  val success: Boolean = res.isRight

  @JSExport
  val error: Option[String] = res.left.toOption

  @JSExport
  val markers: js.Array[DieselMarker] = res.toOption
    .map(_.markers)
    .getOrElse(Seq.empty)
    .map(m => new DieselMarker(m))
    .toJSArray

}

object DieselParseResult {

  def errorResult(reason: String): DieselParseResult = new DieselParseResult(Left(reason))

  def apply(result: Result): DieselParseResult = {
    if (result.success) {
      val navigator = Navigator(result)
      if (navigator.hasNext) {
        val ast = navigator.next()
        if (navigator.hasNext) {
          // TODO how to debug ?
          errorResult("too many ASTs")
        } else {
          new DieselParseResult(Right(ast))
        }
      } else {
       errorResult("No AST found ??")
      }
    } else {
      errorResult("parsing failure :/")
    }
  }
}