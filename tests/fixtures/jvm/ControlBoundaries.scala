import java.io.IOException

object ControlBoundaries {
  private def work(): Unit = ()
  private def recover(error: Throwable): Unit = ()

  def nested(reason: Throwable): Unit = try work() catch {
    case error: IOException => reason match {
      case _: Throwable => recover(error)
    }
  }

  def mixed(): Unit = try work() catch {
    case _: IOException => { () }
    case error: IllegalStateException => recover(error)
  }

  def guarded(): Unit = try work() catch {
    case error: IOException
      if List(1).exists(number => number > 0) => { () }
  }

  def broad(): Unit = try work() catch {
    case _: Exception => { () }
  }

  def quoted(): Unit = {
    val text = """quoted""""; System.out.println(text)
  }
}
