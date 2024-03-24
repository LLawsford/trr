# Foreword
I didn't complete like half of the points in this task. For 3h it is too much for me to handle peacefully :D

# Setup/installation
1. You need to have turbo installed (you don't have to but it's recommended) https://turbo.build/repo/docs/installing
2. Just to further kill my 'security' points, I will leave .env's in the repository - keep in mind, that api for sentences is 3rd party.
This means 2 things: there is some threshold for requests, but I doubt you will cross it and second thing: for some reason it gives a lot of
beauty related sentences (although categories are random)

# Assumptions
1. I took turborepo by default to have access to packages/apps division. There is reusable contracts package.
In couple projects I made, I had most types infered from zod schemas,
I used these types for regular code and schemas for auto-generated openApi + validations (frontend forms, request bodies, mappers etc.) - pretty neat.
2. I manually created a server app - to avoid 'vendor lock' which is Next. It is nice tool and keeping custom express server could be tiresome in future, but for now - this is my choice.
(could be fastify also)
3. No formatter - because 'other devs will join' and they might want to use something specific and because I had some defaults provided by neovim I went with that.

# TODOS/WON'T DO'S

## Tests
There are currently no tests, I had limited time and I rarely do TDD (unless problem fits it)
For tests I'd use vitest for units (as alternative to jest), and playwright for e2e's (as alternative to cypress)

## UI 
I had no contact with FE for a year, I missed it a bit and - I went with tailwind, react table + tanstack, shadcnui.
Should probably pickup picocss to speed-up process a bit, but - stack was chosen mostly for fun.
There is no leaderboard with global scores, no pagination, sorting etc. It is not connected to db (I'd choose postgres with drizzle)
UI has also a lot of bugs, backend too, but I just wanted to do as much as I could in 3h span.

## Security
There is no security, I put helmet and cors in place, but everything around url's is hardcoded, goes with http, no safety at all, but, it only works locally, so I still can sleep.
In future, JWT (tokens combined with Redis cache to quickly invalidate user 'sessions'), OAuth with NextAuth and all the good stuff would be needed (asap, before production :)

## Others
- I never wrote a game and most applications I wrote didn't really need it, but here, it's clear for me that something like xState for state machines would be useful.
To handle states + transitions and catch edge cases (also to test easier)
- Business logic is mixed with implementation, I would love to introduce some form of DDD in future and split it up (once again, easier testing mostly, but project is also ligther to maintain)
- Caching could be added for sentences api for sure, but maybe other parts would benefit on cache also (I'd go with Redis then)
- Whole app should be containerized, probably docker, for easier deployments and unification on another machines. But it works for me, so..
- There is probably more todos I forgot along the way, some are left in the code because I wrote them as I went with this little endevor. 
