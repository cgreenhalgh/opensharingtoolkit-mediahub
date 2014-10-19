# Design notes for Unlock

Design notes on unlock functionality, or how to create simple interactive guides and games with variations on a treasure hunt mechanism.

Version 1 marked (v1)

## Item attributes

Shown on new `Unlock` tab.

- locked (default false) (v1)

- lockedShow (default lock+title)
    - nothing - hide from list
    - icon+lock - locked icon (or normal if unspecified) plus generic lock icon
    - icon+lock+title 
    - icon
    - icon+title - like normal
    - lock - just lock icon
    - lock+title (v1)

- lockedIconurl (optional) - alternative icon to use when locked

- unlockedShow (default unlockifnew+title)
    - icon+title - normal
    - icon+unlockifnew+title (v1) - with unlock icon until viewed
    - icon+unlock+title
    - unlockifnew+title

- unlockBy - array of...
    - auto=true - no specific action required
    - request=true - just ask!
    - code=... type=manual (v1)
    - code=... type=qr
    - code=... type=aestheticode
    - url=... - either fragment `#code/...` (for webapp) or full url, perhaps with custom scheme (for installed app)
    - btmac=... - bluetooth mac address
    - btname=... - bluetooth device name
    - wifimac=... - wifi mac address
    - wifissid=... - wifi ssid
    - placeid=... range=... accuracy=... - doc id of place, range in metres, (optional) accuracy in metres (max)
    - attime=... - (can be included in any type) cron-style time pattern 'min hour day-of-month month day-of-week year'
    - duration=... - (if fromtime... specified) w3c period-style duration when unlock method works after fromtime match, e.g. PnnnS (nnnn seconds)

- unlockAfterids - array of ids of things that must be unlocked first

## Global configuration

Also on new (but different) `Unlock` tab of `App`.

- showUnlock (v1) - show unlock view/menu

- unlockModel - metaphor for unlocking
    - unknown+discover
    - lost+find
    - hidden+find
    - locked+unlock (v1)

- unlockReset (v1) (default true) - include reset option

- resetCode - code to reset all items to locked/unviewed (empty -> no code, just confirm)

- lockedIconurl - custom icon (optional)

- unlockedIconurl - custom icon (optional)

- showUnlockBy (v1) - array of unlock methods to show (auto and url aren't requestable)
    - request, manual (v1), qr, aestheticode, bt, wifi, location, time

- unlockManualImageurl - example/prompt image

- unlockQrImageurl - example/prompt image

- unlockAestheticodeImageurl - example/prompt image

- showUnlocked - show list of unlocked things

- showUnlockedifnew - (default true) show list of newly unlocked things

- unlockMany - (default false) allow more than one thing to unlock at once

- onUnlockAlert - (default false) play alert on unlock
    - no, ifnew, yes

- onUnlockPopup - (default false) play alert on unlock
    - no, ifnew, yes

- afterUnlock - when thing unlocked...
    - nothing
    - open (v1)
    - openifnew
    - showUnlocked
    - showUnlockedifnew

- hiddenThingids - array of ids of things to include but not show in top-level list (i.e. only accessible via unlock)

## Client state

Offline client will presume that things are locked/hidden, until it finds out to the contrary (i.e. `unlockTime` and `viewed` default to null). 

Singleton local database item (cf tags) will record unlock time and first view time for each item, i.e. `{ unlockTime: { id: time, ...}, viewed: { id: true, ...} }`.

Proxy `unlockTime` and `viewed` as properties of each thing. 

Option in upload view to send unlock state to server.

Unlock URL could be custom scheme, which if installed as real app could open the app. Or it could be a unique fragment ID, e.g. `#code/...`.

