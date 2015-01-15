# PostSelector User Guide

PostSelector is a WordPress extension for interactively selecting posts to include an an app. (It is likely to be extended in future to allow posts to also be published.) It is designed to be used on a tablet or large screen. It can optionally be networked, i.e. have multiple displays show the selection in progress,

It is currently part of the Wototo Wordpress plugin.
 
## Basic Usage

The plugin also adds a custom type `PostSelector`; this can be used on a tablet or large screen to interactively select posts to include an an app. (It is likely to be extended in future to allow posts to also be published.)

From the admin menu select `PostSelector` > `Add New`. Give the PostSelector a title. In the `PostSelector Settings` box choose a post category as input and an app as output. Now `Publish` the PostSelector.

When you view the PostSelector, below the title and description you should see two buttons: `Open in Browser` and `Open in Browser (readonly)`; click the first, which will open the main PostSelector user interface.

In the PostSelector interface you should see three "lanes": "No", "?" and "Yes"; if the category has any (published) posts in it then they should appear, initially in the middle lane.

To see a post in more detail click on it. To select a post drag it to the "Yes" lane. To save the selection and update the output app click `Save Selection` at the top of the screen. To load any extra newly published posts click `Refresh`.

Note: if you don't have suitable permissions then you should be redirected to a readonly version of the PostSelector view (without the `Refresh` and `Save Selection` buttons).

## Networking PostSelector

You can optionally create "slave" views of the PostSelector screen on other devices. For example, you could run the interactive view on a tablet device, and a slave view on a nearby public screen (or on several networked devices).

To do so, in the `PostSelector Settings` check `Share selection via Union server` and `Update`. Normally you can leave the server as the default (`tryunion.com`). ([Union Platform](http://www.unionplatform.com/) "is a development platform for creating connected applications", and is generally free for limited non-secure use.)

When you view the PostSelector now it will attempt to share its state via the specified Union server. 

If you view the PostSelector using the `Open in Browser (readonly)` option (or view it from a browser what is not logged into wordpress or lacks suitable permissions) then it will open in readonly mode and attempt to get and show the shared selection state.


