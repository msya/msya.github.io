---
title: "Building Kotlin Multiplatform Apps"
excerpt: "Learn how to build Kotlin Multiplatform apps for iOS and Android."
date: 2021-03-13
header:
   teaser: "/assets/images/building-kotlin-multiplatform-apps/building-kotlin-multiplatform-apps.jpeg"
categories:
  - kotlin-multiplatform
tags:
  - kotlin-multiplatform
layout: single
author_profile: false
classes: widest
toc: true
toc_label: "Table of Contents"
toc_sticky: true
---

When I first started to learn Kotlin Multiplatform in 2018, I started by trying to build an app that displays a list of videos and plays them for both Android and iOS. I had given a [presentation]("https://speakerdeck.com/heyitsmohit/building-kotlin-muiltiplatform-apps-for-android-and-ios") from my learnings at the Kotlin NYC meetup. During that time, it was challenging to set up network requests, serialization and video playback. I had to use multiple IDEs (XCode, Android Studio, CLion). But, Kotlin Multiplatform has come along far since 2018. In this article, I’ll explore how to build a Kotlin Multiplatform app in 2021 and compare it with my previous experience. 

## Why Kotlin Multiplatform?

I started to explore Kotlin Multiplatform because it allows you to share code between Android and iOS. We solve similar problems on both platforms such as getting data from the network, parsing it, handling analytics and implementing business logic. There are similar libraries and approaches to tackling these problems on both platforms. Solving these problems once is beneficial across Android and iOS.

![code-sharing](/assets/images/building-kotlin-multiplatform-apps/code-sharing.jpeg)

## Use Case

![use-case](/assets/images/building-kotlin-multiplatform-apps/use-case.jpeg){: .align-left}


We’ll build an Android and iOS app that gets data from the network, caches it and displays it in the UI. It's a very simple example of a Kotlin Multiplatform app. 

**Features** 
<br />- Multiplatform API client
<br />- Multiplatform Serilization
<br />- Caching

<br/>
<br/>
<br/>

In our project setup, we will have a shared module containing an API client and logic to cache data. 

![shared-module-apps-structure](/assets/images/building-kotlin-multiplatform-apps/shared-module-apps-structure.jpeg)

How do we set up our project?

## Scaffolding

The Kotlin Multiplatform plugin creates the scaffolding for a project. It will create the following directory structure for a shared module. The structure contains a source set for platform specific logic for iOS (iOSMain) and Android (AndroidMain) and for common code (commonMain). 

![scaffolding](/assets/images/building-kotlin-multiplatform-apps/scaffolding.jpeg)

The build script gives you the ability to specify dependencies for each of your source sets. 

~~~ kotlin
sourceSets {
    val commonMain by getting {
        dependencies {
            ...
        }
    }

    val iosMain by getting {
        dependencies {
              ...
        }
    }

    val androidMain by getting {
        dependencies {
              ...
        }
    }
  }
}
~~~

## Shared Module

We want to create an API client in the shared module that fetches data from the network. 

## Ktor

Under the hood, Ktor uses different ways to make requests based on the platform. If it is JVM it will create an HTTP stream. On the other hand for iOS, `NSURLSession`. 


```kotlin
class ApiClient {

    private val httpClient = HttpClient {
            install(JsonFeature) {
                val json = Json { ignoreUnknownKeys = true }
                serializer = KotlinxSerializer(json)
           }
    }
}
```

## Kotlinx Serialization

For our use case, we want to get a list of users. We’ll define a data transfer object for a user. It contains only two fields - the name and location of the user.

```kotlin
@Serializable
data class User(
    val name: String,
    val location: String,
)
```

The client will have a method to get a list of users for our use case. In order to do this, we’ll define the users endpoint and ask Ktor to make the request.

```kotlin
class ApiClient {

    suspend fun getUsers(): List<User> {
        return httpClient.get(API_ENDPOINT)
    }

    val API_ENDPOINT = “https://api.com/users”
 
}
```

Coroutines have Kotlin Multiplatform support. Therefore, `getUsers` is a suspending method that returns a list of users. 

**A Look Back**<br/><br/>Everything I’ve done so far was actually very challenging when KMM was initially introduced. Back in 2018, I used this library http-client-common to setup network requests. This logic used in the library for using NSURLSession and Http Stream on JVM carried over to Ktor. During that time, multiplatform support for serialization was still under development. A branch existed `example-gen` that was difficult to set up. On iOS, I used the `Codeable` protocol extension. 
{: .notice--warning}

