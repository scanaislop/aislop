# Java and Scala project analysis

Java source analysis includes google-java-format, PMD, Checkstyle, built-in patterns, complexity, and security checks. Scala source analysis includes scalafmt and built-in patterns, complexity, and security checks. Scala remains in beta while broader syntax and real-project coverage are refined.

Both languages can additionally use SpotBugs with find-sec-bugs for compiled-code analysis and OWASP Dependency-Check for resolved dependency JARs. These checks require a trusted, built project. Aislop never runs Maven, Gradle, sbt, or project build scripts automatically.

## Install optional tools

Keep JDK 21+ on PATH:

```sh
aislop-tools --java
aislop-tools --jvm-security
```

Downloads use pinned versions and verified SHA-256 checksums. Existing executable system tools take precedence. The verified find-sec-bugs plugin is used by default; `findSecBugs: false` selects core SpotBugs only. A custom project-local plugin requires the same explicit execution consent as live tools.

## Analyze a trusted build

Build and resolve dependencies using the project's normal workflow first. For a Maven project, trusted maintainer-run commands can include `mvn package dependency:copy-dependencies`. For Gradle or sbt, use the project's configured runtime dependency-copy task. Aislop reads the resulting classes and JARs, including transitive dependencies; it does not infer the resolved graph from version strings in build files.

```yaml
security:
  audit: true
  jvm:
    spotbugs: true
    bytecode: [target/classes]
    classpath: []
    dependencyCheck: true
    dependencies: [target/dependency]
    dataDirectory: .cache/dependency-check
    timeout: 120000
```

Configured `dependencies` are also added to the SpotBugs classpath. Use `classpath` for extra libraries or compiled module directories. Directories expand to their nested JARs, so a copied runtime dependency directory also supplies Scala standard libraries without listing every JAR. Entries must exist inside the project, with no symlinks in their input trees or glob expressions. Classpaths and bytecode targets are passed through files so large dependency graphs and paths with spaces work on Windows as well as POSIX systems.

```sh
aislop scan --jvm-security
aislop ci --jvm-security
```

The command-line flag is required on every live invocation. Repository configuration alone cannot run the tools or load plugin JARs. The programmatic engine API uses `config.allowJvmExecution: true` for the same explicit consent. Missing tools, classes, reports, or cached advisory data produce error diagnostics and fail CI.

If `bytecode` is omitted, Aislop recognizes Maven `target/classes`, Gradle `build/classes/java/main` and `build/classes/scala/main`, and sbt `target/scala-*/classes`. Configure module paths explicitly in multi-module projects. Rebuild after source changes so bytecode results match the code being scanned.

## Dependency advisory data

`updateData` defaults to `false`, adding Dependency-Check's `--noupdate` option. To initialize the advisory cache, set `updateData: true` and a longer `timeout`, such as `600000`, then run `aislop scan --jvm-security`. Updates use the official NVD JSON feeds. Return `updateData` to `false` for scans that should use the existing cache. The initial population can be slow; Aislop's timeout covers the entire invocation. Dependency-Check may also query artifact metadata services according to its own configuration. Authentication belongs in that tool's environment or user configuration, never in committed Aislop config or command examples.

Both Maven and Scala dependency JARs use the same advisory database. Pass the full resolved runtime dependency directory to include transitive artifacts. `security.audit: false` disables dependency audit execution and report imports while leaving SpotBugs analysis available.

## Import existing CI reports

Existing build jobs can generate SpotBugs SARIF and Dependency-Check JSON:

```yaml
security:
  jvm:
    spotbugsReports: [reports/spotbugs.sarif]
    dependencyCheckReports: [reports/dependency-check-report.json]
```

Reports describe the build that produced them; regenerate reports after source or dependency changes. Report imports are read-only and do not require `--jvm-security` or installed analyzers. Reports must be inside the project, valid JSON, and at most 64 MiB. Use relative SARIF source paths for portable source mapping. Ambiguous or unavailable source locations are attached to the project manifest rather than guessed. Explicitly accepted SARIF suppressions and non-applicable results are omitted; identical findings are deduplicated. Incomplete analysis remains an error even when the report also contains valid findings.

Incremental scans keep SpotBugs findings in the selected source scope. Dependency audits run when a dependency manifest, resolved JAR, or configured report is selected; `pom.xml`, Gradle files, `build.sbt`, sbt project definitions, and JAR files are recognized. Full scans audit all configured JVM dependency inputs.

## Scala formatter on the JVM

The normal formatter uses `scalafmt` on PATH. CI environments that manage scalafmt's JVM dependencies directly can set `AISLOP_SCALAFMT_CLASSPATH` to the trusted CLI classpath. Aislop then invokes `java` directly, which also works on Windows without batch wrappers. This environment variable is caller-controlled; project config cannot set the formatter classpath. `.scalafmt.conf` still controls dialect and formatting style.

Validation covers compiled Java 8, 17, and 21 targets, Scala 2.13 and Scala 3, real scalafmt scan/fix/scan behavior, and a known vulnerable JAR audited against NVD data.
