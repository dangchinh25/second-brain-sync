---
sidebar_position: 1
slug: /
title: My Knowledge Wiki
---

# [My Knowledge Wiki](https://wiki.chinhle.me)

This is my personal wiki where I share everything I know on various topics, exploring the concept of **Second Brain** and **Digital Garden**. This site is built with `Docusaurus`  on [Github](https://github.com/dangchinh25/second-brain). 

Below are all of my notes and their relations visualized.
![](https://i.imgur.com/NhBKkad.png)
![](https://i.imgur.com/Z3SgYBJ.png)

This is definitely not a comprehensive list of ***everything that I know***, but my goal is to get this as close as possible.

## Getting started

This garden is quite literally my second brain with the way multiple pieces got connected and referenced to each other. It includes my thoughts, notes, and links on topics I care about. 

The content here are all markdown files, which can be [found here](https://github.com/dangchinh25/second-brain/tree/main/docs), which after every commit to the [GitHub repo](https://github.com/dangchinh25/second-brain) builds the website using [Docusaurus](tools/docusaurus.md) and publishes it to [wiki.chinhle.me](https://wiki.chinhle.me) from which you are likely reading this page.

I try to learn something and update this everyday, using [this workflow](#workflow). 


## Workflow
I usually take note using [Obsidian](https://obsidian.md/), which works really well with the way I think about stuff because of its *backlink* feature. It also has quite an user base, which continuously build plugin to make the product even better. 

[Obsidian](https://obsidian.md/) saves a copy of my notes locally on my laptop, which then I build [a tool](https://github.com/dangchinh25/second-brain-sync) to automatically parse through the file structure and update [this repo](https://github.com/dangchinh25/second-brain), which then trigger the website to be updated.

For more technical folks, [this tool](https://github.com/dangchinh25/second-brain-sync) is just a *Typescript* script that parse through the file structure and then use *Github API* to create a new branch, commit changes into that branch, create a PR into the main branch, and automatically merge that branch. Everything happen with just 1 command `npm run dev`.

I'm working on to make this workflow more streamlined, easier to use, and more automated, but that's a story for the futre.

## Thank you!
You can find more about me [here](https://chinhle.me).