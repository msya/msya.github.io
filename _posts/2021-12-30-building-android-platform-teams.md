---
title: "Building Android Platform Teams"
date: 2021-12-31
categories:
  - android
tags:
  - platform
layout: single
author_profile: false
classes: widest
toc: true
toc_label: "Table of Contents"
toc_sticky: true
---

In this article, I will share with you the purpose of a platform team, the responsibilities and how to build it. I’ll share my experiences of working on platform teams and the challenges you’ll encounter. Lastly, I’ll cover fragmentation of large codebases and what role a platform team could play to improve it. At various companies, such a team is called an infrastructure or foundations team. 

### What is an Android platform team?

A platform team’s main responsibility is to help developers build features faster. Teams go through an evolutionary arch of starting small and increasing in size. If you have a small team working on a greenfield project, a platform team is not needed. During that time, you’re more concerned with getting something out fast. But, as the team size increases and the code base gets older, the need for a platform team arises. 

Large teams are broken down into work streams or squads. Each workstream has their own objectives and results they drive. The workstreams will focus on different areas of the product. They will add and maintain existing features.

But, building an Android app at scale is not just about building features. Maintaining an Android codebase involves a lot more infrastructure work. This could be from keeping the builds fast to improving the architecture used by feature teams. We want to provide a safe and smooth runway for feature teams to deliver. That is the ultimate goal of a platform team.

### Motivations for Building a Platform Team

There are several factors that drive the need for a platform. It's not the same reason in each use case. 

As time goes on, tech debt begins to accumulate. It accumulates enough that adding a feature to an area of the codebase becomes complicated. It might require a large refactor. Areas of the codebase become fragile where any change could introduce regressions. This is one of the motivations to build a platform team that addresses these problems. 

Another motivation is to address obstacles in the developer experience. Assume we have about 30 developers that build features. Assume there is no platform team. Suppose a developer updates a Gradle plugin. The upgrades causes out of memory issues for all developers. Getting all thirty developers to work on the issue isn’t scalable. Feature team’s focus is being shifted from their objectives and key results. 

A final motivation I’ll share is preventing fragmentation of design patterns and architecture. In a large codebase, fragmentation of some magnitude will occur. However, large deviations of design patterns in one area of the codebase to another is detrimental to productivity. If at any point one of the workstreams is spinned down, onboarding the developer to another part of the codebase will be difficult. I’ll share more on this in the discussion below.

### How to Build a Platform Team

The first step to building a platform team is to make sure management sees value. If management doesn’t see any value in a platform team, it will be obsolete or shelved. It is your utmost responsibility to convince management of the roadblocks encountered while building features. Management can be your direct manager, Director or VP. There is a process you can take to get all of the data together to put together a good argument for a platform team. 

#### Addressing Challenges

##### Fires & Post Mortems

The first data point to observe are past fires. What problems have come up that have caused release rollbacks? Were there any post mortems? Are there bugs arising that require patches? The most important question to ask is why didn’t we catch it earlier. A platform team’s job is to put infrastructure in place to catch problems earlier. Usually in post mortems, action items are listed. It may be refactoring an abstraction. However, these action items are not done, because there is no team that can focus on it. Take inventory of all the past problems that have arised. 

##### Feature development challenges

Assume a group of developers worked on an important feature. Feature development on Android involves upfront design, scaffolding, coding and QA (manual or unit testing). This is the barebones process. In these stages, find the challenges the team encountered. What I like to do is to prepare a survey that is project focused. The survey has a set of questions. 

What challenges did you encounter in architecting your feature? (It may be MVP, MVI or a custom architecture you’re using.)

Were there any challenges in testing your feature?

What challenges did you encounter in onboarding yourself for this area of the codebase? 

Describe any tech debt you wish you could address that would have made your developer experience better. 

These are open ended questions. Distribute this survey to a group of members that worked on different projects. This type of survey is the most useful I have found to understand the perspective of feature teams. 

So far, you have collected problems that a platform team could work on. However, this is just the start. 

##### Hard Truth

If you’re at a company that only focuses on building features, it is very likely that even with all of these data points, a person will not be convinced of the value of forming a platform team. The pushback may be for any number of reasons from resourcing to budget. When the time to develop a feature becomes unbearable overtime, either feature teams will take on platform work to unblock themselves or finally their problems will have amounted to such extreme that the need for a platform team will be acknowledged.

### Creating a team charter

Assume you’re at a point where you have support for a platform team. You must build a team charter. It is a document that must be concise. You stakeholders range from individuals with no technical background to fellow developers. This document has to be accessible to everyone. 

The charter has the team mission, objective and key results (OKRs) and your first quarter roadmap. Unlike a feature team where a product manager will work with you on what features to build, a platform roadmap is very tricky to create. 

There are two approaches that are usually taken to produce a team charter - top down or bottom up. 

**Top Down Approach**

In the top down approach, the engineering manager works with a director or VP to come up with key performance metrics (KPIs) and objectives. In a silo, he or she attempts to identify key initiatives that will provide the most impact. This approach has both positives and negatives. It is good that a platform team is a forethrough in the minds of leadership. But, the charter must not be a surprise to engineers. It is important to review the charter before finalizing it. Here is an example of a discussion that needs to happen. Assume developers find screenshot testing in the roadmap written by an EM. The developers must question whether the value of setting it up provides a benefit to the team. 

