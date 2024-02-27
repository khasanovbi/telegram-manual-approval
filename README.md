# Telegram Manual Approval

[![GitHub Super-Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml)

Obtain manual approval for GitHub Actions workflows through Telegram messages. This action pauses a workflow and requires a manual response via Telegram to continue.

This action is particularly useful for deployment workflows where you want an extra layer of control before proceeding with sensitive operations like production deployment.

## How it works

1. When the workflow reaches the `telegram-manual-approval` step, it sends a customisable message containing approval and rejection buttons to a specified Telegram chat.
2. A user with appropriate permissions can click on the approval or rejection button within Telegram to continue or halt the workflow.
3. On approval, the workflow proceeds, and on rejection, the workflow fails and stops.

## Setup

1. Create bot for approve with [@BotFather](https://t.me/BotFather).
2. Get ID of your chat. You could use [@getmyid_bot](https://t.me/getmyid_bot).
3. Save `TELEGRAM_KEY` secret and `TELEGRAM_CHAT_ID` environment variable in organization or repository settings.  

## Usage

To use this action, add the following step to your GitHub Actions workflow:

```yaml
steps:
  - uses: khasanovbi/telegram-manual-approval@v0.0.1
    with:
      TELEGRAM_KEY: ${{ secrets.TELEGRAM_KEY }}
      TELEGRAM_CHAT_ID: ${{ vars.TELEGRAM_CHAT_ID }}
      GITHUB_TO_TELEGRAM: |
         githubUsername: telegramUsername
         anotherGithubUsername: 123456789
      APPROVERS: |
         githubUsername
      SUPER_APPROVERS: |
         anotherGithubUsername
```

## Settings

Configure the inputs to customize the Telegram message:

### Common settings

- `TELEGRAM_KEY` - Telegram Bot key
- `TELEGRAM_CHAT_ID` - Telegram chat ID to send message
- `TIMEOUT` - Run timeout, in seconds, default 120 seconds
- `GITHUB_TO_TELEGRAM` - Mapping from Github username to telegram username or ID, each pair in new line and separated with colon
- `ALLOW_SELF_APPROVE` - Whether or not to filter out the user who initiated the workflow as an approver if they are in the approvers list, default false
- `APPROVERS` - List of Github users that allowed to approver or reject deployment, each username in new line
- `SUPER_APPROVERS` - List of Github users that allowed to approver or reject deployment, who can ignore `ALLOW_SELF_APPROVE` setting, each username in new line. Super approvers automatically include to `APPROVERS` set, don't need to duplicate them.
- `PARSE_MODE` - Mode for parsing Telegram entities, default: `HTML`

### Message text settings

- `APPROVAL_TEXT` - Text of approval message, default: `"%%actor%% wants to <a href=\"%%workflow_run_url%%\">deploy</a> <a href=\"%%github_ref_url%%\">${{ github.event.repository.name }}@${{ github.ref_name }}</a> to production"`
- `APPROVE_BUTTON` - Text of approve button, default: `Approve`
- `REJECT_BUTTON` - Text of rejection button, default: `Reject`
- `APPROVED_TEXT` - Text of approved message, default: `Approved by %%approver%%`
- `REJECTED_TEXT` - Text of rejected message, default `Rejected by %%approver%%`
- `TIMEOUT_TEXT` - Text of timeout, default `Timeout`
- `APPROVER_NOT_FOUND_IN_MAP_TEXT` - Text of unknown approver message, default `%%approver%% you are not found on config map`
- `APPROVER_PERMISSION_DENIED_TEXT` - Text of permission denied message, default `%%approver%% you cant approve or reject this deployment`
- `ACTOR_CANT_DO_SELF_APPROVE_TEXT` - Text of error message, when actor cant do self approve, default `%%actor%% you cant do self approve`

Text messages support following template vars:

- `%%actor%%` - The Telegram username or link to user that triggered the initial workflow run. If user not found in `GITHUB_TO_TELEGRAM` mapping, Github username would be used 
- `%%approver%%` - The Telegram username of user who click to Approve or Reject button 
- `%%github_ref_url%%` - URL to branch or tag in Github
- `%%workflow_run_url%%` - URL to worflow run

### Quick example

```yaml
name: Release

on:
  push:
    tags:
      - v*
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment'
        default: stage
        type: environment
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - uses: khasanovbi/telegram-manual-approval@v0.0.1
        if: inputs.environment == 'prod'
        with:
          TELEGRAM_KEY: "${{ secrets.TELEGRAM_KEY }}"
          TELEGRAM_CHAT_ID: "${{ vars.TELEGRAM_CHAT_ID }}"
          GITHUB_TO_TELEGRAM: |
            githubUsername: telegramUsername
            anotherGithubUsername: 123456789
          APPROVERS: |
            githubUsername
          SUPER_APPROVERS: |
            anotherGithubUsername

      - name: Run deploy
        run: |
          echo "Deploy"
```
