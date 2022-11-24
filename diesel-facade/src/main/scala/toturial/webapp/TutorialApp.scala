package tutorial.webapp

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