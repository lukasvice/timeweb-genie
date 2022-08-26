# Timeweb Genie Neo

A CLI tool to calculate working hours logged in the Time@Web application.

| :warning: WARNING                              |
| ---------------------------------------------- |
| This is a beta release and errors may occur. |

## Installation/Update and Configuration

1. Create a `~/.timeweb-genie.json` file (in your home directory):

   ```json
   {
     "timewebUrl": "https://.../TwNet.dll",
     "username": "...",
     "password": "..."
   }
   ```

   Optional config options:

   - `justificationTypes`: Overwrite the default types to be considered for calculating the working times (array of strings)
   - `justificationTypesToIgnore`: Overwrite the default types to be completely ignored (array of strings)
   - `targetWorkingHours`: Overwrite the default target working hours (number)
   - `targetBreakMinutes`: Overwrite the default lunch break time (number)

2. Run, install or update

   Simply run it with
   ```sh
   npx timeweb-genie-neo
   ```

   *or* install it globally and run it with

   ```sh
   npm install -g timeweb-genie-neo
   timeweb-genie-neo
   ```



## Usage

```sh
npx timeweb-genie-neo [DD/MM/YYYY DD/MM/YYYY]
```

## Contributing

Feel free to send a pull request if you want to add any features or if you find a bug.
Check the issues tab for some potential things to do.

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
