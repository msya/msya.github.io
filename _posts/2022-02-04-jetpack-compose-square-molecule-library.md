---
title: "Using Jetpack Compose with Square's Molecule Library"
excerpt: "In this article, we'll learn about how to use techniques from Square's Molecule Library with Jetpack Compose."
date: 2022-02-08
header:
   teaser: "/assets/images/jetpack-compose-molecule-library/jetpack-compose-molecule.png"
categories:
  - mobile
tags:
  - jetpack_compose
layout: single
author_profile: false
classes: widest
toc: true
toc_label: "Table of Contents"
toc_sticky: true
---

In this article, I will share with you how to use patterns introduced by Square’s Molecule library. I’ll share how I used it in a Kotlin multiplatform project I’ve been working on. The multiplatform app communicates with a backend service I built using GraphQL. I'll share my experience so far working with Square's [Molecule library](https://github.com/cashapp/molecule). Check out the projects for this blog post. 

- [Kotlin Multiplatform Project](https://github.com/msya/GolfScoresKMM)
- [GraphQL Backend Server](https://github.com/msya/GolfScores)

## Background

Before I describe how I built the Android app shown below, I want to give you some background and context on it. 

![golf-app](/assets/images/jetpack-compose-molecule-library/golf-app.png){: .align-left}

I wanted to work on a complex app that combined things I enjoyed. I enjoy playing golf. I taught myself how to play golf when I was younger. I played it in school and met a lot of talented people. In golf, there are four major tournaments played every year. One of them is called the Masters. The Masters is a tournament which is held in Augusta, Georgia. 

I built a multiplatform project that simulated a historical golf tournament. It is the 2019 Masters. The 2019 Master is special, because Tiger Woods won his 15th major. It is his most recent major victory. He went through injuries and came back to win the Masters. 


## Problem

Simulating a golf tournament is complex. The most difficult part was not building the mobile apps rather creating the backend service. I only have sparse pieces of data to fit together to simulate the tournament. 


## Solution

I created a backend service in GraphQL that generates a snapshot of the tournament at a particular time. Generating the snapshot was very complex. It required making certain assumptions. The Android app communicates with the backend to request a snapshot of the tournament at a particular time. The stream of data is consumed in the app using a StateFlow with Jetpack Compose. This is done using the Molecule library. Before sharing how the Android app is setup, I'll share the GraphQL service the app comunicated. 

__Data__

These are the only pieces of data that I have for the torunament. 

- The score on each hole for each player in each round.
- The tee times of each player in each round.
- Weather data of each day of the tournament.

I have to make assumptions and fit together these pieces of data to run the simulation. The assumptions I made was that it would take each player 15 minutes to play a par 5, 10 for par 4 and 5 minutes for par 3. With these assumptions, I'm able to interoplate at a given time what hole the player is at, how many players are still on the course and which players have finised the tournament. 

## Backend

The backend service gives you back a snapshot of the golf tournament at a particular time in the past.The service is built using GraphQL. I used GraphQL specifically to explore it. The service is built using the library - [GraphQL-Kotlin](https://github.com/ExpediaGroup/graphql-kotlin). This is the schema provided by the backend service. 

### GraphQL Queries

```graphql
type Query {

      # Returns get players
      players: [Player!]!

      # Return list of scores
      scores(params: TournamentQueryParametersInput!): [PlayerScoreDisplayData!]!

      # Returns tournament information
      tournamentInfo: TournamentInfo!

      # Returns weather data for time
      weather(params: TournamentQueryParametersInput!): WeatherData!
}
```

All the player information could be queried. The scores could be retried for a particular time. Weather data could also be retrieved. 

The most important query is getting the scores. 

```graphql
scores(params: TournamentQueryParametersInput!): [PlayerScoreDisplayData!]!

input TournamentQueryParametersInput {
  time: String!
}

type PlayerScoreDisplayData {
  name: String!
  position: String!
  round: String!
  teeTime: String
  thru: String!
  tot: String!
}
```

The input param should be a past timestamp and a snap of the scores will be given during that time. 

```graphql
query {
     scores(params: { time: "2019-04-11T08:35" }) {
        name
        position
        round
        teeTime
        thru
        tot
    }
}

{
  "data": {
    "scores": [
      {
        "name": "Andrew Landry",
        "position": "-",
        "round": "-",
        "teeTime": "8:30",
        "thru": "1",
        "tot": "-"
      },
      {
        "name": "Adam Long",
        "position": "-",
        "round": "-",
        "teeTime": "8:30",
        "thru": "1",
        "tot": "-"
      },
        …
      ]
}
```

In the app, I have to poll the query above to get scores over from the beginning to the end of the tournament. I should be able to control the rate at which I poll the score query. This is an interesting problem in the app. It allows me to test the simulation by going through it at a specific speed. 

## Multiplatform App

The project is set up as a multiplatform app. The Android and iOS apps communicate with a set of common components. 

![multiplatform](/assets/images/jetpack-compose-molecule-library/multiplatform.png){: .align-left}

### Shared Components

The common components are a time simulator and collection of repositories that make GraphQL calls. 

#### Time Simulator

```kotlin
interface TimeSimulator {

    val timeFlow = MutableSharedFlow<LocalDateTime>(replay = 1)

    fun simulateTime(speed: Int)

}
```

The time simulator allows me to simulate the beginning of a round until the end. Each tick in the simulator is a timestamp emitted from the flow. This component is internal in the Kotlin Multiplatform shared library. However, all interactions are done through a single interface that defines the API which is the tournament simulator.

#### Tournament Simulator

```kotlin
interface TournamentSimulator {

   fun simulate(speed: Int): Flow<Result<List<GetScoresQuery.Score>>>

   fun getTournamentInfo(): Flow<Result<GetTournamentInfoQuery.TournamentInfo>>

   fun getPlayers(): Flow<Result<List<GetPlayersQuery.Player>>>

}
```

The API allows you to get scores, player and tournament information. 

## Android App Architecture 

Each screen in the app follows the setup shown below.

![event-presenter-flow](/assets/images/jetpack-compose-molecule-library/event-presenter-flow.png){: .align-left}

The presenter provides a model to composable function. The model is provided by following the pattern specified in Square’s molecule library.

### Molecule Presenter

Each presenter in the app has a composable function that takes in a flow of events and returns a model. 

```kotlin
interface MoleculePresenter<Event, Model> {

   @Composable
   fun present(events: Flow<Event>): Model

}
```

All presenters use the interface above. This pattern is highlighted in the blog post [The state of managing state (with Compose)](https://code.cash.app/the-state-of-managing-state-with-compose).

## Scores Feature Setup

I'll share how the scores tab is setup and how it uses Molecule. 

![golf-app](/assets/images/jetpack-compose-molecule-library/golf-app.png)

Each row displays a player's total and current score and their tee time. The list is updated as the the GraphQL query is performed every time at a certain interval. I created a comoposable function that takes the information and displays a table.

```kotlin
@Composable
fun ScoresListView(scores: List<GetScoresQuery.Score>) {
    LazyColumn {
        stickyHeader {
            Row {
                ScoreHeader(text = stringResource(id = R.string.pos))
                ScoreHeader(text = stringResource(id = R.string.player))
                ScoreHeader(text = stringResource(id = R.string.total))
                ScoreHeader(text = stringResource(id = R.string.thru))
                ScoreHeader(text = stringResource(id = R.string.round))
            }
        }
        items(scores) { score ->
            Row {
                ScoreCell(text = score.position)
                ScoreCell(text = score.name)
                ScoreCell(text = score.tot)
                ScoreCell(text = score.thru)
                if (score.teeTime != null) {
                    ScoreCell(text = score.teeTime)
                } else {
                    ScoreCell(text = score.round)
                }
            }
            Divider()
        }
    }
}
```

### Scores Presenter

The screen presenter takes in a flow of scores. Inside a launched effect, the flow is collected. Based upon the result of the emission, a model is generated.

```kotlin
class ScoresPresenter : MoleculePresenter<Result> {

   @Composable
   override fun present(events: Flow<Result>): ScoresModel {

       var scoresModel: ScoresModel by remember { 
            mutableStateOf(ScoresModel.Loading) 
       }

       LaunchedEffect(Unit) {
           events.collect {
               it.fold({
                   scoresModel = ScoresModel.Success(it)
               }) {
                   scoresModel = ScoresModel.Error(R.string.error_loading_scores)
               }
           }
       }

       return scoresModel
   }
}
```

The composable function below takes the model and specifies what to show based on where it was a loading, success or error state.


```kotlin
@Composable
fun ScoresSection(model: ScoresModel) {
    when (model) {
        ScoresModel.Loading -> {
            ...
        }
        is ScoresModel.Success -> {
            ScoresListView(scores = (model as ScoresModel.Success).scores)
        }
        is ScoresModel.Error -> {
            ...
        }
    }
}
```

### Launching Molecules

How do we start the process of consuming the event and hooking it up with the view? My initial approach was to launch a molecule and provide it to the composable. 

```kotlin
val scoresModels: StateFlow<ScoreModel> = scope.launchMolecule {
   val scoresFlow = tournamentSimulator.simulate(speed = 1000)
   scoresPresenter.present(events = scoresFlow)
}

ScoresScreen(
   scoresModels
)

```

Each screen took a flow of models and all the molecules were launched in the activity. 


#### Players Screen

```kotlin
val playerModels = scope.launchMolecule {
   val playersFlow = tournamentSimulator.getPlayers()
   playersPresenter.present(events = playersFlow)
}

PlayersScreen(playerModels)
```

#### Weather Screen

```kotlin
val weatherModels = scope.launchMolecule {
   val weatherFlow = weatherSimulator.simulate(speed = 1000)
   weatherPresenter.present(weatherFlow)
}

WeatherScreen(weatherModels)
```

## Open Questions

There are several questions I thought about related to scalability in a larger app when trying out Molecule library.

- In this app, I had launched only 4 molecules for each screen in the page. In a complex UI, would all the molecules be launched at the activity level? 

- What does dependency injection look like in a compose world? Do you inject dependencies at the root level and propagate them down into your composable functions? 

## Launching Molecules Refactor

For my use case, I don’t actually need to launch molecules. I could wrap the flow in a remember method and provide it to the presenter to generate a model.

```kotlin
val scoresFlow = remember { 
   tournamentSimulator.simulate(speed = 1000) 
}

val scoresModel = scoresPresenter.present(events = scoresFlow)

ScoresScreen(
   tournamentInfoModel,
   scoresModel
)
```

I am still using the pattern of having a presenter with a composable method that returns a model. 

```kotlin
interface MoleculePresenter<Event, Model> {

   @Composable
   fun present(events: Flow<Event>): Model

}
```

This is a nice pattern that I'll continue to try out as the library evovles. 

## Conclusion

I hope this blog post was useful to look at how patterns in the Molecule library could be used. Having a presenter with a composable function that takes in a flow of events and returns a model is a nice pattern. The library is currently in it version 0.1.0. Check out the library and try it out!

## Resources

- [The state of managing state (with Compose)](https://code.cash.app/the-state-of-managing-state-with-compose)
- [Molecule](https://github.com/cashapp/molecule)
- [Kotlin Multiplatform Project](https://github.com/msya/GolfScoresKMM)
- [GraphQL Backend Server](https://github.com/msya/GolfScores)

