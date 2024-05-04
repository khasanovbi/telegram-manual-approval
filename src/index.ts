import * as core from '@actions/core'
import * as github from '@actions/github'
import { Markup, Telegraf, Telegram } from 'telegraf'
import { Config, parseConfig, TextConfig } from './config'
import { makeMention, makeUserLink, makeUsernameForActionStatus } from './format'
import { AuthorizationBackend, InmemoryAuthorizationBackend } from './auth'
import { awaitTimeout, inverseMap } from './utils'
import { GithubUsernameResolver, InmemoryGithubUsernameResolver } from './resolver'
import { v4 } from 'uuid'
import { prepareTemplateContext, template, TemplateContext, templateReplyMessage } from './template'
import { callbackQuery } from 'telegraf/filters'

async function getActorLink(actor: string, bot: Telegram, config: Config): Promise<string> {
    const username = config.githubToTelegram.usernameToUsername.get(actor)
    if (username) {
        return makeMention(username)
    }

    const userID = config.githubToTelegram.usernameToID.get(actor)
    if (userID) {
        const chatMember = await bot.getChatMember(config.chatID, userID)

        return makeUserLink(chatMember.user, config.text.parseMode)
    }

    return actor
}

function setupBotReply(
    bot: Telegraf,
    authorizationBackend: AuthorizationBackend,
    githubUsernameResolver: GithubUsernameResolver,
    templateContext: TemplateContext,
    approveCallbackData: string,
    rejectCallbackData: string,
    config: TextConfig
): void {
    bot.on(callbackQuery('data'), async ctx => {
        const query = ctx.callbackQuery
        const user = query.from

        const errorString = authorizationBackend.authorize(user)
        if (errorString !== '') {
            await ctx.reply(templateReplyMessage(errorString, templateContext, user, config.parseMode), {
                parse_mode: config.parseMode,
                reply_parameters: {
                    message_id: query.message?.message_id as number
                }
            })

            core.error(`Permission denied: ${errorString}`)

            return
        }

        const username = makeUsernameForActionStatus(githubUsernameResolver, user)

        let replyText
        switch (query.data) {
            case approveCallbackData:
                core.info(`Deploy approved by ${username}`)
                replyText = config.approvedText
                break
            case rejectCallbackData:
                core.setFailed(`Deploy rejected by ${username}`)
                replyText = config.rejectedText
                break
            default:
                core.info(`Unknown callback query data ${query.data}`)
                return
        }

        await ctx.editMessageText(config.approvalText, {
            parse_mode: config.parseMode
        })

        await ctx.reply(templateReplyMessage(replyText, templateContext, user, config.parseMode), {
            parse_mode: config.parseMode,
            reply_parameters: {
                message_id: ctx.callbackQuery.message?.message_id as number
            }
        })

        bot.stop(replyText)
    })
}

async function awaitApprove(
    bot: Telegraf,
    authorizationBackend: AuthorizationBackend,
    githubUsernameResolver: GithubUsernameResolver,
    templateContext: TemplateContext,
    config: Config
): Promise<void> {
    const sessionID = v4()
    const approveCallbackData = `approve:${sessionID}`
    const rejectCallbackData = `reject:${sessionID}`

    setupBotReply(
        bot,
        authorizationBackend,
        githubUsernameResolver,
        templateContext,
        approveCallbackData,
        rejectCallbackData,
        config.text
    )

    const botLaunchPromise = bot.launch()

    core.info(`Send message with text: ${config.text.approvalText}, parse_mode: ${config.text.parseMode}`)

    const textMessage = await bot.telegram.sendMessage(config.chatID, config.text.approvalText, {
        parse_mode: config.text.parseMode,
        ...Markup.inlineKeyboard([
            Markup.button.callback(config.text.approveButtonText, approveCallbackData),
            Markup.button.callback(config.text.rejectButtonText, rejectCallbackData)
        ])
    })

    const messageID = textMessage.message_id

    core.info(`Message ${messageID} sent, await reply or timeout`)

    const timeoutErrorText = 'Timeout'

    try {
        await Promise.race([botLaunchPromise, awaitTimeout(config.timeoutMs, new Error(timeoutErrorText))])
    } catch (error) {
        if (!(error instanceof Error) || error.message !== timeoutErrorText) {
            throw error
        }

        const telegram = bot.telegram

        await telegram.editMessageText(config.chatID, messageID, '', config.text.approvalText, {
            parse_mode: config.text.parseMode
        })

        await telegram.sendMessage(config.chatID, config.text.timeoutText, {
            message_thread_id: textMessage.message_thread_id,
            parse_mode: config.text.parseMode,
            reply_parameters: {
                message_id: messageID
            }
        })

        core.setFailed('Deploy timeout')
        bot.stop('Timeout')
    }
}

export async function run(): Promise<void> {
    try {
        const config = parseConfig()
        const bot = new Telegraf(config.token)
        const actor = github.context.actor.toLowerCase()
        const actorLink = await getActorLink(actor, bot.telegram, config)
        const templateContext = prepareTemplateContext(actorLink)

        config.text.approvalText = template(config.text.approvalText, templateContext)

        const githubUsernameResolver = new InmemoryGithubUsernameResolver(
            inverseMap(config.githubToTelegram.usernameToID),
            inverseMap(config.githubToTelegram.usernameToUsername)
        )

        const authorizationBackend = new InmemoryAuthorizationBackend(
            actor,
            githubUsernameResolver,
            config.allowSelfApprove,
            config.approvers,
            config.superApprovers,
            config.text
        )

        await awaitApprove(bot, authorizationBackend, githubUsernameResolver, templateContext, config)
    } catch (error) {
        // Fail the workflow run if an error occurs
        if (error instanceof Error) {
            core.setFailed(error.message)
        }
    }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run()
