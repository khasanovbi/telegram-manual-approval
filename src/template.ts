import * as github from '@actions/github'
import type { ParseMode, User } from '@telegraf/types'
import { makeUserLink } from './format'

const actorTemplate = '%%actor%%'
const approverTemplate = '%%approver%%'
const githubRefURLTemplate = '%%github_ref_url%%'
const workflowRunURLTemplate = '%%workflow_run_url%%'

function makeGithubRepoURL(): string {
    return `${github.context.serverUrl}/${github.context.repo.owner}/${github.context.repo.repo}`
}

function makeWorkflowRunURL(): string {
    return `${makeGithubRepoURL()}/actions/runs/${github.context.runId}`
}

function makeGithubRefURL(): string {
    if (process.env.GITHUB_REF_TYPE === 'tag') {
        return `${makeGithubRepoURL()}/releases/tag/${process.env.GITHUB_REF_NAME}`
    }

    return `${makeGithubRepoURL()}/tree/${process.env.GITHUB_REF_NAME}`
}

export interface TemplateContext {
    actor: string
    githubRefURL: string
    workflowRunURL: string
    approver?: string
}

export function template(text: string, context: TemplateContext): string {
    text = text
        .replace(actorTemplate, context.actor)
        .replace(githubRefURLTemplate, context.githubRefURL)
        .replace(workflowRunURLTemplate, context.workflowRunURL)

    if (context.approver) {
        text = text.replace(approverTemplate, context.approver)
    }

    return text
}

export function prepareTemplateContext(actorLink: string): TemplateContext {
    return {
        actor: actorLink,
        githubRefURL: makeGithubRefURL(),
        workflowRunURL: makeWorkflowRunURL()
    }
}

export function templateReplyMessage(
    message: string,
    context: TemplateContext,
    user: User,
    parseMode: ParseMode
): string {
    const approver = makeUserLink(user, parseMode)
    context = {
        ...context,
        approver
    }
    return template(message, context)
}
