import type { ParseMode, User } from '@telegraf/types'
import { GithubUsernameResolver } from './resolver'

export function makeMention(username: string): string {
    return `@${username}`
}

export function makeUserLink(user: User, parseMode: ParseMode): string {
    if (user.username) {
        return makeMention(user.username)
    }

    let fullName = user.first_name
    if (user.last_name) {
        fullName = `${fullName} ${user.last_name}`
    }
    const link = `tg://user?id=${user.id}`

    switch (parseMode) {
        case 'HTML':
            return `<a href="${link}">${fullName}</a>`
        case 'Markdown':
        case 'MarkdownV2':
            return `[${fullName}](${link})`
    }
}

export function makeUsernameForActionStatus(githubUsernameResolver: GithubUsernameResolver, user: User): string {
    const githubUsername = githubUsernameResolver.resolve(user)
    if (githubUsername) {
        return makeMention(githubUsername)
    }

    return `https://t.me/${user.username}`
}
