# Telegram Manual Approval

[![GitHub Super-Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml)

Obtain manual approval for GitHub Actions workflows through Telegram messages. This action pauses a workflow and requires a manual response via Telegram to continue.

This action is particularly useful for deployment workflows where you want an extra layer of control before proceeding with sensitive operations like production deployment.

## How it works

- When the workflow reaches the `telegram-manual-approval` step, it sends a customisable message containing approval and rejection buttons to a specified Telegram chat.
- User with appropriate permissions can click on the approval or rejection button within Telegram to continue or halt the workflow.
- On approval, the workflow proceeds, and on rejection, the workflow fails and stops.

## Setup

- Create bot for approve with [@BotFather](https://t.me/BotFather).
- Get ID of your chat. You could use [@getmyid_bot](https://t.me/getmyid_bot).
- Save `TELEGRAM_KEY` secret and `TELEGRAM_CHAT_ID` environment variable in organization or repository settings.  

## Usage

To use this action, add the following step to your GitHub Actions workflow:

```yaml
steps:
  - uses: khasanovbi/telegram-manual-approval@v0.0.2
    with:
      telegram-key: ${{ secrets.TELEGRAM_KEY }}
      telegram-chat-id: ${{ vars.TELEGRAM_CHAT_ID }}
      github-to-telegram: |
         githubUsername: telegramUsername
         anotherGitHubUsername: 123456789
      approvers: |
         githubUsername
      super-approvers: |
         anotherGitHubUsername
```

## Settings

Configure the inputs to customize the Telegram message:

### Common settings

- `telegram-key` - Telegram Bot key.
- `telegram-chat-id` - Telegram chat ID to send message.
- `timeout` - Run timeout, in seconds, default 120 seconds.
- `github-to-telegram` - Mapping from GitHub username to telegram username or ID, each pair in new line and separated with colon.
- `allow-self-approve` - Whether or not to filter out the user who initiated the workflow as an approver if they are in the approvers list, default `false`.
- `approvers` - List of GitHub users that allowed to approver or reject deployment, each username in new line.
- `super-approvers` - List of GitHub users that allowed to approver or reject deployment, who can ignore `allow-self-approve` setting, each username in new line. Super approvers automatically include to `approvers` set, don't need to duplicate them.
- `parse-mode` - Mode for parsing Telegram entities, default: `HTML`.

### Message text settings

- `approval-text` - Text of approval message, default: `"%%actor%% wants to <a href=\"%%workflow_run_url%%\">deploy</a> <a href=\"%%github_ref_url%%\">${{ github.event.repository.name }}@${{ github.ref_name }}</a> to production"`.
- `approve-button` - Text of approve button, default: `Approve`.
- `reject-button` - Text of rejection button, default: `Reject`.
- `approved-text` - Text of approved message, default: `Approved by %%approver%%`.
- `rejected-text` - Text of rejected message, default `Rejected by %%approver%%`.
- `timeout-text` - Text of timeout, default `Timeout`.
- `approver-not-found-in-map-text` - Text of unknown approver message, default `%%approver%% you are not found on config map`.
- `approver-permission-denied-text` - Text of permission denied message, default `%%approver%% you can't approve or reject this deployment`.
- `actor-cant-do-self-approve-text` - Text of error message, when actor can't do self approve, default `%%actor%% you can't do self approve`.

Text messages support following template vars:

- `%%actor%%` - The Telegram username or link to user that triggered the initial workflow run. If user not found in `github-to-telegram` mapping, GitHub username would be used.
- `%%approver%%` - The Telegram username of user who click to Approve or Reject button.
- `%%github_ref_url%%` - URL to branch or tag in GitHub.
- `%%workflow_run_url%%` - URL to workflow run.

### Quick example

```yaml
name: Release

on:
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
      - uses: khasanovbi/telegram-manual-approval@v0.0.2
        if: inputs.environment == 'prod'
        with:
          telegram-key: "${{ secrets.TELEGRAM_KEY }}"
          telegram-chat-id: "${{ vars.TELEGRAM_CHAT_ID }}"
          github-to-telegram: |
            githubUsername: telegramUsername
            anotherGitHubUsername: 123456789
          approvers: |
            githubUsername
          super-approvers: |
            anotherGitHubUsername

      - name: Run deploy
        run: |
          echo "Deploy"
```
