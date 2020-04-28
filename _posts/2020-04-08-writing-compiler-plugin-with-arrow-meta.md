---
title: "Writing a Kotlin Compiler Plugin with Arrow Meta"
date: 2020-04-08
categories:
  - arrow-meta
tags:
  - compiler-plugin
layout: single
classes: wide
---

_Featured in [Kotlin Weekly #193](https://mailchi.mp/kotlinweekly/kotlin-weekly-193)_

Writing a Kotlin Compiler plugin is an uncharted area. The API is undocumented thus far. You may not know where to start. Enter [Arrow Meta](https://meta.arrow-kt.io/). It is a library that provides a functional API to write compiler plugins. In this article, I will show you how to write and test a simple compiler plugin with Arrow Meta.

Three years ago, a friend of mine Kevin Most gave a talk at Kotlin Conf on [writing compiler plugins](https://www.youtube.com/watch?v=w-GMlaziIyo). He demonstrated the process with an example plugin [DebugLog](https://github.com/kevinmost/debuglog). I worked on writing an Arrow Meta implementation of this plugin [debuglog-meta-arrow](https://github.com/msya/debuglog-arrow-meta). I’ll show you how I wrote it and introduce the API provided by Arrow Meta.

Before we begin, let’s look at an overview of how the Kotlin compiler works as Arrow Meta supplements it.

## Kotlin Compiler

As with any compiler, the purpose is to convert your Kotlin code to something that can be executed. From a higher-level perspective, the compiler is divided into two sections — frontend and backend. The front-end performs lexical and grammatical analysis. This produces what is called an intermediate representation that typically takes the form of a tree. An [Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree) (AST) to be precise. Let’s look at an overview of the steps taken in these sections.

### Compilation

Your code goes through a sequence of steps to compile. Below is a diagram of the process.


![arrow-meta-kotlin-compiler-plugin-1](/assets/images/writing-kotlin-compiler-plugin-with-arrow-meta/arrow-meta-kotlin-compiler-plugin-1.png){: .align-center}

### Code

Code is really just strings that we input into our editors. The editor that we primarily use, Intellij IDEA is built on top of the [Intellij Community](https://github.com/JetBrains/intellij-community) platform. This platform provides reusable UI components for IDEs and a way to hookup a custom grammar for a language, it also has grammar validation, etc. The Kotlin Compiler utilizes this platform to provides Kotlin specific configurations for the IDE. For example, the “Show Kotlin bytecode” option is shown by tapping into the [Actions API](https://github.com/JetBrains/kotlin/blob/c338fdd677e5228f6add319c4e3946150bbc6824/idea/idea-jvm/src/org/jetbrains/kotlin/idea/actions/ShowKotlinBytecodeAction.kt#L29) provided by Intellij platform. This is hooked into the decompiler of Kotlin.

### Parsing

Your code is converted from text to a tree-like structure called the [Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree). This is actually not Kotlin specific. All compilers will transform your code into an AST for any other language. Each node in the AST represents a part of your code. For example, there will be a node for your imports, classes, functions, generic, etc.

### Analysis & Resolve

In this phase of the compilation process, the AST is given type information and actual type checking is performed. Every language has a grammar. This is Kotlin’s [grammar](https://kotlin.github.io/kotlin-spec/#grammar) specification. Your code is parsed against the grammar to validate its correctness. In this phase, it will also type check your program.

### Code Generation

The AST is given to the backend of the compiler. With the introduction of intermediate representation, the back-end can now target different platforms. These platforms could be JS, JVM, native.
All compilers have a very similar process. This is a very high-level overview of it. Arrow Meta allows you to hook into each step and provide your own custom implementation. The GIF below made by the Arrow team demonstrates this much better.

![arrow-meta-kotlin-compiler-plugin-2](/assets/images/writing-kotlin-compiler-plugin-with-arrow-meta/arrow-meta-kotlin-compiler-plugin-2.gif){: .align-center}

## Use Case

Let’s look at how to write a plugin that mutates the AST and adds logging information. Assume we have a method that performs some operation and returns the result.

```kotlin
fun prime(n: Int): Long = listOf(1L,2L,3L).take(n).last()
```

We want to be able to log how long this function takes to execute. We have a program that has a lot of functions. We could use an annotation DebugLog to specify logging for a specific function.

```kotlin
annotation class DebugLog

@DebugLog
fun prime(n: Int): Long = listOf(1L,2L,3L).take(n).last()
```

Our goal is to transform this function to add logging for how long it takes the function to execute. After transforming our function, it will look like this:

```kotlin
fun prime(n: Int): Long {
  println(“-> prime(n=$n)”)
  val startTime = System.currentTimeMillis()
  val result = listOf(1L,2L,3L).take(n).last()
  val timeToRun = System.currentTimeMillis() — startTime
  println(“<- prime[ran in $timeToRun ms]”)
  return result
}
```

As you can see above, we want to add logging of the parameter sent to the function, perform a time calculation and print it. How do we accomplish this with Arrow Meta?

## Modules

We need to setup Gradle modules for our meta plugin. I will create two modules — create-plugin and use-plugin in our project.

## Create-Plugin Module

This module will contain the main logic for the plugin. Its external dependencies will be:

* Kotlin Embeddable Compiler

* Arrow Meta Compiler Plugin

* Shadow Jar library

Please take look at the build scripts in the project. I want to point out the main points of the configuration.

```kotlin
plugins {
   id “org.jetbrains.kotlin.jvm”
   id “com.github.johnrengelman.shadow”
}

dependencies {
   compileOnly “org.jetbrains.kotlin:
                     kotlin-stdlib:$KOTLIN_VERSION”
   compileOnly “org.jetbrains.kotlin:
                     kotlin-compiler-embeddable:$KOTLIN_VERSION”
   compileOnly “com.github.arrow-kt.arrow-meta:
                     compiler-plugin:-SNAPSHOT”
}

shadowJar {
    configurations = [project.configurations.compileOnly]
    dependencies {
       exclude(“org.jetbrains.kotlin:kotlin-stdlib”)
       exclude(“org.jetbrains.kotlin:kotlin-compiler-embeddable”)
    }
}
```

In my plugin, I’m using [JitPack](https://jitpack.io/) to get the latest snapshot of Arrow Meta.

## Use-Plugin Module

This module shows how to use the plugin in an example. The create-plugin module creates a jar that is included in freeCompilerArgs . This module will also contain the tests for our plugin. Here is the main configuration from the build script.

```kotlin
compileKotlin {
   kotlinOptions {
      jvmTarget = “$JVM_TARGET_VERSION”
      freeCompilerArgs = [
           “-Xplugin=${project.rootDir}/create
                 plugin/build/libs/create-plugin-all.jar”]
     }
}
```

For testing, I’m including the test plugin that provides testing utilities. With Jitpack, it’s easier to pull a submodule from the library.

```kotlin
testImplementation ‘com.github.arrow-kt.arrow-meta:testing-plugin:-SNAPSHOT’
```

If you want to look at this scaffolding in detail, you could check out my plugin.

## Compiler Plugin Entry Point

The main entry point for the plugin needs to specify a list of extension phases. The extension phases are our hooks into the compiler we are specifying to perform code gen, type definition, etc.

```kotlin
class DebugLogMetaPlugin : Meta {
    @ExperimentalContracts
    override fun intercept(ctx: CompilerContext): List<Plugin> =
        listOf(
            debugLog
        )
}
```

In order to define the entry point for our plugin, we need to extend the `Meta` class and override the intercept method. We will return from this method a list of type `Plugin`. The `debugLog` item in the list is our Plugin where we have defined how to perform our desired transformation. Let’s see how the transformation is connected.

## Compiler Plugin

```kotlin
val Meta.debugLog: Plugin
 get() =
   "DebugLog" {
     meta(
       namedFunction({ validateFunction() }) { c: KtNamedFunction ->
          Transform.replace(
            replacing = c,
            newDeclaration = replace(c).function
          )
        }
      )
    }
```

Above is a plugin defined as an extension property. A [Plugin](https://github.com/arrow-kt/arrow-meta/blob/master/compiler-plugin/src/main/kotlin/arrow/meta/Meta.kt#L40) is a data class consisting of two fields.

```kotlin
data class Plugin(  
    val name: String,  
    val meta: CompilerContext.() -> List<ExtensionPhase>
)
```
Source: [Meta.kt](https://github.com/arrow-kt/arrow-meta/blob/master/compiler-plugin/src/main/kotlin/arrow/meta/Meta.kt#L40)

The first field specifies the name of our plugin which is “DebugLog”. The second field is a lambda block whose return type is a list of extension phases. We would like to intercept the compilation step where the compiler generates the AST. We need to search the AST for a function that has the DebugLog annotation. Arrow Meta provides an extension on the Meta type that allows you to parse any function defined in the code.

```kotlin
fun Meta.namedFunction(
  match: KtNamedFunction.() -> Boolean,
  map: NamedFunction.(KtNamedFunction) -> Transform<KtNamedFunction>
): ExtensionPhase =
  quote(match, map) { NamedFunction(it) }
```
Source: [MetaExtensions.kt](https://github.com/arrow-kt/arrow-meta/blob/master/compiler-plugin/src/main/kotlin/arrow/meta/quotes/MetaExtensions.kt)

This method allows us to specify a predicate to match a method and a transformation for it. We need to validate a method that has this signature.

```kotlin
@DebugLog
fun prime(n: Int): Long
```

I created an extension `validateFunction` on `KtNamedFunction` that checks whether the function is annotated with `DebugLog`, has an `Int` params and a `Long` return type.

```kotlin
/**
 * Match a function that fits this scenario.
 *
 * - Function has 1 param that is of Int type.
 * - Function has a Long return type.
 * - Function has a DebugLog annotation.
 */
private fun KtNamedFunction.validateFunction(): Boolean =
        hasOneIntParam() && 
        hasLongReturnType() && 
        hasAnnotation(DEBUG_LOG)

/**
 * Check function has 1 param that is of Int type.
 */
private fun KtNamedFunction.hasOneIntParam(): Boolean =
        valueParameterList?.parameters?.size == 1 &&
          valueParameterList?.parameters?.first()
                             ?.typeReference?.text == INT


/**
 * Check function is returning a Long.
 */
private fun KtNamedFunction.hasLongReturnType(): Boolean =
        hasDeclaredReturnType() && typeReference?.text == LONG

/**
 * Check function has [annotationNames] as an annotation.
 * See KtAnnotatedExtensions.kt in Detekt.
 */
fun KtAnnotated.hasAnnotation(
        vararg annotationNames: String
): Boolean {
    val names = annotationNames.toHashSet()
    val predicate: (KtAnnotationEntry) -> Boolean = {
        it.typeReference
                ?.typeElement
                ?.safeAs<KtUserType>()
                ?.referencedName in names
    }
    return annotationEntries.any(predicate)
}
```

Each requirement that we want to satisfy is specified as an extension. It doesn’t have to be. We check whether there is an annotation on the method by going through any `annotationEntries` the method may have. We also check if the function has Int param by going through each `valueParameterList` and checking its `typeReference`. I could write this to be more general. But, for the sake of simplicity, I constrained it to match a specific signature.

After a method having a DebugLog annotation is found in the AST, we need to transform it. As a reminder, our goal is to transform the function to:

```kotlin
fun prime(n: Int): Long {
  println(“-> prime(n=$n)”)
  val startTime = System.currentTimeMillis()
  val result = listOf(1L,2L,3L).take(n).last()
  val timeToRun = System.currentTimeMillis() — startTime
  println(“<- prime[ran in $timeToRun ms]”)
  return result
}
```

To accomplish this, I wrote the following method.

```kotlin
fun replace(function: KtNamedFunction): String {
    val functionName = function.name
    val paramName = function.valueParameters.first().name
    val functionBody = function.body()?.bodySourceAsExpression()

    return """
        |//metadebug
        |
        | fun ${functionName}(${paramName}: Int): Long {
        |   println("-> $functionName(${paramName}=$${paramName})")
        |   val startTime = System.currentTimeMillis()
        |   val result = $functionBody
        |   val timeToRun = System.currentTimeMillis() - startTime
        |   println("<- ${functionName}[ran in ${'$'}timeToRun ms]")
        |   return result
        | }"""
}
```

This method grabs the function name, the first params and the function body first. Then, I return a string that logs the time execution and returns the result from the existing function body.

```kotlin
val Meta.debugLog: Plugin
 get() =
   "DebugLog" {
     meta(
       namedFunction({ validateFunction() }) { c: KtNamedFunction ->
          Transform.replace(
            replacing = c,
            newDeclaration = replace(c).function
          )
        }
      )
    }
```

We have specified the replacement transformation above. Arrow Meta has support for many types of transformation including removal, new source and transformations could be composed. All of these transforms are [extensions](https://github.com/arrow-kt/arrow-meta/blob/master/compiler-plugin/src/main/kotlin/arrow/meta/quotes/Transform.kt) on the Transform type.

At this point, we have built our plugin that meets the goal we wanted to accomplish. A function annotated with DebugLog is transformed to log its execution time.

## Usage & Output

If we build our project, a jar file will be generated in our `create-plugin/build/libs` folder. Let’s see our plugin in action. I’m going to create a file with a main method in the `use-plugin` module.

```kotlin
@DebugLog
fun prime(n: Int): Long = listOf(1L,2L,3L).take(n).last()

fun main() {
  prime(10)
}
```

If I were to run this method, this will be the output as expected.

```kotlin
-> prime(n=10)
<- prime[ran in 36 ms]
```

## Testing

Arrow meta has the `testing-plugin` module that provides utilities for ensuring our plugin functions as we expect it.

```kotlin
class DebugLogMetaPluginTest {

    companion object {

        val debuglog = """
            |annotation class DebugLog
            |
            |@DebugLog
            |fun prime(n: Int): Long =  
            |       listOf(1L,2L,3L).take(n).last()
            | """.trimMargin().trim().source

        val expectedOutput = """
            |annotation class DebugLog
            |
            |//metadebug
            |fun prime(n: Int): Long {
            | println("-> prime(n=${'$'}n)")
            | val startTime = System.currentTimeMillis()
            | val result = listOf(1L,2L,3L).take(n).last()
            | val timeToRun = System.currentTimeMillis() - startTime
            | println("<- prime[ran in ${'$'}timeToRun ms]")
            | return result
            | }""".trimMargin().trim().source
    }
}
```

For my test above, I have specified two string that presents the input source and expected source after the transformed is applied to the plugin.

```kotlin
@Test
fun `should print function time execution`() {
    assertThis(CompilerTest(
     config = { listOf(addMetaPlugins(DebugLogMetaPlugin())) },
          code = { debuglog },
          assert = { quoteOutputMatches(expectedOutput) }
    ))
}
```

The `testing-plugin` module provides a `CompileTest` that allows you to specify the code you want to transform and what it should assert with. The test above internally creates a file `Source.kt` that intercepts the analysis phase of the compiler and applies the transformation on my code. Arrow Meta provides helpful logging information as your test runs.

```kotlin
Replacing class arrow.meta.internal.kastree.ast.Node$Decl$Func with [class org.jetbrains.kotlin.psi.KtNamedFunction]: newContents: 
//metadebug
fun prime(n: Int): Long {
   println("-> prime(n=$n)")
   val startTime = System.currentTimeMillis()
   val result = listOf(1L,2L,3L).take(n).last()
   val timeToRun = System.currentTimeMillis() - startTime
   println("<- prime[ran in $timeToRun ms]")
   return result
 }
Transformed file: KtFile: Source.kt. New contents: 
[(KtFile: Source.kt, annotation class DebugLog
//metadebug
fun prime(n: Int): Long {
   println("-> prime(n=$n)")
   val startTime = System.currentTimeMillis()
   val result = listOf(1L,2L,3L).take(n).last()
   val timeToRun = System.currentTimeMillis() - startTime
   println("<- prime[ran in $timeToRun ms]")
   return result
 }
)]
END quote.doAnalysis: [KtFile: Source.kt]
```

There is a system internally called __Quote__ that drives all the transformation. This is how you test a compiler plugin with Arrow Meta.

## Conclusion

I hope that was helpful for you as you create your own Compiler Plugins with Arrow Meta. There is a LOT more you could do. Thanks to Raul Raja, Rachel M. Carmena, Amanda Hinchman and more for creating a very cool tool. This project also contains many examples of how to create a functional API. You could check out my plugin [debuglog-arrow-meta](https://github.com/msya/debuglog-arrow-meta). Arrow Meta is still in development. But, I started to use Arrow Meta for complex use cases and I very much enjoy it. 

## Resources

* [Arrow Meta Examples](https://github.com/arrow-kt/arrow-meta-examples)

* [Lambda World 2019 — Arrow Meta — Enabling Functional Programming in the Kotlin Compiler](https://www.youtube.com/watch?v=WKR384ZeBgk)

* [DroidCon NYC 2018 — Static Code Analysis with Kotlin](https://www.youtube.com/watch?v=LT6m5_LO2DQ)









