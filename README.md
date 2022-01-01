# Comet

Comet is a zero dependency Cron management app. Schedule and execute shell commands using Cron syntax.

note: there are a few dev dependencies (typescript, nodemon, pkg) but no compiled ones.

# Installation

### 1. Install the binary

*Method 1* - compile from source
```shell
git clone https://github.com/lostVkng/comet
cd comet
npm install
npm run build
```
Clone this directory

Note: requires node.js installed.

```shell
npm run package
```
Build the binary

*Method 2* - Download binary from this repo

Download from releases, the binaries are named for OS, just remove the -ubuntu/-macos/-win from the name.

### 2. Move binary to within PATH
`/usr/local/bin` is popular place for CLI apps, but nothing preventing you from a different directory and adding it to your path.

### 3. Create Daemon to run comet server in the background
Sample Daemon examples are in daemons directory. A daemon will allow comet server to run in the background.

# Usage

```shell
comet list
```
Lists all cron jobs

```shell
comet status
```
Lists all actively running Cron jobs

```shell
comet add -name="xdatafetch.py" "* * * * *" python3 ~/xdatafetch.py
```
Creates a new cron job with name xdatafextch.py. Add jobs require a name to distinguish them. Newly added jobs are automatically set to active.

```shell
comet del xdatafetch.py
```
Kills and deletes job with name xdatafetch.py

```shell
comet start xdatafetch.py
```
Re-activates inactive job named xdatafetch.py. This job will be ran on the next cron interval.

```shell
comet stop xdatafetch.py
```
De-activates active job named xdatafetch.py. This job will not be ran until activated.

```shell
comet kill xdatafetch.py
```
Kills any actively running process for xdatafetch.py job.

```shell
comet server
```
Starts Comet server, this is needed by any daemon manager to run in the background.


# Cron Syntax
Cron syntax allows us to specify when to launch a task with only a space seperated string.

The syntax is seperated as so:
```
minute hour day(month) month day(week)

* any value
, value list seperator
- range of values
/ step values
```

### Examples:
```
'* * * * *'
```
Run every minute/hour/day/month/day of week

```
'5 4 * * *'
```
Run every 4th hour and 5th minute for every day/month/day of week

```
'0 22 * * 1-5'
```
Run at 22h00 every weekday