**Bottom Up Approach**

In the bottom up approach, each component of the team charter is created in collaboration with engineers. The engineers are empowered to identify the important problems to solve and which course of action to take. After a draft of the charter is created, it is shared with upper management. This is the approach that I’ve seen work well. 

### Team Charter Components

There are three components to a platform team charter. 

- Code Ownership
- Key Performance Indicators
- Objectives and Key Results
- Roadmap

#### Code ownership

In an Android app, a typical setup for code ownership for the platform is as follows. 

- Architecture/Design Patterns
- Gradle Builds
- Modularization
- Continuous Integration (CI)
- Static Code Analysis tools
- Tech (GraphQL, gRPC)
- Performance

You might be using a particular tech that is specialized to your stack. It might be GraphQL or gRPC etc. The infrastructure work for these tools would be part of the platform. 

**Continuous Integration (CI)**

Automating Android builds for development and release is a skill that not many Android developers have. It is a tedious and frustrating process. It involves different tools and languages that are not related to Android. Sometimes the responsibility of maintaining CI infrastructure is handled by a different team which is primarily composed of SREs and DevOps. 

**Avoid Platform as Full Umbrella**

Platform can become a dumping ground for work that doesn’t fit into other workstreams. Examples are localization, accessibility and security. You must specify in your charter what the platform team will not take on. 

#### Key Performance Metrics (KPIs)

It is very difficult to quantify the work of a platform team. It is very difficult to tie a metric to every type of work a platform team doesn. Sometimes it is easy for projects such as build times. But, there are a set of KPIs that are the base for the platform team. These are service level objectives (SLAs). You must specify SLA if they do not exist. SLA consists of the following.

- Crash crates
- Code coverage
- Performance indicators (Key frames)
- API request time baselines
- Build times

Create a baseline metric for each of these categories.  Is the app performing to standard in each category? These are your base KPIs. However, you must be creative in figuring out KPI based on your Android tech stack. 

#### OKRs and Roadmap

This is the last component of the team charter. What value can you drive for a quarter? Planning the work of a platform team is like walking a highwire. If you take on an initiative that shows no value or results, then the chance of your team being cut or your resources moved to other workstreams becomes a real possibility. You must go back to the data points discussed earlier. Identify the pain points from development to release. 

Take into account the feedback from team surveys. Identify and prioritize key objectives. Make sure to have an explanation as to why each objective is important. For example, it may increase code coverage in a particular area of the code base. Why is that area of the codebase important and is the architecture testable? Question everything, because it will be scrutinized by stakeholders. 

Assume you have a team charter and are ready to start on OKRs. Let’s explore the common work a platform needs to focus on as a code base scales.

### Fragmentation of Design Patterns & Architecture

You may be working on a codebase that is either composed of one app or a collection of apps. The Android ecosystem has evolved a lot since I started working on Android. Codebases are ever changing with newer patterns. However, this process leaves fragmentation in the codebase. 

Assume you have one area of the codebase that uses Model View Presenter setup while another area uses Model View Intent. Another example is that you have patches of areas of code using an older architectural framework while newer code uses an updated version of your internal framework. 

The inherent problem of this fragmentation is onboarding. In an organization, change is constant. A workstream may be dissolved or combined due to business circumstances. The amount of onboarding to familiarize yourself from one area to another will become a problem in feature development. In these circumstances, it is a ripe opportunity for you to mitigate the fragmentation by updating important areas of the code base. 

An important point to consider is the rate at which architectural changes are introduced. If you introduce architectural changes too fast, then it will hinder productivity. Engineers will start asking what is the current accepted patterns to use and confusion will arise. You must perform a balancing act in introducing architectural patterns. 

The usage of custom internal frameworks to build features can be beneficial and detrimental if not handled properly. These frameworks usually provide scaffolding upon which to specify state and handle state changes for building a feature. These frameworks need to be maintained by someone. Examples of popular similar open source frameworks are Mosby by Spotify and Maverick from Airbnb. You must be mindful of how fast you evolve your framework. If it is changed at a fast rate, then it will cause fragmentation in the codebase. The domino effect of the consequences in a large codebase will become hard to manage. It will affect onboarding of new hires as each area of your codebase will be different from one another. 

### Modularization

As a code base size increases, the number of Gradle modules will increase. It is the responsibility of a platform team to maintain how modules are set up and created. You must prevent engineers from copying one Gradle module. You’ll have modules with unused dependencies and plugins. Soon, it will begin to affect your build times. The problem will begin to multiply. Building tools to automate module creation is critical. You must define how a module should be set up. Relying on documentation for this is not a futile effort, because not everyone will read it. You must build tools so that good practices can be automated as part of a developer’s experience. This can be testing, lint tools or command line scripts to scaffold modules. 

### Conclusion

I discussed how to build a platform team. The approach may or may not work for your circumstances. But, I hope it was helpful to you and you were able to take away something from it. 

### Resources

[Mobile at Scale](https://www.mobileatscale.com/)
