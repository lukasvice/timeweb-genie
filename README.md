# Timeweb Genie

A CLI tool to calculate working hours logged in the Time@Web application.

| :warning: WARNING                              |
| ---------------------------------------------- |
| This is an alpha release and errors may occur. |

## Installation/Update and Configuration

1. Install (or update)

   ```sh
   npm install -g github:lukasvice/timeweb-genie
   ```

2. Create a `.timeweb-genie.json` file in your home directory:

   ```json
   {
     "timewebUrl": ".../TwNet.dll",
     "username": "...",
     "password": "..."
   }
   ```

   Optional config options:

   - `justificationTypes`: Overwrite the default types to be considered for calculating the working times (array of strings)
   - `targetWorkingHours`: Overwrite the default target working hours (number)
   - `targetBreakMinutes`: Overwrite the default lunch break time (number)

## Usage

```sh
npx timeweb-genie [DD/MM/YYYY DD/MM/YYYY]
```

## Contributing

Feel free to send a pull request if you want to add any features or if you find a bug.
Check the issues tab for some potential things to do.

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
