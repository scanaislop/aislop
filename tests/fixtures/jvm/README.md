# JVM integration fixtures

`spotbugs.sarif` is a reduced report from SpotBugs 4.10.5 with find-sec-bugs 1.14.0, generated against the Java fixture in the integration tests. It retains result locations and execution metadata while omitting long tool descriptions.

`compiler-pom.xml` pins compiler and formatter dependencies used only by opt-in live tests. The vulnerable Log4j test artifact is downloaded only for the explicitly enabled dependency integration test, verified with SHA-256, analyzed as data, and removed afterward. These fixtures are excluded from the published npm package.
