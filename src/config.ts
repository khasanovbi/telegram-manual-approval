import type { ParseMode } from '@telegraf/types/message'
import * as core from '@actions/core'

export interface TextConfig {
    parseMode: ParseMode
    approvalText: string
    approvedText: string
    rejectedText: string
    timeoutText: string
    approveButtonText: string
    rejectButtonText: string
    approverNotFoundInMapText: string
    approverPermissionDeniedText: string
    actorCantDoSelfApproveText: string
}

export interface GithubToTelegramConfig {
    usernameToUsername: Map<string, string>
    usernameToID: Map<string, number>
}

export interface Config {
    token: string
    chatID: string
    timeoutMs: number
    githubToTelegram: GithubToTelegramConfig
    allowSelfApprove: boolean
    approvers: Set<string>
    superApprovers: Set<string>
    text: TextConfig
}

const parseModes = ['Markdown', 'MarkdownV2', 'HTML'] as const

function parseParseMode(name: string): ParseMode {
    const rawParseMode = core.getInput(name)
    const parseMode = parseModes.find(parseModeItem => parseModeItem === rawParseMode)
    if (parseMode) {
        return parseMode
    }

    throw new Error(`Invalid parse mode ${rawParseMode}.`)
}

function parseRequiredString(name: string): string {
    return core.getInput(name, { required: true })
}

function parseNumber(name: string): number {
    const rawNumber = parseRequiredString(name)
    const number = Number(rawNumber)
    if (isNaN(number)) {
        throw new Error(`can't parse ${name}: ${rawNumber}`)
    }

    return number
}

interface ParsedGithubUsernameTelegramUsernameEntry {
    githubUsername: string
    telegramUsernameOrID: string | number
}

function parseGithubUsernameToTelegramEntityLine(line: string): ParsedGithubUsernameTelegramUsernameEntry {
    let splitParts = line.split(':', 2)
    splitParts = splitParts.map(part => part.trim())

    if (splitParts.length < 2 || splitParts.find(part => part === '') !== undefined) {
        throw new Error(`can't parse github username to telegram entity line: ${line}`)
    }

    return { githubUsername: splitParts[0], telegramUsernameOrID: splitParts[1] }
}

function parseGithubUsernameToTelegramEntity(name: string): GithubToTelegramConfig {
    const multilineInput = core.getMultilineInput(name).filter(item => item !== '')
    const githubUsernameToTelegramUsername = new Map<string, string>()
    const githubUsernameToTelegramID = new Map<string, number>()
    for (const line of multilineInput) {
        const parsedData = parseGithubUsernameToTelegramEntityLine(line)
        const telegramID = Number(parsedData.telegramUsernameOrID)
        if (isNaN(telegramID)) {
            githubUsernameToTelegramUsername.set(parsedData.githubUsername, parsedData.telegramUsernameOrID as string)
        } else {
            githubUsernameToTelegramID.set(parsedData.githubUsername, telegramID)
        }
    }

    return {
        usernameToUsername: githubUsernameToTelegramUsername,
        usernameToID: githubUsernameToTelegramID
    }
}

function parseApprovers(name: string): Set<string> {
    const multilineInput = core.getMultilineInput(name).filter(item => item !== '')
    return new Set<string>(multilineInput)
}

function validateApprovers(approvers: Set<string>, githubToTelegram: GithubToTelegramConfig): void {
    for (const approver of approvers) {
        if (githubToTelegram.usernameToID.get(approver)) {
            continue
        }

        if (githubToTelegram.usernameToUsername.get(approver)) {
            continue
        }

        throw new Error(`Approver ${approver} not found in github-to-telegram`)
    }
}

export function parseConfig(): Config {
    const config = {
        token: parseRequiredString('telegram-key'),
        chatID: parseRequiredString('telegram-chat-id'),
        timeoutMs: parseNumber('timeout') * 1000,
        githubToTelegram: parseGithubUsernameToTelegramEntity('github-to-telegram'),
        allowSelfApprove: core.getBooleanInput('allow-self-approve', { required: true }),
        approvers: parseApprovers('approvers'),
        superApprovers: parseApprovers('super-approvers'),
        text: {
            parseMode: parseParseMode('parse-mode'),
            approvalText: parseRequiredString('approval-text'),
            approvedText: parseRequiredString('approved-text'),
            rejectedText: parseRequiredString('rejected-text'),
            timeoutText: parseRequiredString('timeout-text'),
            approveButtonText: parseRequiredString('approve-button'),
            rejectButtonText: parseRequiredString('reject-button'),
            approverNotFoundInMapText: parseRequiredString('approver-not-found-in-map-text'),
            approverPermissionDeniedText: parseRequiredString('approver-permission-denied-text'),
            actorCantDoSelfApproveText: parseRequiredString('actor-cant-do-self-approve-text')
        }
    }

    validateApprovers(config.approvers, config.githubToTelegram)
    validateApprovers(config.superApprovers, config.githubToTelegram)

    return config
}
