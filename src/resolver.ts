import type { User } from '@telegraf/types'

export interface GithubUsernameResolver {
    resolve(user: User): string
}

export class InmemoryGithubUsernameResolver implements GithubUsernameResolver {
    constructor(
        private readonly telegramUserIDToGithubUsername: Map<number, string>,
        private readonly telegramUsernameToGithubUsername: Map<string, string>
    ) {}

    resolve(user: User): string {
        let githubUsername = this.telegramUserIDToGithubUsername.get(user.id)
        if (githubUsername) {
            return githubUsername
        }

        const telegramUsername = user.username
        if (!telegramUsername) {
            return ''
        }

        githubUsername = this.telegramUsernameToGithubUsername.get(telegramUsername.toLowerCase())
        if (githubUsername) {
            return githubUsername
        }

        return ''
    }
}
