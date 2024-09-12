# Overview

## Commands

1. `cssx` - runs project from within the current directory
2. `cssx build` - builds the cssx files into static html assets, placing them into the output directory specified in the configuration file

## Configuration

Using a `cssx.json` configuration file in the root directory can override the default configuration.

1. `port` (_default: 3000_): The port number for serving local site
2. `routeDir` (_default: "./routes"_): The relative directory path to where the site's route pages can be located
3. `defaultRoute` (_default: "/home"_): The default route for the application. **N.B.**: this needs to match to one of the existing page routes in the site's `routeDir`
4. `assetsDir` (_default: undefined_): Controls whether to serve assets such as images to the app, by providing the directory in which those assets can be found
5. `outputDir` (_default: "./dist"_): The output directory where built files will be placed via the build command

### Example

```json
{
    "port": 3000,
    "routeDir": "./routes",
    "defaultRoute": "/home",
    "assetsDir": "assets",
    "outputDir": "./dist"
}
```

## ToDo

- Handle common CLI args for building project, and running from another directory, etc.