## Setting Up Android App

How will we consume this client on Android? We could create a view model that launches a coroutine and communities with the client to get users. 

```kotlin
class MyViewModel(val api: ApiClient) {

      override fun onCreate() {

         coroutineScope.launch {
              val users = apiClient.getUsers()
              ...
         }
    }
}
```

## Setting Up iOS App

```swift
class MyViewModel {

       let apiClient: ApiClient

       func loadUsers() {
            apiClient.getUsers(completionHandler: { users, error in
                    ...                
                }
            })
        }
}
```

On iOS, I have similarly defined a View Model that gets a list of users. The `getUsers` method in this case has a completion handler. It’s not a suspending method rather you’re passing in a callback. 


## iOS Framework

For iOS, a framework is generated for your shared module that is consumed in the iOS app. 

![ios-framework](/assets/images/building-kotlin-multiplatform-apps/ios-framework.jpeg)

**How is the User class mapped in the framework?**

Kotlin

```kotlin
data class User(val name: String, val location: String)
```

Objective C

```objc
__attribute__((swift_name("User")))
@interface SharedUser : SharedBase
   @property (readonly) NSString *name             
   __attribute__((swift_name("name")));

   @property (readonly) NSString *location             
   __attribute__((swift_name("location")));
@end;
```

There are two classes in the framework - SharedBase and SharedUser. The class names were prefixed by the name of the shared module. It is possible to configure the name. 

The `SharedUser` interface has two read only values defined. For interoperability with Swift, the `swift_name` method is used to specify a clear type name.

**A Look Back**<br/><br/>In my experience of using Kotlin Multiplatform, I found the push back from iOS developers was that it was an Objective-C framework. They wanted to consume a Swift framework to have access to modern languages features in Swift such as value types.
{: .notice--warning}

Thus far, we have built a simple Android and iOS that uses a shared client to get data. We accomplished this by using Ktor, Kotlin serialization library and coroutines.

![code-sharing-2](/assets/images/building-kotlin-multiplatform-apps/code-sharing-2.jpeg)

## Caching

For our use case, we want to cache the returned data in the database. We’ll use the SQL Delight library. It’s a Multiplatform library that provides a driver for Android and iOS. 

![sqldelight-1](/assets/images/building-kotlin-multiplatform-apps/sqldelight-1.jpeg)

In the shared module, we’ll add a sql file which will contain SQL queries and statements to create a `User` table.

![sqldelight-2](/assets/images/building-kotlin-multiplatform-apps/sqldelight-2.jpeg)

```sql 
CREATE TABLE User (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    Location TEXT NOT NULL
);

insertUser:
INSERT INTO User(id, name, location)
VALUES(?, ?, ?);


selectUsers:
SELECT User.*
FROM User
```

These statements allow us to insert a user in the `User` table and get a particular user. SQL Delight library will create a `AppDatabase` object that we will use to perform these operations. In our gradle script, we could specify the name of the database.

![sqldelight-3](/assets/images/building-kotlin-multiplatform-apps/sqldelight-3.jpeg)

```kotlin
sqldelight {
    database("AppDatabase") {
        packageName = "com.learn.kmmapplication.shared.cache"
    }
}
```

We’ll create a wrapper around the generated database. 

```kotlin
class AppCache() {

    private val database = AppDatabase()

    fun getUsers(): List<User> {
             return database.selectUsers().executeAsList()
    }

         fun insertUser(user: User) {
             database.insertUser(
                       id = user.id,
                       name = user.name,
                       location = user.location
         )
}
```

We’ll use this database class in our client. 

```kotlin
class ApiClient {

    suspend fun getUsers(): List<User> {

            val users = database.getUsers()
            
            return if (users.isNotEmpty()) {
                  users
             } else {
                  httpClient.get().also {
                        database.inserUsers(users)
                  }
            }
    }
}
```

## KaMPKit

When I first started using Kotlin Multiplatform in 2018, it was a challenge to build something as simple as I’ve outlined. It's great to see how far in a little time multiplatform support has come. Touchlab has a starter project that makes it easier to integrate it. It has a scaffolding with logging, cocoapods integration and common libraries configured for you. It's very helpful to get you started. 

## Resources

- [Ktor](https://ktor.io/)
- [SQLDelight](https://github.com/cashapp/sqldelight)
- [KaMPKit](https://github.com/touchlab/KaMPKit)
